import React from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResumeSection } from "@/utils/resumeUtils";
import { useResumeEditor } from "@/hooks/use-resume-editor";
import EditorToolbar from "./editor/EditorToolbar";
import JsonEditorView from "./editor/JsonEditorView";
import VisualEditorView from "./editor/VisualEditorView";
import LoadingEditor from "./editor/LoadingEditor";

export interface ResumeEditorProps {
  resumeId: string;
  goldenResume: string | null;
  analysisId: string;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  activeSection?: ResumeSection;
  onSectionChange?: (section: ResumeSection) => void;
}

const ResumeEditor = ({
  resumeId,
  goldenResume,
  analysisId,
  setHasUnsavedChanges,
  activeSection: initialActiveSection,
  onSectionChange: parentSectionChangeHandler,
}: ResumeEditorProps) => {
  const {
    resumeData,
    jobData,
    isLoading,
    isSaving,
    viewMode,
    sectionOrder,
    collapsedSections,
    localHasUnsavedChanges,
    contentHeight,
    setViewMode,
    handleSectionToggle,
    handleSectionsReorder,
    handleResumeDataChange,
    handleSaveContent,
    scheduleAutoSave
  } = useResumeEditor({
    resumeId,
    goldenResume,
    analysisId,
    setHasUnsavedChanges
  });
  
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  if (isLoading) {
    return <LoadingEditor />;
  }

  const handlePreview = () => {
    navigate(`/resume-preview/${analysisId}`, {
      state: {
        resumeId,
        goldenResume: JSON.stringify(resumeData),
        analysisId,
      },
    });
  };

  const handleToggleViewMode = () => {
    setViewMode(viewMode === 'visual' ? 'json' : 'visual');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Main content - Editor View */}
      <div className="flex-grow overflow-hidden">
        {viewMode === 'json' ? (
          <JsonEditorView
            resumeData={resumeData}
            onChange={handleResumeDataChange}
          />
        ) : (
          <VisualEditorView
            resumeData={resumeData}
            jobData={jobData}
            analysisId={analysisId}
            sectionOrder={sectionOrder}
            collapsedSections={collapsedSections}
            onSectionToggle={handleSectionToggle}
            onSectionsReorder={handleSectionsReorder}
            onResumeDataChange={handleResumeDataChange}
            onAutoSave={scheduleAutoSave}
          />
        )}
      </div>
      
      {/* Bottom section - Toolbar */}
      <div className="flex-shrink-0 mt-auto">
        <EditorToolbar
          viewMode={viewMode}
          onViewModeToggle={handleToggleViewMode}
          onPreview={handlePreview}
          onSave={() => handleSaveContent(false)}
          isSaving={isSaving}
          hasUnsavedChanges={localHasUnsavedChanges}
        />
      </div>

      {/* Mobile Ooze Optimization Button - Keep for mobile */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 z-50 lg:hidden">
          <button
            className="bg-primary text-primary-foreground rounded-full p-2 shadow-md"
            onClick={() => {
              console.log("Ooze Optimization展开");
            }}
          >
            ✨
          </button>
        </div>
      )}
    </div>
  );
};

export default ResumeEditor;
