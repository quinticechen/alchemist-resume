
import React from 'react';
import { User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import { ChatMessage, MessageListProps } from './types';
import { useTranslation } from "react-i18next";

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  analysisId, 
  messagesEndRef,
  className = "" 
}) => {
  const { t } = useTranslation(['resume-refine']);
  
  const getMessageContent = (message: ChatMessage): string => {
    // Check if the message content is a translation key
    if (message.content.startsWith('aiChat.')) {
      return t(message.content);
    }
    return message.content;
  };
  
  return (
    <ScrollArea className={`flex-1 pr-2 ${className}`}>
      <div className="space-y-4 mb-4">
        {messages.filter(msg => msg.role !== 'system').map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`rounded-lg p-3 max-w-[85%] ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}
            >
              <div className="flex gap-2 items-start">
                <p className="whitespace-pre-wrap text-sm">{getMessageContent(message)}</p>
                {message.role === 'user' && <User className="h-4 w-4 flex-shrink-0 mt-1" />}
              </div>
            </div>
          </div>
        ))}
        
        {!analysisId && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Analysis ID not found. Some features may be limited.</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;
