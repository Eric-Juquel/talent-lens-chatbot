import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class import for injection token
import { ChatService } from './chat.service';
import type { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'chat', summary: 'Send a message to the AI assistant' })
  @ApiResponse({ status: 200, description: 'AI response', type: ChatResponseDto })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async chat(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
    return this.chatService.chat(dto);
  }
}
