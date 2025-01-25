import React, { useCallback, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

interface ResumeUploaderProps {
  onFileUpload: (file: File, filePath: string, publicUrl: string, id: string) => void;
}

type ResumeAnalysis = Database['public']['Tables']['resume_analyses']['Row'];
type ResumeAnalysisPayload = RealtimePostgresChangesPayload<ResumeAnalysis>;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const ResumeUploader = ({ onFileUpload }: ResumeUploaderProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    console.log('Setting up realtime subscription for resume analyses');
    const channel = supabase
      .channel('resume_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resume_analyses',
        },
        (payload: ResumeAnalysisPayload) => {
          console.log('Received realtime update:', payload);
          // Check if payload.new exists and is of type ResumeAnalysis
          if (payload.new && 'analysis_data' in payload.new && payload.new.analysis_data) {
            toast({
              title: "分析完成",
              description: "您的簡歷分析已準備就緒！",
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [toast]);

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
      console.log(`Attempting upload, retry count: ${retryCount}`);
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      return true;
    } catch (error) {
      console.error(`Upload attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying upload in ${RETRY_DELAY}ms...`);
        await delay(RETRY_DELAY);
        return uploadWithRetry(filePath, file, retryCount + 1);
      }
      
      throw error;
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      console.log('Starting file upload with retry mechanism');
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

      console.log('Resume uploaded successfully:', resume);
      console.log('Public URL:', publicUrl);
      
      onFileUpload(file, filePath, publicUrl, resume.id);
      toast({
        title: "簡歷上傳成功",
        description: "您的簡歷已上傳，正在進行分析...",
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "上傳失敗",
        description: "上傳簡歷時發生錯誤，請稍後重試。",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        uploadFile(file);
      }
    },
    [toast]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        uploadFile(file);
      }
    },
    []
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Your Resume</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isUploading 
              ? "Uploading..."
              : "Drag and drop your PDF resume here (max 5MB), or click to select a file"
            }
          </p>
          <input
            id="fileInput"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileInput}
            disabled={isUploading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeUploader;