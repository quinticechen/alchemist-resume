import React from 'react';
import {
  ArrowRight,
  Upload,
  Zap,
  Bot, 
  Crosshair, 
  Unlink2, 
  Laugh
} from "lucide-react";

export const CoreFeatures = () => {
  return (
    <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
      <div className="mx-auto max-w-2xl text-center lg:mx-0">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          The new way to build resumes
        </h2>
        <p className="mt-6 text-lg leading-8 text-neutral-600">
          We understand the challenges of creating a resume that stands out. That&apos;s why we built Resume Alchemist, the AI-powered resume builder that helps you craft a resume that gets you hired.
        </p>
      </div>
      <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-x-8">
        <div className="text-center md:text-left">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-blue-400">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <h3 className="mt-4 text-base font-semibold leading-7 text-neutral-900">
            AI-Powered
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Our AI analyzes your experience and skills to craft a resume that highlights your strengths.
          </p>
        </div>
        <div className="text-center md:text-left">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-orange-600 to-orange-400">
            <Crosshair className="h-6 w-6 text-white" />
          </div>
          <h3 className="mt-4 text-base font-semibold leading-7 text-neutral-900">
            ATS Optimized
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            We ensure your resume is optimized for applicant tracking systems (ATS) to increase your chances of getting an interview.
          </p>
        </div>
        <div className="text-center md:text-left">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-green-600 to-green-400">
            <Unlink2 className="h-6 w-6 text-white" />
          </div>
          <h3 className="mt-4 text-base font-semibold leading-7 text-neutral-900">
            Job-Specific
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            We tailor your resume to specific job postings, highlighting the skills and experience that match the job description.
          </p>
        </div>
        <div className="text-center md:text-left">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-purple-400">
            <Laugh className="h-6 w-6 text-white" />     
          </div>
          <h3 className="mt-4 text-base font-semibold leading-7 text-neutral-900">
            Easy to Use
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Our intuitive interface makes it easy to create a professional resume in minutes.
          </p>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-6 text-lg leading-8 text-neutral-600">
              Three simple steps to create a resume that gets you hired.
            </p>
          </div>
          <div className="mt-16 flow-root sm:mt-24">
            <div className="-m-2 rounded-xl bg-neutral-50 p-2 ring-1 ring-inset ring-neutral-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
              <div className="relative">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                  <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="text-center md:text-left">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-blue-400">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold leading-7 text-neutral-900">
                        Upload Your Resume
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        Upload your existing resume in PDF format.
                      </p>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-orange-600 to-orange-400">
                        <ArrowRight className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold leading-7 text-neutral-900">
                        Enter Job Posting URL
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        Paste the URL of the job posting you're applying for.
                      </p>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-green-600 to-green-400">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold leading-7 text-neutral-900">
                        Get Your Optimized Resume
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        Our AI will analyze your resume and the job posting to create a tailored resume that highlights your skills and experience.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
