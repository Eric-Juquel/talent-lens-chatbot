import { create } from 'zustand';
import type { ChatMessage, UploadResponse } from '@/api/model/upload';
import type { SummaryResponse } from '@/api/model/summary';

export type WizardStep = 1 | 2 | 3;
export type StoredMessage = ChatMessage & { id: string };

interface TalentState {
  step: WizardStep;
  setStep: (s: WizardStep) => void;

  uploadResult: UploadResponse | null;
  setUploadResult: (r: UploadResponse) => void;

  chatHistory: StoredMessage[];
  addChatMessage: (msg: ChatMessage) => void;

  summaryResult: SummaryResponse | null;
  setSummaryResult: (r: SummaryResponse) => void;

  reset: () => void;
}

const initialState = {
  step: 1 as WizardStep,
  uploadResult: null,
  chatHistory: [] as StoredMessage[],
  summaryResult: null,
};

export const useTalentStore = create<TalentState>()((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setUploadResult: (uploadResult) => set({ uploadResult }),
  addChatMessage: (msg) =>
    set((state) => ({ chatHistory: [...state.chatHistory, { ...msg, id: crypto.randomUUID() }] })),
  setSummaryResult: (summaryResult) => set({ summaryResult }),
  reset: () => set(initialState),
}));
