
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Building2, MapPin, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JobDescriptionCardProps {
  jobData: any;
}

const JobDescriptionCard = ({ jobData }: JobDescriptionCardProps) => {
  if (!jobData) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500">No job information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              {jobData.job_title || "Job Position"}
            </CardTitle>
            {jobData.company_name && (
              <CardDescription className="flex items-center gap-2 text-base font-medium text-gray-700">
                <Building2 className="h-4 w-4" />
                {jobData.company_name}
              </CardDescription>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-3">
          {jobData.company_url && (
            <a
              href={jobData.company_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Company Website <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {jobData.job_url && (
            <a
              href={jobData.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Job Posting <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 px-6 pb-6">
        <CardContent className="space-y-6 p-0">
          {/* Job Keywords */}
          {jobData.job_description?.["10keywords"] && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Key Requirements</h3>
              <div className="flex flex-wrap gap-2">
                {jobData.job_description["10keywords"].split(', ').map((keyword: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Description Text */}
          {jobData.job_description?.text && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {jobData.job_description.text}
                </p>
              </div>
            </div>
          )}

          {/* Responsibilities */}
          {jobData.job_description?.responsibilities && jobData.job_description.responsibilities.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Responsibilities</h3>
              <ul className="space-y-2">
                {jobData.job_description.responsibilities.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Required Qualifications */}
          {jobData.job_description?.requiredQualifications && jobData.job_description.requiredQualifications.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Required Qualifications</h3>
              <ul className="space-y-2">
                {jobData.job_description.requiredQualifications.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preferred Qualifications */}
          {jobData.job_description?.preferredQualifications && jobData.job_description.preferredQualifications.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Preferred Qualifications</h3>
              <ul className="space-y-2">
                {jobData.job_description.preferredQualifications.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default JobDescriptionCard;
