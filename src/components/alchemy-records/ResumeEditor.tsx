
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Save, AlertTriangle } from 'lucide-react';

export interface ResumeEditorProps {
  resumeId: string;
  goldenResume: string | null;
  analysisId: string;
  onClose: () => void;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const ResumeEditor = ({ resumeId, goldenResume, analysisId, onClose, setHasUnsavedChanges }: ResumeEditorProps) => {
  const [editorContent, setEditorContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedContent, setSavedContent] = useState<string>('');
  const [hasUnsavedChanges, setLocalHasUnsavedChanges] = useState<boolean>(false);
  const [editorId, setEditorId] = useState<string | null>(null);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchOrCreateEditorContent = async () => {
      setIsLoading(true);
      try {
        // First check if there's an existing editor record for this analysis
        const { data: editorData, error: editorError } = await supabase
          .from('resume_editors')
          .select('id, content')
          .eq('analysis_id', analysisId)
          .maybeSingle();

        if (editorError && editorError.code !== 'PGRST116') {
          throw editorError;
        }

        if (editorData) {
          // Use existing editor content
          setEditorContent(editorData.content?.toString() || '');
          setSavedContent(editorData.content?.toString() || '');
          setEditorId(editorData.id);
        } else {
          // No editor record exists, initialize with golden resume and create a new record
          const initialContent = goldenResume || '';
          
          // Create a new editor record
          const { data: newEditor, error: createError } = await supabase
            .from('resume_editors')
            .insert({
              analysis_id: analysisId,
              content: initialContent
            })
            .select('id')
            .single();
          
          if (createError) throw createError;
          
          setEditorContent(initialContent);
          setSavedContent(initialContent);
          setEditorId(newEditor.id);
        }
      } catch (error: any) {
        console.error('Error fetching or creating editor content:', error);
        toast({
          title: "Error",
          description: "Failed to load or initialize resume content.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (analysisId) {
      fetchOrCreateEditorContent();
    }
  }, [analysisId, goldenResume, toast]);

  useEffect(() => {
    const contentChanged = editorContent !== savedContent && savedContent !== '';
    setLocalHasUnsavedChanges(contentChanged);
    setHasUnsavedChanges(contentChanged);
  }, [editorContent, savedContent, setHasUnsavedChanges]);

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value);
  };

  const handleSaveContent = async () => {
    if (!editorContent || editorContent === savedContent || !editorId) {
      toast({
        title: "No changes to save",
        description: "You haven't made any changes to your resume.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('resume_editors')
        .update({ 
          content: editorContent,
          last_saved: new Date().toISOString()
        })
        .eq('id', editorId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Resume saved successfully!",
        duration: 3000,
      });
      setSavedContent(editorContent);
      setLocalHasUnsavedChanges(false);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-4">Loading editor...</div>
      ) : (
        <>
          <div className="mb-4 border rounded-md">
            <textarea
              ref={textareaRef}
              value={editorContent}
              onChange={handleEditorChange}
              className="w-full h-[600px] p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md resize-none font-sans text-base"
              placeholder="Edit your resume here..."
            />
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Close
            </Button>
            <div className="flex gap-2 items-center">
              {hasUnsavedChanges && (
                <span className="text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Unsaved changes
                </span>
              )}
              <Button
                onClick={handleSaveContent}
                disabled={isSaving || editorContent === savedContent}
                className={isSaving ? "cursor-not-allowed" : ""}
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ResumeEditor;
