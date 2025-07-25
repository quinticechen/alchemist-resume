
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
      <CardHeader className="pb-2 flex-shrink-0">
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
      <ScrollArea className="flex-1 px-6">
        <CardContent className="space-y-4 pt-0 pb-6">
          {jobData.job?.title && (
            <div>
              <h3 className="font-medium text-gray-900">Title</h3>
              <p className="text-sm text-gray-700">{jobData.job.title}</p>
            </div>
          )}

          {jobData.job?.language && (
            <div>
              <h3 className="font-medium text-gray-900">Language</h3>
              <p className="text-sm text-gray-700">{jobData.job.language}</p>
            </div>
          )}

          {/* Display 10keywords if available */}
          {jobData.job?.["10keywords"] && (
            <div>
              <h3 className="font-medium text-gray-900">Keywords</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {jobData.job["10keywords"].split(', ').map((keyword: string, idx: number) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Also display keywords if available (fallback) */}
          {!jobData.job?.["10keywords"] && jobData.job?.keywords && jobData.job.keywords.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900">Keywords</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {jobData.job.keywords.map((keyword: string, idx: number) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description text */}
          {jobData.job?.description?.text && (
            <div>
              <h3 className="font-medium text-gray-900">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{jobData.job.description.text}</p>
            </div>
          )}

          {/* Responsibilities */}
          {jobData.job?.description?.responsibilities && jobData.job.description.responsibilities.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900">Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                {jobData.job.description.responsibilities.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Required Qualifications */}
          {jobData.job?.description?.requiredQualifications && jobData.job.description.requiredQualifications.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900">Required Qualifications</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                {jobData.job.description.requiredQualifications.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preferred Qualifications */}
          {jobData.job?.description?.preferredQualifications && jobData.job.description.preferredQualifications.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900">Preferred Qualifications</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                {jobData.job.description.preferredQualifications.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Job URL */}
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
