
import React from 'react';
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import OozeAnimation from "@/components/OozeAnimation";
import SeekerChatMessage from "./SeekerChatMessage";
import type { ChatMessage } from "@/hooks/use-seeker-dialog";

interface OozeChatSheetProps {
  chats: ChatMessage[];
  inputValue: string;
  isLoading: boolean;
  apiError: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  setInputValue: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  sheetDescriptionId: string;
}

const OozeChatSheet: React.FC<OozeChatSheetProps> = ({
  chats,
  inputValue,
  isLoading,
  apiError,
  messagesEndRef,
  setInputValue,
  onKeyDown,
  onSend,
  sheetDescriptionId
}) => {
  return (
    <SheetContent className="w-[400px] sm:w-[540px] overflow-hidden flex flex-col" aria-describedby={sheetDescriptionId}>
      <SheetHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OozeAnimation width={50} height={50} />
            <SheetTitle>Chat with Ooze</SheetTitle>
          </div>
        </div>
      </SheetHeader>
      
      <ScrollArea className="flex-1 p-4 mt-2 mb-4" id={sheetDescriptionId}>
        <div className="flex flex-col gap-4">
          {chats.map((chat, index) => (
            <SeekerChatMessage 
              key={`msg-${index}`}
              chat={chat}
              index={index}
            />
          ))}
          
          {apiError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {apiError}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="border-t pt-4 pb-2 space-y-4">
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Ooze for resume suggestions..."
            className="resize-none"
          />
          <Button 
            size="icon" 
            onClick={onSend} 
            disabled={isLoading || inputValue.trim() === ''}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {isLoading && <p className="text-sm text-muted-foreground">Ooze is thinking...</p>}
      </div>
    </SheetContent>
  );
};

export default OozeChatSheet;
