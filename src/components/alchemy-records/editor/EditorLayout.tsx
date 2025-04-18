
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import JobDescriptionViewer from '../JobDescriptionViewer';
import SeekerOptimizationSection from '../SeekerOptimizationSection';

interface EditorLayoutProps {
  jobData: any;
  resumeData: any;
  analysisId: string;
  children: React.ReactNode;
}

const EditorLayout = ({
  jobData,
  resumeData,
  analysisId,
  children
}: EditorLayoutProps) => {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-200px)]">
      <ResizablePanel defaultSize={25} minSize={15}>
        <ScrollArea className="h-full">
          <div className="h-full p-2">
            <JobDescriptionViewer jobData={jobData} />
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={50} minSize={30}>
        <ScrollArea className="h-full">
          <div className="p-2">
            {children}
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={25} minSize={15}>
        <ScrollArea className="h-full">
          <div className="p-2">
            <SeekerOptimizationSection 
              optimizationData={resumeData} 
              analysisId={analysisId}
            />
          </div>
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default EditorLayout;
