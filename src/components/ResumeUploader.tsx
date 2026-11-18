
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, FileText, Eye, Upload } from "lucide-react";
import UploadZone from "@/components/upload/UploadZone";
import ResumeSelector from "@/components/ResumeSelector";
import { useResumeUpload } from "@/components/upload/useResumeUpload";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation('workshop');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedResumeName, setSelectedResumeName] = useState<string>("");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [selectedResumePath, setSelectedResumePath] = useState<string>("");
  const [isUploaded, setIsUploaded] = useState<boolean>(false);
  const { uploadResume, isUploading } = useResumeUpload();

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setSelectedResumeName("");
    setSelectedResumeId("");
    setSelectedResumePath("");
    setIsUploaded(false);
    
    // Auto-upload the file
    try {
      const result = await uploadResume(file);
      if (result) {
        setIsUploaded(true);
        setSelectedResumePath(result.path);
        onUploadSuccess(file, result.path, result.url, result.id);
      }
    } catch (error) {
      console.error("Auto-upload failed:", error);
    }
  };

  const handleResumeSelection = async (resumeId: string, resumeName: string, resumePath: string, resumeContent: string) => {
    setSelectedResumeName(resumeName);
    setSelectedResumeId(resumeId);
    setSelectedResumePath(resumePath);
    setSelectedFile(null);
    setIsUploaded(false);
    onResumeSelect(resumeId, resumeName, resumePath, resumeContent);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setSelectedResumeName("");
    setSelectedResumeId("");
    setSelectedResumePath("");
    setIsUploaded(false);
    onRemove();
  };

  const handlePreview = () => {
    if (!selectedResumePath) {
      console.error("No resume path available for preview");
      return;
    }
    
    // Generate the correct public URL using the file path
    const { data } = supabase.storage
      .from("resumes")
      .getPublicUrl(selectedResumePath);
    
    const previewUrl = data.publicUrl;
    console.log("Opening preview URL:", previewUrl);
    
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const hasSelectedResume = (selectedFile && isUploaded) || selectedResumeName;
  const currentFileName = selectedFile?.name || selectedResumeName;
  const currentFileSize = selectedFile?.size;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {t('resumeUpload.title')}
          {hasSelectedResume && (
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasSelectedResume ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-green-800 font-medium">
                    {selectedFile && isUploaded ? "Resume uploaded successfully" : t('resumeUpload.previousSelected')}
                  </p>
                  <p className="text-green-600 text-sm">
                    {currentFileName}
                  </p>
                  {currentFileSize && (
                    <p className="text-green-600 text-xs">
                      {formatFileSize(currentFileSize)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="flex items-center gap-2"
                  disabled={!selectedResumePath}
                >
                  <Eye className="h-4 w-4" />
                  {t('resumeUpload.previewResume')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                    {t('resumeUpload.remove')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">{t('resumeUpload.uploadNew')}</TabsTrigger>
              <TabsTrigger value="select">{t('resumeUpload.selectPrevious')}</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
              {isUploading && (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-blue-600 animate-pulse" />
                      <span className="text-blue-800 text-sm font-medium">Uploading...</span>
                    </div>
                  </div>
                </div>
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
