
import React, { useEffect, useRef } from "react";
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
  const resumeEditorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Force immediate calculation of heights on mount
    const calculateHeights = () => {
      const headerHeight = 80; // Height for the page header including title and any padding
      const viewportHeight = window.innerHeight;
      const editorHeight = viewportHeight - headerHeight;
      
      if (resumeEditorRef.current) {
        resumeEditorRef.current.style.height = `${editorHeight}px`;
      }
    };

    // Calculate heights immediately
    calculateHeights();
    
    // Also set up resize handler
    window.addEventListener('resize', calculateHeights);
    
    return () => {
      window.removeEventListener('resize', calculateHeights);
    };
  }, []);

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

  const handleRawJsonChange = (parsedJson: any) => {
    handleResumeDataChange(parsedJson);
  };

  if (isLoading) {
    return <LoadingEditor />;
  }

  return (
    <div 
      ref={resumeEditorRef} 
      className="flex flex-col h-full lg:flex-row overflow-hidden"
    >
      {/* Top action buttons - JSON Editor, Preview, and Save buttons */}
      <EditorToolbar
        viewMode={viewMode}
        onViewModeToggle={handleToggleViewMode}
        onPreview={handlePreview}
        onSave={() => handleSaveContent(false)}
        isSaving={isSaving}
        hasUnsavedChanges={localHasUnsavedChanges}
      />

      {/* Main content area - conditional rendering based on viewMode */}
      {viewMode === 'json' ? (
        <JsonEditorView
          resumeData={resumeData}
          onChange={handleRawJsonChange}
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

      {/* Mobile Ooze Optimization Button */}
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
    </div>
  );
};

export default ResumeEditor;
