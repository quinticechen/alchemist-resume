
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface JobDescriptionViewerProps {
  jobData: any;
}

const JobDescriptionViewer = ({ jobData }: JobDescriptionViewerProps) => {
  if (!jobData) {
    return <div className="text-center p-4">No job information available</div>;
  }

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <CardTitle>Job Description</CardTitle>
        <CardDescription>
          {jobData.company?.name && (
            <span className="block">{jobData.company.name}</span>
          )}
          {jobData.company?.url && (
            <a href={jobData.company.url} target="_blank" rel="noopener noreferrer" 
               className="text-blue-500 hover:underline block text-sm mt-1">
              Company Website
            </a>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobData.job?.title && (
          <div>
            <h3 className="font-medium">Title</h3>
            <p>{jobData.job.title}</p>
          </div>
        )}

        {jobData.job?.url && (
          <div>
            <h3 className="font-medium">Job URL</h3>
            <a href={jobData.job.url} target="_blank" rel="noopener noreferrer" 
               className="text-blue-500 hover:underline text-sm">
              View Job Posting
            </a>
          </div>
        )}

        {jobData.job?.language && (
          <div>
            <h3 className="font-medium">Language</h3>
            <p>{jobData.job.language}</p>
          </div>
        )}

        {jobData.job?.keywords && jobData.job.keywords.length > 0 && (
          <div>
            <h3 className="font-medium">Keywords</h3>
            <div className="flex flex-wrap gap-1">
              {jobData.job.keywords.map((keyword: string, idx: number) => (
                <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {jobData.job?.description?.responsibilities && jobData.job.description.responsibilities.length > 0 && (
          <div>
            <h3 className="font-medium">Responsibilities</h3>
            <ul className="list-disc pl-5 space-y-1">
              {jobData.job.description.responsibilities.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {jobData.job?.description?.requiredQualifications && jobData.job.description.requiredQualifications.length > 0 && (
          <div>
            <h3 className="font-medium">Required Qualifications</h3>
            <ul className="list-disc pl-5 space-y-1">
              {jobData.job.description.requiredQualifications.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {jobData.job?.description?.preferredQualifications && jobData.job.description.preferredQualifications.length > 0 && (
          <div>
            <h3 className="font-medium">Preferred Qualifications</h3>
            <ul className="list-disc pl-5 space-y-1">
              {jobData.job.description.preferredQualifications.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobDescriptionViewer;
