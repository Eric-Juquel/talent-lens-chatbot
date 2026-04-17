import { Injectable, Logger } from "@nestjs/common";
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class import
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import type { ChatMessage, ChatRequest } from "./dto/chat-request.dto";
import type { ChatResponse } from "./dto/chat-response.dto";

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "record_user_details",
      description:
        "Use this tool to record that a recruiter is interested in being in touch and provided an email address",
      parameters: {
        type: "object",
        properties: {
          email: {
            type: "string",
            description: "The email address of this recruiter",
          },
          name: {
            type: "string",
            description: "The recruiter's name, if provided",
          },
          notes: {
            type: "string",
            description: "Any additional context about the conversation",
          },
        },
        required: ["email"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_unknown_question",
      description:
        "Always use this tool to record any question that couldn't be answered",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The question that couldn't be answered",
          },
        },
        required: ["question"],
        additionalProperties: false,
      },
    },
  },
];

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI;

  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>("OPENAI_BASE_URL");
    this.model = this.config.get<string>("OPENAI_MODEL", "gpt-4o-mini");
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>("OPENAI_API_KEY"),
      ...(baseURL ? { baseURL } : {}),
    });
  }

  async chat(dto: ChatRequest): Promise<ChatResponse> {
    const systemPrompt = this.buildSystemPrompt(
      dto.context,
      dto.lang,
      dto.candidateName,
    );

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...dto.history.map((m: ChatMessage) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: dto.message },
    ];

    let done = false;
    while (!done) {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        tools: TOOLS,
        tool_choice: "auto",
      });

      const choice = response.choices[0];

      if (
        choice.finish_reason === "tool_calls" &&
        choice.message.tool_calls?.length
      ) {
        messages.push({
          role: "assistant",
          content: choice.message.content,
          tool_calls: choice.message.tool_calls,
        });

        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.type !== "function") continue;
          const args = JSON.parse(toolCall.function.arguments) as Record<
            string,
            unknown
          >;
          const result = this.handleToolCall(toolCall.function.name, args);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
      } else {
        done = true;
        const content = choice.message.content ?? "";
        return { reply: this.sanitizeReply(content, dto.lang) };
      }
    }

    return { reply: "" };
  }

  private buildSystemPrompt(
    context: string,
    lang: string,
    candidateName: string,
  ): string {
    const name = candidateName || "the candidate";
    const langLabel = lang.startsWith("fr") ? "French" : "English";

    return `You are acting as ${name}. You answer questions on ${name}'s profile page, particularly about their career, background, skills and experience.
Represent ${name} faithfully, speaking in the first person as if you are ${name}.
Be professional and engaging, as if talking to a potential employer or recruiter.
You rely EXCLUSIVELY on the documents provided below. NEVER invent information.
IMPORTANT: Always respond in ${langLabel}. Never output raw JSON — always use natural prose.
If you cannot answer a question from the documents, use the record_unknown_question tool to log it, then politely explain you don't have that information.
If the recruiter seems interested in getting in touch, invite them to share their email and record it with the record_user_details tool.

## Candidate documents:
${context}`;
  }

  private sanitizeReply(content: string, lang: string): string {
    const trimmed = content.trim();

    // Case 1: entire response is a JSON tool call (model doesn't support function calling)
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        JSON.parse(trimmed);
        this.logger.warn(
          "Model returned raw JSON as reply — likely unsupported tool call format",
        );
        return lang.startsWith("fr")
          ? "Je suis désolé, je n'ai pas pu traiter cette question. Pourriez-vous la reformuler ?"
          : "I'm sorry, I couldn't process that question. Could you rephrase it?";
      } catch {
        // Not valid JSON, treat as regular text
      }
    }

    // Case 2: JSON tool call embedded inside a text response
    // Strips patterns like: {"name": "record_unknown_question", "parameters": {...}}
    const withoutInlineJson = trimmed
      .replaceAll(/\{["']?name["']?\s*:\s*["']record_\w+["'][^}]*\}/g, "")
      .trim();
    if (withoutInlineJson !== trimmed) {
      this.logger.warn(
        "Model embedded tool call JSON in text response — stripped",
      );
      return withoutInlineJson.replaceAll(/\s{2,}/g, " ").trim();
    }

    return trimmed;
  }

  private handleToolCall(name: string, args: Record<string, unknown>): string {
    if (name === "record_user_details") {
      this.logger.log(
        `[Tool] record_user_details: email=${String(args.email)}, name=${String(args.name ?? "N/A")}`,
      );
    } else if (name === "record_unknown_question") {
      this.logger.log(
        `[Tool] record_unknown_question: ${String(args.question)}`,
      );
    }
    return JSON.stringify({ recorded: "ok" });
  }
}
