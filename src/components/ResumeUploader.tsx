import React, { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ResumeUploaderProps {
  onFileUpload: (file: File, filePath: string, publicUrl: string, id: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const ResumeUploader = ({ onFileUpload }: ResumeUploaderProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a PDF file smaller than 10MB",
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

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

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
        title: "Resume Uploaded",
        description: "Your resume has been uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your resume",
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
              : "Drag and drop your PDF resume here (max 10MB), or click to select a file"
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