
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface OptimizationProps {
  optimizationData: any;
  analysisId?: string;
}
