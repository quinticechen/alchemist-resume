
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ContentBlock {
  type: string;
  text: string;
  content?: ContentBlock[];
  url?: string;
  annotations?: any[];
  is_list_item?: boolean;
  list_type?: 'bulleted_list' | 'numbered_list';
  media_type?: string;
  media_url?: string;
}

// Define a type for the special list block we're creating during processing
interface ListBlock {
  type: 'list';
  items: ContentBlock[];
  list_type: 'bulleted_list' | 'numbered_list';
}

// Type guard to check if a block is a ListBlock
function isListBlock(block: ContentBlock | ListBlock): block is ListBlock {
  return block.type === 'list' && 'items' in block;
}

// Type guard to check if a block is a ContentBlock
function isContentBlock(block: ContentBlock | ListBlock): block is ContentBlock {
  return 'text' in block;
}

interface PlatformContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ContentBlock[];
  url: string;
}

export const PlatformContentModal = ({
  isOpen,
  onClose,
  title,
  content,
  url,
}: PlatformContentModalProps) => {
  // Helper to render text with annotations and links
  const renderFormattedText = (text: string, url?: string) => {
    if (url) {
      return (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline"
        >
          {text}
        </a>
      );
    }
    return text;
  };

  // Process content blocks for lists
  const processedContent = React.useMemo(() => {
    // Group list items together
    let result: (ContentBlock | ListBlock)[] = [];
    let currentList: ContentBlock[] = [];
    let currentListType: 'bulleted_list' | 'numbered_list' | null = null;

    content.forEach((block) => {
      if (block.is_list_item && block.list_type) {
        // If we're in a list and this is a new list type, finish current list
        if (currentListType && currentListType !== block.list_type) {
          if (currentList.length > 0) {
            result.push({
              type: 'list',
              items: [...currentList],
              list_type: currentListType
            });
            currentList = [];
          }
        }
        
        // Set current list type and add item
        currentListType = block.list_type;
        currentList.push(block);
      } else {
        // If not a list item, finish any current list and add block
        if (currentList.length > 0) {
          result.push({
            type: 'list',
            items: [...currentList],
            list_type: currentListType!
          });
          currentList = [];
          currentListType = null;
        }
        result.push(block);
      }
    });

    // Add any remaining list items
    if (currentList.length > 0 && currentListType) {
      result.push({
        type: 'list',
        items: [...currentList],
        list_type: currentListType
      });
    }

    return result;
  }, [content]);

  const renderContent = (blocks: (ContentBlock | ListBlock)[]) => {
    return blocks.map((block, index) => {
      // Handle special case for grouped lists using type guard
      if (isListBlock(block)) {
        if (block.list_type === 'bulleted_list') {
          return (
            <ul key={index} className="list-disc pl-6 mb-4 space-y-1">
              {block.items.map((item, i) => (
                <li key={i} className="text-gray-600">
                  {renderFormattedText(item.text, item.url)}
                </li>
              ))}
            </ul>
          );
        } else if (block.list_type === 'numbered_list') {
          return (
            <ol key={index} className="list-decimal pl-6 mb-4 space-y-1">
              {block.items.map((item, i) => (
                <li key={i} className="text-gray-600">
                  {renderFormattedText(item.text, item.url)}
                </li>
              ))}
            </ol>
          );
        }
      }

      // Handle regular block types for ContentBlock (not ListBlock)
      if (isContentBlock(block)) {
        switch (block.type) {
          case 'heading_1':
            return (
              <h1 key={index} className="text-2xl font-bold mb-4">
                {renderFormattedText(block.text, block.url)}
              </h1>
            );
          case 'heading_2':
            return (
              <h2 key={index} className="text-xl font-semibold mb-3">
                {renderFormattedText(block.text, block.url)}
              </h2>
            );
          case 'heading_3':
            return (
              <h3 key={index} className="text-lg font-medium mb-2">
                {renderFormattedText(block.text, block.url)}
              </h3>
            );
          case 'paragraph':
            return (
              <p key={index} className="mb-4 text-gray-600">
                {renderFormattedText(block.text, block.url)}
              </p>
            );
          case 'media':
            if (block.media_type === 'image') {
              return (
                <figure key={index} className="mb-4">
                  <img 
                    src={block.media_url} 
                    alt={block.text || "Embedded image"} 
                    className="max-w-full h-auto rounded-md"
                  />
                  {block.text && (
                    <figcaption className="text-sm text-gray-500 mt-2 text-center">
                      {block.text}
                    </figcaption>
                  )}
                </figure>
              );
            } else if (block.media_type === 'video') {
              return (
                <figure key={index} className="mb-4">
                  <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-md">
                    <iframe
                      src={block.media_url}
                      frameBorder="0"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full"
                      title={block.text || "Embedded video"}
                    />
                  </div>
                  {block.text && (
                    <figcaption className="text-sm text-gray-500 mt-2 text-center">
                      {block.text}
                    </figcaption>
                  )}
                </figure>
              );
            }
            return null;
          default:
            return (
              <p key={index} className="mb-4 text-gray-600">
                {renderFormattedText(block.text, block.url)}
              </p>
            );
        }
      }
      
      // Fallback for any cases not handled
      return null;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {content && content.length > 0 ? renderContent(processedContent) : (
            <p className="text-gray-500 italic">No content available</p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => window.open(url, '_blank')} className="gap-2">
            Find Jobs
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
