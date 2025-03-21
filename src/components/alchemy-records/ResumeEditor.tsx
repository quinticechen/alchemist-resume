import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, AlertTriangle } from 'lucide-react';

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
  const { toast } = useToast();
  const editorRef = useRef<any>(null);

  useEffect(() => {
    const fetchResumeContent = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('resumes')
          .select('content')
          .eq('id', resumeId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setEditorContent(data.content || '');
          setSavedContent(data.content || '');
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load resume content.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (resumeId) {
      fetchResumeContent();
    }
  }, [resumeId, toast]);

  useEffect(() => {
    const contentChanged = editorContent !== savedContent && savedContent !== '';
    setLocalHasUnsavedChanges(contentChanged);
    setHasUnsavedChanges(contentChanged);
  }, [editorContent, savedContent, setHasUnsavedChanges]);

  const handleEditorChange = (content: string, editor: any) => {
    setEditorContent(content);
  };

  const handleSaveContent = async () => {
    if (!editorContent || editorContent === savedContent) {
      toast({
        title: "No changes to save",
        description: "You haven't made any changes to your resume.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('resumes')
        .update({ content: editorContent })
        .eq('id', resumeId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Resume saved successfully!",
        duration: 3000,
        icon: <CheckCircle className="h-4 w-4 mr-2" />
      });
      setSavedContent(editorContent);
      setLocalHasUnsavedChanges(false);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save resume. Please try again.",
        variant: "destructive",
        icon: <AlertTriangle className="h-4 w-4 mr-2" />
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
          <Editor
            apiKey="YOUR_TINYMCE_API_KEY"
            onInit={(evt, editor) => editorRef.current = editor}
            value={editorContent}
            onEditorChange={handleEditorChange}
            init={{
              height: 600,
              menubar: false,
              plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount'
              ],
              toolbar: 'undo redo | formatselect | ' +
                'bold italic backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
          />
          <div className="flex justify-between mt-4">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Close
            </Button>
            <Button
              onClick={handleSaveContent}
              disabled={isSaving || editorContent === savedContent}
              className={isSaving ? "cursor-not-allowed" : ""}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ResumeEditor;
