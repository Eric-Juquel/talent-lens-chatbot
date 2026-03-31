export interface DetectedLink {
  label: string;
  url: string;
  type: 'github' | 'linkedin' | 'portfolio' | 'other';
}

export interface UploadResponse {
  cv: string;
  letter: string;
  linkedin: string;
  detectedLinks: DetectedLink[];
  candidateName: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
