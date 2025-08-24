import React, { useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UploadZoneProps {
  isUploading: boolean;
  onFileSelect: (file: File) => void;
}

const UploadZone = ({ isUploading, onFileSelect }: UploadZoneProps) => {
  const { t } = useTranslation('workshop');
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
      className={`
        border-2 border-dashed rounded-xl p-8 text-center
        ${isUploading 
          ? 'border-primary/30 bg-primary/5' 
          : 'border-neutral-300 hover:border-primary/50 hover:bg-neutral-50'
        }
        transition-all duration-300 cursor-pointer
      `}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      {isUploading ? (
        <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
      ) : (
        <Upload className="mx-auto h-12 w-12 text-neutral-400" />
      )}
      <p className="mt-4 text-sm text-neutral-600">
        {isUploading 
          ? t('resumeUpload.uploading')
          : t('resumeUpload.dragDrop')
        }
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        {t('resumeUpload.maxFileSize')}
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