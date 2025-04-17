
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import JellyfishAnimation from "@/components/JellyfishAnimation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Check, AlertCircle, Lightbulb, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SeekerOptimizationSectionProps {
  optimizationData: any;
  analysisId: string;
  initialResumeContent?: string; // Add this to pass initial resume content
}

const SeekerOptimizationSection = ({ 
  optimizationData, 
  analysisId, 
  initialResumeContent 
}: SeekerOptimizationSectionProps) => {
  const [viewMode, setViewMode] = useState<"all" | "important" | "suggested">("all");
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string, suggestion?: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Extract optimization suggestions from the data
  const suggestions = useMemo(() => {
    if (!optimizationData?.guidanceForOptimization) return [];
    
    return Array.isArray(optimizationData.guidanceForOptimization) 
      ? optimizationData.guidanceForOptimization 
      : [optimizationData.guidanceForOptimization];
  }, [optimizationData]);

  // Filter suggestions based on viewMode
  const filteredSuggestions = useMemo(() => {
    if (viewMode === "all") return suggestions;
    if (viewMode === "important") return suggestions.slice(0, Math.ceil(suggestions.length / 2));
    return suggestions.slice(Math.ceil(suggestions.length / 2)); 
  }, [suggestions, viewMode]);

  // Load initial context when component mounts
  useEffect(() => {
    const loadInitialContext = async () => {
      if (initialResumeContent) {
        const systemMessage = {
          role: 'assistant' as const, 
          content: `I'll help you optimize your resume. I see your current resume content includes: ${initialResumeContent}. How would you like to improve it?`
        };
        setChatMessages([systemMessage]);
      }
    };

    loadInitialContext();
  }, [initialResumeContent]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user' as const, content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('resume-ai-assistant', {
        body: { 
          message: chatInput, 
          analysisId: analysisId,
          currentSection: 'seekerOptimization',
          threadId: chatMessages.length > 0 ? 'existing_thread' : null
        }
      });

      if (error) throw error;

      const assistantMessage = { 
        role: 'assistant' as const, 
        content: data.message || 'I could not generate a response.',
        suggestion: data.suggestion
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      toast({
        title: "Error",
        description: "Could not send message to AI assistant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    // Placeholder for applying suggestion to resume
    toast({
      title: "Suggestion Applied",
      description: "The suggestion has been applied to your resume."
    });
  };

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <CardTitle className="text-lg">Seeker Optimization Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-4">
          <JellyfishAnimation width={120} height={120} />
        </div>
        
        {suggestions.length > 0 && (
          <div className="mb-4">
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as any)}>
              <ToggleGroupItem value="all" aria-label="All suggestions">All</ToggleGroupItem>
              <ToggleGroupItem value="important" aria-label="Important suggestions">Important</ToggleGroupItem>
              <ToggleGroupItem value="suggested" aria-label="Suggested improvements">Suggested</ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
        
        {filteredSuggestions.length > 0 ? (
          <div className="space-y-4 mb-4">
            {filteredSuggestions.map((tip: string, index: number) => (
              <div key={index} className="p-3 bg-soft-yellow rounded-lg flex items-start gap-2">
                <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-gray-100 rounded-lg flex items-center gap-2 text-center">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No optimization suggestions available at this time.</p>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex gap-2 mb-4">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask for resume optimization advice..."
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              size="icon" 
              onClick={handleSendMessage}
              disabled={isLoading || !chatInput.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {chatMessages.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${
                    msg.role === 'user' 
                      ? 'justify-end' 
                      : 'justify-start'
                  }`}
                >
                  <div 
                    className={`p-2 rounded-lg max-w-[80%] ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                    {msg.suggestion && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => handleApplySuggestion(msg.suggestion!)}
                      >
                        Apply Suggestion
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeekerOptimizationSection;
