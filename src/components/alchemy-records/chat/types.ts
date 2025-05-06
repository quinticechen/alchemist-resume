
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

// Updated MessageListProps to include className
export interface MessageListProps {
  messages: ChatMessage[];
  analysisId?: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

// Added for cleaner layout implementation
export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}
