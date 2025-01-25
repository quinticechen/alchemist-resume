import React, { useCallback } from "react";
import { Upload } from "lucide-react";

interface UploadZoneProps {
  isUploading: boolean;
  onFileSelect: (file: File) => void;
}

const UploadZone = ({ isUploading, onFileSelect }: UploadZoneProps) => {
  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
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
  );
};

export default UploadZone;