
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import JellyfishAnimation from "@/components/JellyfishAnimation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Check, AlertCircle, Lightbulb } from "lucide-react";

interface SeekerOptimizationSectionProps {
  optimizationData: any;
}

const SeekerOptimizationSection = ({ optimizationData }: SeekerOptimizationSectionProps) => {
  const [viewMode, setViewMode] = React.useState<"all" | "important" | "suggested">("all");

  // Extract optimization suggestions from the data
  const suggestions = React.useMemo(() => {
    if (!optimizationData?.guidanceForOptimization) return [];
    
    // Handle both array and string formats
    if (Array.isArray(optimizationData.guidanceForOptimization)) {
      return optimizationData.guidanceForOptimization;
    } else if (typeof optimizationData.guidanceForOptimization === 'string') {
      return [optimizationData.guidanceForOptimization];
    }
    
    return [];
  }, [optimizationData]);

  // Filter suggestions based on viewMode (in a real app, these would be properly tagged)
  const filteredSuggestions = React.useMemo(() => {
    if (viewMode === "all") return suggestions;
    // For demo purposes, we'll just split the array
    if (viewMode === "important") return suggestions.slice(0, Math.ceil(suggestions.length / 2));
    return suggestions.slice(Math.ceil(suggestions.length / 2)); 
  }, [suggestions, viewMode]);

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
          <div className="space-y-4">
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
      </CardContent>
    </Card>
  );
};

export default SeekerOptimizationSection;
