
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileJson, Eye, Save, AlertTriangle } from "lucide-react";

interface EditorToolbarProps {
  viewMode: 'visual' | 'json';
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onViewModeChange: (mode: 'visual' | 'json') => void;
  onPreview: () => void;
  onSave: () => void;
}

const EditorToolbar = ({
  viewMode,
  hasUnsavedChanges,
  isSaving,
  onViewModeChange,
  onPreview,
  onSave
}: EditorToolbarProps) => {
  return (
    <div className="flex justify-between mt-4">
      <Button 
        variant="outline" 
        onClick={() => onViewModeChange(viewMode === 'visual' ? 'json' : 'visual')}
      >
        <FileJson className="h-4 w-4 mr-2" />
        {viewMode === 'visual' ? 'JSON Editor' : 'Visual Editor'}
      </Button>
      
      <div className="flex gap-2 items-center">
        {hasUnsavedChanges && (
          <span className="text-amber-500 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Unsaved changes
          </span>
        )}
        <Button
          onClick={onPreview}
          variant="outline"
          className="ml-2"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
          className={isSaving ? "cursor-not-allowed" : ""}
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditorToolbar;
