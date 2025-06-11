
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const useResumeUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a PDF file smaller than 5MB",
        variant: "destructive",
      });
      return false;
    }
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const uploadWithRetry = async (filePath: string, file: File, retryCount = 0): Promise<boolean> => {
    try {
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      return true;
    } catch (error) {
      console.error(`Upload attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < MAX_RETRIES) {
        await delay(RETRY_DELAY);
        return uploadWithRetry(filePath, file, retryCount + 1);
      }
      
      throw error;
    }
  };

  const uploadResume = async (file: File) => {
    if (!validateFile(file)) return null;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      await uploadWithRetry(filePath, file);

      const { data: publicUrlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      const { data: resume, error: insertError } = await supabase
        .from('resumes')
        .insert({
          file_path: filePath,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return {
        path: filePath,
        url: publicUrl,
        id: resume.id
      };
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadResume
  };
};
