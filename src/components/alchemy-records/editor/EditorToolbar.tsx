
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileJson, Eye, Save, Check } from "lucide-react";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";
import { useTranslation } from "react-i18next";

interface EditorToolbarProps {
  viewMode: "visual" | "json";
  onViewModeToggle: () => void;
  onPreview: () => void;
  onSave: () => void;
  onFinish: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  viewMode,
  onViewModeToggle,
  onPreview,
  onSave,
  onFinish,
  isSaving,
  hasUnsavedChanges
}) => {
  const { t } = useTranslation(['resume-refine']);
  return (
    <div className="flex items-center justify-between p-3 border-t bg-white shadow-sm sticky bottom-0">
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewModeToggle}
          className="flex items-center gap-1"
        >
          <FileJson className="h-4 w-4" />
          {viewMode === 'visual' ? t('editor.jsonEditor') : 'Visual Editor'}
        </Button>
      </div>
      <div className="flex items-center">
        {hasUnsavedChanges && (
          <span className="mr-4 text-amber-600 text-sm">
            {t('toolbar.unsavedChanges')}
          </span>
        )}
        <div className="flex gap-2">
          {/* <Button 
            variant="outline" 
            size="sm" 
            onClick={onPreview}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button> */}
          <Button
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
            variant="secondary"
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
                {t('editor.save')}
              </>
            )}
          </Button>
          <Button
            onClick={onPreview}
            variant="default"
            size="sm"
            className="flex items-center gap-1"
          >
            <Check className="h-4 w-4" />
            {t('editor.finish')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
