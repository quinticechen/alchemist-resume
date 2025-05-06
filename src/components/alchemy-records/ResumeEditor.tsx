
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
  pageHeaderHeight?: number; // Added prop for page header height
}

const ResumeEditor = ({
  resumeId,
  goldenResume,
  analysisId,
  setHasUnsavedChanges,
  activeSection: initialActiveSection,
  onSectionChange: parentSectionChangeHandler,
  pageHeaderHeight = 0, // Default to 0 if not provided
}: ResumeEditorProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
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
  
  // Adjust content height based on page header height
  useEffect(() => {
    const calculateHeight = () => {
      const viewportHeight = window.innerHeight;
      // Account for the header height (title) + toolbar height at bottom
      const toolbarHeight = 56; // Approximate toolbar height
      const availableHeight = viewportHeight - pageHeaderHeight - toolbarHeight;
      
      if (contentRef.current) {
        contentRef.current.style.height = `${availableHeight}px`;
      }
    };
    
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [pageHeaderHeight]);
  
  if (isLoading) {
    return <LoadingEditor />;
  }

  const handlePreview = () => {
    // Open a preview dialog without saving or navigating away
    navigate(`/resume-preview/${analysisId}`, {
      state: {
        resumeId,
        goldenResume: JSON.stringify(resumeData),
        analysisId,
        previewOnly: true,
      },
    });
  };

  const handleToggleViewMode = () => {
    setViewMode(viewMode === 'visual' ? 'json' : 'visual');
  };

  const handleFinish = () => {
    // Save content and then navigate back to alchemy records
    handleSaveContent(false).then(() => {
      navigate('/alchemy-records');
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Main content - Editor View */}
      <div className="flex-grow overflow-hidden" ref={contentRef}>
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
      <EditorToolbar
        viewMode={viewMode}
        onViewModeToggle={handleToggleViewMode}
        onPreview={handlePreview}
        onSave={() => handleSaveContent(false)}
        onFinish={handleFinish}
        isSaving={isSaving}
        hasUnsavedChanges={localHasUnsavedChanges}
      />
    </div>
  );
};

export default ResumeEditor;
