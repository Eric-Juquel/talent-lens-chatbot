import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import { useTalentStore } from '@/shared/stores/talent.store';
import { uploadService } from '@/api/services/upload.service';
import { chatService } from '@/api/services/chat.service';
import { summaryService } from '@/api/services/summary.service';
import { ApiError } from '@/api/client/axios.client';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { StepIndicator } from '../components/StepIndicator';
import { DropZone, DOCUMENT_MIMETYPES } from '../components/DropZone';
import { ChatBubble } from '../components/ChatBubble';
import { LinkBadge } from '../components/LinkBadge';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { step, setStep, uploadResult, setUploadResult, chatHistory, addChatMessage, summaryResult, setSummaryResult } =
    useTalentStore();

  // Step 1 — files
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);

  // Loading states
  const [uploading, setUploading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Chat input
  const [message, setMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages — chatHistory is intentional to re-run on each new message
  // biome-ignore lint/correctness/useExhaustiveDependencies: chatHistory triggers scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Build context from upload result
  const buildContext = useCallback(() => {
    if (!uploadResult) return '';
    const parts = [uploadResult.cv];
    if (uploadResult.letter) parts.push(uploadResult.letter);
    if (uploadResult.linkedin) parts.push(uploadResult.linkedin);
    return parts.join('\n\n---\n\n');
  }, [uploadResult]);

  // Step 1 → 2: Upload
  const handleAnalyze = useCallback(async () => {
    if (!cvFile) return;
    setUploading(true);
    setStep(2);
    try {
      const result = await uploadService.uploadFiles(
        cvFile,
        letterFile ?? undefined,
        linkedinFile ?? undefined,
      );
      setUploadResult(result);

      // Generate summary during step 2 — block until done (or error)
      const context = [result.cv, result.letter, result.linkedin].filter(Boolean).join('\n\n---\n\n');
      const summary = await summaryService.generateSummary(context, i18n.language).catch(() => null);
      if (summary) setSummaryResult(summary);

      // Move to step 3 and greet
      setStep(3);
      addChatMessage({ role: 'assistant', content: t('chat.greeting') });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('errors.upload');
      toast.error(msg);
      setStep(1);
    } finally {
      setUploading(false);
    }
  }, [cvFile, letterFile, linkedinFile, setStep, setUploadResult, setSummaryResult, addChatMessage, t, i18n.language]);

  // Step 3: Send chat message
  const handleSendMessage = useCallback(async () => {
    const text = message.trim();
    if (!text || chatLoading) return;
    setMessage('');
    addChatMessage({ role: 'user', content: text });
    setChatLoading(true);
    try {
      const { reply } = await chatService.sendMessage({
        message: text,
        history: chatHistory,
        context: buildContext(),
        lang: i18n.language,
        candidateName: summaryResult?.name || uploadResult?.candidateName || '',
      });
      addChatMessage({ role: 'assistant', content: reply });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('errors.chat');
      toast.error(msg);
    } finally {
      setChatLoading(false);
    }
  }, [message, chatLoading, addChatMessage, chatHistory, buildContext, t, i18n.language, summaryResult?.name, uploadResult?.candidateName]);

  // Step 3 → Summary
  const handleSeeSummary = useCallback(async () => {
    // Already pre-generated — navigate immediately
    if (summaryResult) {
      void navigate('/summary');
      return;
    }
    setSummaryLoading(true);
    try {
      const summary = await summaryService.generateSummary(buildContext(), i18n.language);
      setSummaryResult(summary);
      void navigate('/summary');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('errors.summary');
      toast.error(msg);
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryResult, buildContext, setSummaryResult, navigate, t, i18n.language]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  return (
    <div className='mx-auto max-w-2xl px-4 py-6'>
      <StepIndicator currentStep={step} />

      {/* ── Step 1: Upload ─────────────────────────────────── */}
      {step === 1 && (
        <div className='flex flex-col gap-6'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-foreground'>{t('upload.title')}</h1>
            <p className='mt-1 text-sm text-muted-foreground'>{t('upload.subtitle')}</p>
          </div>

          <div className='flex flex-col gap-5 rounded-xl border border-border bg-card p-6'>
            <DropZone
              label={t('upload.cv.label')}
              hint={t('upload.cv.hint')}
              dropText={t('upload.cv.drop')}
              browseText={t('upload.cv.browse')}
              file={cvFile}
              onFile={setCvFile}
              acceptedTypes={DOCUMENT_MIMETYPES}
            />
            <DropZone
              label={t('upload.letter.label')}
              hint={t('upload.letter.hint')}
              dropText={t('upload.letter.drop')}
              browseText={t('upload.letter.browse')}
              file={letterFile}
              onFile={setLetterFile}
              optional
              acceptedTypes={DOCUMENT_MIMETYPES}
            />
            <DropZone
              label={t('upload.linkedin.label')}
              hint={t('upload.linkedin.hint')}
              dropText={t('upload.linkedin.drop')}
              browseText={t('upload.linkedin.browse')}
              file={linkedinFile}
              onFile={setLinkedinFile}
              optional
            />
          </div>

          <Button
            onClick={() => void handleAnalyze()}
            disabled={!cvFile || uploading}
            size='lg'
            className='w-full'
          >
            {uploading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
                {t('upload.analyzing')}
              </>
            ) : (
              t('upload.analyze')
            )}
          </Button>
        </div>
      )}

      {/* ── Step 2: Analyse ────────────────────────────────── */}
      {step === 2 && (
        <div className='flex flex-col gap-6'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-foreground'>{t('analyse.title')}</h1>
          </div>

          {uploading || !uploadResult ? (
            <div className='flex flex-col gap-4 rounded-xl border border-border bg-card p-6'>
              <div
                role='status'
                aria-live='polite'
                className='flex items-center gap-3 text-sm text-muted-foreground'
              >
                <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
                {t('analyse.loading')}
              </div>
              <div className='flex flex-col gap-2'>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className='h-4 w-full' />
                ))}
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-4 rounded-xl border border-border bg-card p-6'>
              <p className='text-sm font-medium text-foreground'>{t('analyse.links')}</p>
              {uploadResult.detectedLinks.length > 0 ? (
                <div className='flex flex-wrap gap-2'>
                  {uploadResult.detectedLinks.map((link) => (
                    <LinkBadge key={link.url} link={link} />
                  ))}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>{t('analyse.noLinks')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Chat ───────────────────────────────────── */}
      {step === 3 && (
        <div className='flex flex-col gap-4'>
          <div className='text-center'>
            <h1 className='text-xl font-bold text-foreground'>{t('chat.title')}</h1>
            <p className='mt-1 text-sm text-muted-foreground'>{t('chat.subtitle')}</p>
          </div>

          {/* Detected links */}
          {uploadResult && uploadResult.detectedLinks.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {uploadResult.detectedLinks.map((link) => (
                <LinkBadge key={link.url} link={link} />
              ))}
            </div>
          )}

          {/* Chat messages */}
          <div className='flex h-[380px] flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-4'>
            {chatHistory.length === 0 ? (
              <div className='flex flex-1 items-center justify-center'>
                <p className='text-sm text-muted-foreground'>{t('chat.subtitle')}</p>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: messages are append-only
                <ChatBubble key={i} message={msg} candidateName={summaryResult?.name || uploadResult?.candidateName} />
              ))
            )}
            {chatLoading && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className='flex gap-2'>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder')}
              disabled={chatLoading}
              rows={2}
              className='flex-1 resize-none'
            />
            <Button
              onClick={() => void handleSendMessage()}
              disabled={!message.trim() || chatLoading}
              size='icon'
              className='h-auto shrink-0 self-stretch'
              aria-label={t('chat.send')}
            >
              <Send className='h-4 w-4' aria-hidden='true' />
            </Button>
          </div>

          {/* See Summary */}
          <Button
            onClick={() => void handleSeeSummary()}
            disabled={summaryLoading}
            variant='outline'
            className='w-full'
          >
            {summaryLoading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
                {t('chat.generatingSummary')}
              </>
            ) : (
              t('chat.seeSummary')
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
