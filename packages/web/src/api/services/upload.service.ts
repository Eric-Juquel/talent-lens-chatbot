import { apiClient } from '@/api/client/axios.client';
import type { UploadResponse } from '@/api/model/upload';

export const uploadService = {
  uploadFiles: async (cv: File, letter?: File, linkedin?: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('cv', cv);
    if (letter) formData.append('letter', letter);
    if (linkedin) formData.append('linkedin', linkedin);

    const { data } = await apiClient.post<UploadResponse>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
