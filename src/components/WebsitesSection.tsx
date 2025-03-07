
import React from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const WebsitesSection = () => {
  return (
    <section className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-primary text-transparent bg-clip-text">
          Supported Websites
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-apple p-6 flex flex-col items-center">
            <img 
              src="/lovable-uploads/linkedin-logo.png" 
              alt="LinkedIn" 
              className="h-12 mb-4 object-contain"
            />
            <h3 className="text-xl font-semibold mb-2">LinkedIn Jobs</h3>
            <p className="text-neutral-600 text-center mb-4">
              Optimize your resume for LinkedIn job postings with our AI-powered tool.
            </p>
            <Button 
              variant="outline"
              className="mt-auto"
              onClick={() => window.open('https://www.linkedin.com/jobs/', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit LinkedIn Jobs
            </Button>
          </div>
          
          <div className="bg-white rounded-xl shadow-apple p-6 flex flex-col items-center">
            <img 
              src="/lovable-uploads/indeed-logo.png" 
              alt="Indeed" 
              className="h-12 mb-4 object-contain"
            />
            <h3 className="text-xl font-semibold mb-2">Indeed</h3>
            <p className="text-neutral-600 text-center mb-4">
              Tailor your resume for Indeed job listings instantly with our resume alchemist.
            </p>
            <Button 
              variant="outline"
              className="mt-auto"
              onClick={() => window.open('https://www.indeed.com/', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Indeed
            </Button>
          </div>
          
          <div className="bg-white rounded-xl shadow-apple p-6 flex flex-col items-center">
            <img 
              src="/lovable-uploads/glassdoor-logo.png" 
              alt="Glassdoor" 
              className="h-12 mb-4 object-contain"
            />
            <h3 className="text-xl font-semibold mb-2">Glassdoor</h3>
            <p className="text-neutral-600 text-center mb-4">
              Create job-specific resumes for Glassdoor opportunities in minutes.
            </p>
            <Button 
              variant="outline"
              className="mt-auto"
              onClick={() => window.open('https://www.glassdoor.com/index.htm', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Glassdoor
            </Button>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Button 
            size="lg"
            onClick={() => window.open('https://staging.resumealchemist.qwizai.com/', '_blank')}
          >
            Try Resume Alchemist Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WebsitesSection;
