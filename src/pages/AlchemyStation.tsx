import { useState } from "react";
import ResumeUploader from "@/components/ResumeUploader";
import JobUrlInput from "@/components/JobUrlInput";
import ProcessingPreview from "@/components/ProcessingPreview";
import AlchemistSection from "@/components/AlchemistSection";
import { useToast } from "@/hooks/use-toast";

const AlchemistWorkshop = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string>("");
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [resumeId, setResumeId] = useState<string>("");
  const [jobUrl, setJobUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUploadSuccess = (
    file: File,
    path: string,
    url: string,
    id: string
  ) => {
    setSelectedFile(file);
    setFilePath(path);
    setPublicUrl(url);
    setResumeId(id);
    toast({
      title: "Upload successful",
      description: "Your resume has been uploaded successfully.",
    });
  };

  const handleUrlSubmit = async (url: string) => {
    // Implement URL submission logic here
    console.log("Submitting URL:", url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <AlchemistSection
          title="Upload Your Resume"
          description="Upload your resume in PDF format (max 5MB)"
        >
          <ResumeUploader onUploadSuccess={handleFileUploadSuccess} />
        </AlchemistSection>

        {selectedFile && (
          <AlchemistSection
            title="Enter Job URL"
            description="Paste the URL of the job posting you're interested in"
          >
            <JobUrlInput
              onUrlSubmit={handleUrlSubmit}
              jobUrl={jobUrl}
              setJobUrl={setJobUrl}
              resumeId={resumeId}
              setIsProcessing={setIsProcessing}
              isProcessing={isProcessing}
            />
          </AlchemistSection>
        )}

        {isProcessing && (
          <ProcessingPreview
            jobUrl={jobUrl}
            resumeId={resumeId}
            setIsProcessing={setIsProcessing}
          />
        )}
      </div>
    </div>
  );
};

export default AlchemistWorkshop;