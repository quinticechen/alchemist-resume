
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
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobData.job?.title && (
          <div>
            <h3 className="font-medium">Title</h3>
            <p>{jobData.job.title}</p>
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
