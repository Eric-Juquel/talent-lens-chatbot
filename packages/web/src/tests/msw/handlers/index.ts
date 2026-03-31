import { uploadHandlers } from './upload';
import { chatHandlers } from './chat';
import { summaryHandlers } from './summary';

export const handlers = [...uploadHandlers, ...chatHandlers, ...summaryHandlers];
