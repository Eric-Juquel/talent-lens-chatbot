import { describe, it, expect, beforeEach } from 'vitest';
import { useTalentStore } from '../talent.store';

beforeEach(() => {
  useTalentStore.getState().reset();
});

describe('useTalentStore', () => {
  describe('initial state', () => {
    it('starts at step 1', () => {
      expect(useTalentStore.getState().step).toBe(1);
    });

    it('has null uploadResult', () => {
      expect(useTalentStore.getState().uploadResult).toBeNull();
    });

    it('has empty chatHistory', () => {
      expect(useTalentStore.getState().chatHistory).toHaveLength(0);
    });

    it('has null summaryResult', () => {
      expect(useTalentStore.getState().summaryResult).toBeNull();
    });
  });

  describe('setStep', () => {
    it('updates step to 2', () => {
      useTalentStore.getState().setStep(2);
      expect(useTalentStore.getState().step).toBe(2);
    });

    it('updates step to 3', () => {
      useTalentStore.getState().setStep(3);
      expect(useTalentStore.getState().step).toBe(3);
    });
  });

  describe('setUploadResult', () => {
    it('stores the upload result', () => {
      const result = {
        cv: 'CV content',
        letter: '',
        linkedin: '',
        detectedLinks: [],
        candidateName: 'John Doe',
      };
      useTalentStore.getState().setUploadResult(result);
      expect(useTalentStore.getState().uploadResult).toEqual(result);
    });
  });

  describe('addChatMessage', () => {
    it('appends a user message', () => {
      useTalentStore.getState().addChatMessage({ role: 'user', content: 'Hello' });
      expect(useTalentStore.getState().chatHistory).toHaveLength(1);
      expect(useTalentStore.getState().chatHistory[0]).toMatchObject({ role: 'user', content: 'Hello' });
    });

    it('appends multiple messages in order', () => {
      useTalentStore.getState().addChatMessage({ role: 'user', content: 'Hello' });
      useTalentStore.getState().addChatMessage({ role: 'assistant', content: 'Hi there' });
      const history = useTalentStore.getState().chatHistory;
      expect(history).toHaveLength(2);
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
    });
  });

  describe('setSummaryResult', () => {
    it('stores the summary result', () => {
      const summary = {
        name: 'Jane Doe',
        title: 'Engineer',
        location: 'Lyon',
        summary: 'Great engineer',
        education: 'MSc',
        skills: [],
        aiInsight: 'Hire her',
      };
      useTalentStore.getState().setSummaryResult(summary);
      expect(useTalentStore.getState().summaryResult).toEqual(summary);
    });
  });

  describe('reset', () => {
    it('clears all state back to initial values', () => {
      useTalentStore.getState().setStep(3);
      useTalentStore.getState().addChatMessage({ role: 'user', content: 'Test' });
      useTalentStore.getState().setUploadResult({
        cv: 'CV',
        letter: '',
        linkedin: '',
        detectedLinks: [],
        candidateName: 'John',
      });

      useTalentStore.getState().reset();

      const state = useTalentStore.getState();
      expect(state.step).toBe(1);
      expect(state.uploadResult).toBeNull();
      expect(state.chatHistory).toHaveLength(0);
      expect(state.summaryResult).toBeNull();
    });
  });
});
