
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResumeEditor } from '@/hooks/use-resume-editor';
import EditorToolbar from './editor/EditorToolbar';
import EditorLayout from './editor/EditorLayout';
import SectionSelector from './SectionSelector';
import SectionEditor from './sections/SectionEditor';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface ResumeEditorProps {
  resumeId: string;
  goldenResume: string | null;
  analysisId: string;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const ResumeEditor = ({ 
  resumeId, 
  goldenResume, 
  analysisId, 
  setHasUnsavedChanges,
}: ResumeEditorProps) => {
  const navigate = useNavigate();
  const {
    resumeData,
    isSaving,
    viewMode,
    sectionOrder,
    collapsedSections,
    setResumeData,
    setViewMode,
    setSectionOrder,
    setCollapsedSections,
    handleSaveContent,
    handleResumeDataChange,
    handleRawJsonChange,
    scheduleAutoSave
  } = useResumeEditor({
    resumeId,
    goldenResume,
    analysisId,
    setHasUnsavedChanges
  });

  const handlePreview = () => {
    navigate(`/resume-preview/${analysisId}`, { 
      state: { 
        resumeId, 
        goldenResume: JSON.stringify(resumeData), 
        analysisId 
      } 
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'visual' | 'json')} className="h-full">
          <TabsContent value="visual" className="mt-0 h-full">
            <EditorLayout 
              jobData={null}
              resumeData={resumeData}
              analysisId={analysisId}
            >
              <div className="mb-4 flex items-center">
                <h3 className="text-xl font-semibold">Resume Sections</h3>
              </div>
              
              <div className="lg:hidden mb-4">
                <SectionSelector 
                  sections={sectionOrder}
                  onSectionToggle={(section) => {
                    setCollapsedSections(prev => ({
                      ...prev,
                      [section]: !prev[section]
                    }));
                  }}
                  onSectionsReorder={setSectionOrder}
                  collapsedSections={collapsedSections}
                />
              </div>
              
              {resumeData && sectionOrder.map((section) => (
                <SectionEditor 
                  key={section}
                  section={section}
                  resumeData={resumeData}
                  onChange={handleResumeDataChange}
                  isCollapsed={collapsedSections[section]}
                  onToggleCollapse={(section) => {
                    setCollapsedSections(prev => ({
                      ...prev,
                      [section]: !prev[section]
                    }));
                  }}
                  onAutoSave={scheduleAutoSave}
                />
              ))}
            </EditorLayout>
          </TabsContent>
          
          <TabsContent value="json" className="mt-0 h-full">
            <div className="border rounded-md h-[calc(100vh-200px)]">
              <textarea
                value={JSON.stringify(resumeData, null, 2)}
                onChange={handleRawJsonChange}
                className="w-full h-full p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md resize-none font-mono text-base"
                placeholder="Edit your resume here in JSON format..."
              />
            </div>
          </TabsContent>

          <EditorToolbar 
            viewMode={viewMode}
            hasUnsavedChanges={true}
            isSaving={isSaving}
            onViewModeChange={setViewMode}
            onPreview={handlePreview}
            onSave={() => handleSaveContent(false)}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default ResumeEditor;
