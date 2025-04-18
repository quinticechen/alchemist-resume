
import React from 'react';
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Loader2, Send } from "lucide-react";
import SeekerAnimation from "@/components/SeekerAnimation";
import SeekerChatMessage from "./SeekerChatMessage";
import ErrorMessage from "./ErrorMessage";
import type { ChatMessage } from "@/hooks/use-seeker-dialog";

interface SeekerChatSheetProps {
  chats: ChatMessage[];
  inputValue: string;
  isLoading: boolean;
  isRetrying: boolean;
  apiError: string | null;
  analysisId: string | null;
  currentThreadId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  setInputValue: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onGenerateSuggestion: () => void;
  onRetry: () => void;
  onApplySuggestion: (suggestion: string) => void;
  sheetDescriptionId: string;
}

const SeekerChatSheet: React.FC<SeekerChatSheetProps> = ({
  chats,
  inputValue,
  isLoading,
  isRetrying,
  apiError,
  analysisId,
  currentThreadId,
  messagesEndRef,
  setInputValue,
  onKeyDown,
  onSend,
  onGenerateSuggestion,
  onRetry,
  onApplySuggestion,
  sheetDescriptionId
}) => {
  // Filter out system messages for display and deduplicate messages
  const displayChats = chats
    .filter(chat => chat.role !== 'system');
  
  return (
    <SheetContent className="w-[400px] sm:w-[540px] overflow-hidden flex flex-col" aria-describedby={sheetDescriptionId}>
      <SheetHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SeekerAnimation width={50} height={50} />
            <SheetTitle>Chat with Seeker</SheetTitle> {/* Changed from "Chat with Alchemy Ooze" to match the character */}
          </div>
        </div>
      </SheetHeader>
      
      <ScrollArea className="flex-1 p-4 mt-2 mb-4" id={sheetDescriptionId}>
        <div className="flex flex-col gap-4">
          {displayChats.map((chat, index) => (
            <SeekerChatMessage 
              key={`${chat.threadId || ''}-${index}`}
              chat={chat}
              onApplySuggestion={onApplySuggestion}
              index={index}
            />
          ))}
          
          {apiError && (
            <ErrorMessage 
              message={apiError} 
              onRetry={onRetry} 
              isRetrying={isRetrying}
            />
          )}
          
          {!analysisId && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              <p className="font-medium">Unable to find resume analysis ID</p>
              <p className="text-sm mt-1">Try refreshing the page or navigating back to the resume list.</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="border-t pt-4 pb-2 space-y-4">
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2"
          onClick={onGenerateSuggestion}
          disabled={isLoading || !analysisId}
        >
          <Lightbulb className="h-4 w-4" />
          Generate Suggestion for Current Section
        </Button>
        
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask for resume advice..."
            className="resize-none"
            disabled={isLoading || !analysisId}
          />
          <Button 
            size="icon" 
            onClick={onSend} 
            disabled={isLoading || inputValue.trim() === '' || !analysisId}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {isLoading && <p className="text-sm text-muted-foreground">AI is thinking...</p>}
        
        {currentThreadId && (
          <p className="text-xs text-muted-foreground">
            Thread ID: {currentThreadId.substring(0, 12)}...
          </p>
        )}
        {analysisId && (
          <p className="text-xs text-muted-foreground">
            Analysis ID: {analysisId.substring(0, 8)}...
          </p>
        )}
      </div>
    </SheetContent>
  );
};

export default SeekerChatSheet;
