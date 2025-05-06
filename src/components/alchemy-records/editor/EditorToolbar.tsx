
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileJson, Eye, Save } from "lucide-react";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";

interface EditorToolbarProps {
  viewMode: "visual" | "json";
  onViewModeToggle: () => void;
  onPreview: () => void;
  onSave: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  viewMode,
  onViewModeToggle,
  onPreview,
  onSave,
  isSaving,
  hasUnsavedChanges
}) => {
  return (
    <div className="flex items-center justify-between p-3 border-t bg-white">
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewModeToggle}
          className="flex items-center gap-1"
        >
          <FileJson className="h-4 w-4" />
          {viewMode === 'visual' ? 'JSON Editor' : 'Visual Editor'}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onPreview}
          className="flex items-center gap-1"
        >
          <Eye className="h-4 w-4" />
          Preview
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
          variant="default"
          size="sm"
          className="flex items-center gap-1"
        >
          {isSaving ? (
            <span className="flex items-center gap-1">
              <Lottie 
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: Loading,
                  rendererSettings: {
                    preserveAspectRatio: "xMidYMid slice",
                  }
                }}
                height={16}
                width={16}
              />
              Saving...
            </span>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditorToolbar;
