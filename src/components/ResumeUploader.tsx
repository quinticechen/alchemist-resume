
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import UploadZone from "@/components/upload/UploadZone";
import ResumeSelector from "@/components/ResumeSelector";
import { useResumeUpload } from "@/components/upload/useResumeUpload";

interface ResumeUploaderProps {
  onUploadSuccess: (file: File, path: string, url: string, id: string) => void;
  onResumeSelect: (id: string, name: string, path: string, content: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRemove: () => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  onUploadSuccess,
  onResumeSelect,
  activeTab,
  onTabChange,
  onRemove,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedResumeName, setSelectedResumeName] = useState<string>("");
  const { uploadResume, isUploading } = useResumeUpload();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setSelectedResumeName("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadResume(selectedFile);
      if (result) {
        onUploadSuccess(selectedFile, result.path, result.url, result.id);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleResumeSelection = async (resumeId: string, resumeName: string, resumePath: string) => {
    // Fetch the resume content from the database
    const { supabase } = await import("@/integrations/supabase/client");
    
    try {
      const { data: resumeData, error } = await supabase
        .from("resumes")
        .select("formatted_resume")
        .eq("id", resumeId)
        .single();

      if (error) {
        console.error("Error fetching resume content:", error);
        return;
      }

      setSelectedResumeName(resumeName);
      setSelectedFile(null);
      onResumeSelect(resumeId, resumeName, resumePath, resumeData.formatted_resume || "");
    } catch (error) {
      console.error("Error selecting resume:", error);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setSelectedResumeName("");
    onRemove();
  };

  const hasSelectedResume = selectedFile || selectedResumeName;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Resume Upload
          {hasSelectedResume && (
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasSelectedResume ? (
          <div className="text-center py-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                {selectedFile ? "New resume ready for upload" : "Previous resume selected"}
              </p>
              <p className="text-green-600 text-sm mt-1">
                {selectedFile?.name || selectedResumeName}
              </p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload New Resume</TabsTrigger>
              <TabsTrigger value="select">Select Previous Resume</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <UploadZone onFileSelect={handleFileSelect} />
              {selectedFile && (
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? "Uploading..." : "Upload Resume"}
                </Button>
              )}
            </TabsContent>

            <TabsContent value="select" className="space-y-4">
              <ResumeSelector onSelect={handleResumeSelection} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeUploader;
