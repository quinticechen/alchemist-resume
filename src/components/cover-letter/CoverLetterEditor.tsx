
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Wand2 } from "lucide-react";

interface CoverLetterEditorProps {
  coverLetter: string | null;
  isGenerating: boolean;
  isLoading: boolean;
  onGenerate: () => void;
  onUpdate: (content: string) => void;
}

const CoverLetterEditor = ({
  coverLetter,
  isGenerating,
  isLoading,
  onGenerate,
  onUpdate,
}: CoverLetterEditorProps) => {
  const [editedContent, setEditedContent] = useState(coverLetter || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedContent(coverLetter || "");
    setHasChanges(false);
  }, [coverLetter]);

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setHasChanges(value !== (coverLetter || ""));
  };

  const handleSave = () => {
    onUpdate(editedContent);
    setHasChanges(false);
  };

  const handleRegenerate = () => {
    onGenerate();
    setHasChanges(false);
  };

  if (!coverLetter && !isGenerating) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Wand2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Cover Letter Yet</h3>
          <p className="text-gray-600 mb-6">Generate a personalized cover letter based on your resume and the job description.</p>
          <Button onClick={onGenerate} disabled={isGenerating} className="bg-gradient-primary text-white">
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Cover Letter
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Cover Letter</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={isGenerating || isLoading}
            size="sm"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Write a New One
              </>
            )}
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} disabled={isLoading} size="sm">
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <Textarea
        value={editedContent}
        onChange={(e) => handleContentChange(e.target.value)}
        className="min-h-[400px] resize-none"
        placeholder="Your cover letter will appear here..."
        disabled={isGenerating}
      />

      {hasChanges && (
        <p className="text-sm text-amber-600">You have unsaved changes</p>
      )}
    </div>
  );
};

export default CoverLetterEditor;
