
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JobDescriptionViewerProps {
  jobData: any;
}

const JobDescriptionViewer = ({ jobData }: JobDescriptionViewerProps) => {
  if (!jobData) {
    return <div className="text-center p-4">No job information available</div>;
  }

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Job Description</CardTitle>
        <CardDescription>
          {jobData.company?.name && (
            <span className="block font-medium text-base">{jobData.company.name}</span>
          )}
          {jobData.company?.url && (
            <a href={jobData.company.url} target="_blank" rel="noopener noreferrer" 
               className="text-blue-500 hover:underline flex items-center gap-1 text-sm mt-1">
              Company Website <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </CardDescription>
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent className="space-y-4 pt-0">
          {jobData.job?.title && (
            <div>
              <h3 className="font-medium">Title</h3>
              <p className="text-sm">{jobData.job.title}</p>
            </div>
          )}

          {jobData.job?.language && (
            <div>
              <h3 className="font-medium">Language</h3>
              <p className="text-sm">{jobData.job.language}</p>
            </div>
          )}

          {jobData.job?.keywords && jobData.job.keywords.length > 0 && (
            <div>
              <h3 className="font-medium">Keywords</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {/* Display all keywords without limiting to 10 */}
                {jobData.job.keywords.map((keyword: string, idx: number) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {jobData.job?.description?.text && (
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-sm whitespace-pre-line">{jobData.job.description.text}</p>
            </div>
          )}

          {jobData.job?.description?.responsibilities && jobData.job.description.responsibilities.length > 0 && (
            <div>
              <h3 className="font-medium">Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {jobData.job.description.responsibilities.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {jobData.job?.description?.requiredQualifications && jobData.job.description.requiredQualifications.length > 0 && (
            <div>
              <h3 className="font-medium">Required Qualifications</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {jobData.job.description.requiredQualifications.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {jobData.job?.description?.preferredQualifications && jobData.job.description.preferredQualifications.length > 0 && (
            <div>
              <h3 className="font-medium">Preferred Qualifications</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {jobData.job.description.preferredQualifications.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {jobData.job?.url && (
            <div>
              <a href={jobData.job.url} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-500 hover:underline flex items-center gap-1 text-sm">
                View Full Job Posting <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default JobDescriptionViewer;
