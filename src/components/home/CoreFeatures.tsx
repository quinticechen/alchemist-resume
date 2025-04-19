
import React from 'react';

export const CoreFeatures = () => {
  return (
    <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8">
      <div className="mx-auto max-w-2xl lg:mx-0">
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
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a3 3 0 00-3-3H7.5a3 3 0 00-3 3v10.5a3 3 0 003 3h8.25a3 3 0 003-3V13.5m-3 0h3m-3 0h-3M6.75 7.5h3v3h-3v-3z" />
            </svg>
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
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.8-6.3L5.19 5.19a4.5 4.5 0 016.3-1.8l7.35 7.35a4.5 4.5 0 01-1.8 6.3L12 16.5z" />
            </svg>
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
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.216a4.5 4.5 0 01-2.167.223l.516 2.417c.304 1.428 1.607 2.417 3.08 2.417h.672a4.5 4.5 0 013-2.25l.732-2.379c.057.026.117.051.179.077a4.5 4.5 0 013 2.25h.672c1.473 0 2.776-.989 3.08-2.417l.516-2.417a4.5 4.5 0 01-2.167-.223c1.584-.222 2.707-1.616 2.707-3.216V6.741c0-1.6-1.123-2.994-2.707-3.216a4.5 4.5 0 012.167-.223l-.516-2.417c-.304-1.428-1.607-2.417-3.08-2.417H9.672a4.5 4.5 0 01-3 2.25l-.732 2.379c-.057-.026-.117-.051-.179-.077a4.5 4.5 0 01-3-2.25H5.072c-1.473 0-2.776.989-3.08 2.417l-.516 2.417a4.5 4.5 0 012.167.223c-1.584.222-2.707 1.616-2.707 3.216v6.024z" />
            </svg>
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
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9l-3.5 3.5m0 5.25v5.25M5.25 15H9m6-4.5V4.5M15 10.5H19.5M15 10.5l3.5-3.5M15 15V19.5m0-4.5H19.5" />
            </svg>
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
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.8-6.3L5.19 5.19a4.5 4.5 0 016.3-1.8l7.35 7.35a4.5 4.5 0 01-1.8 6.3L12 16.5z" />
                        </svg>
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
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.216a4.5 4.5 0 01-2.167.223l.516 2.417c.304 1.428 1.607 2.417 3.08 2.417h.672a4.5 4.5 0 013-2.25l.732-2.379c.057.026.117.051.179.077a4.5 4.5 0 013 2.25h.672c1.473 0 2.776-.989 3.08-2.417l.516-2.417a4.5 4.5 0 01-2.167-.223c1.584-.222 2.707-1.616 2.707-3.216V6.741c0-1.6-1.123-2.994-2.707-3.216a4.5 4.5 0 012.167-.223l-.516-2.417c-.304-1.428-1.607-2.417-3.08-2.417H9.672a4.5 4.5 0 01-3 2.25l-.732 2.379c-.057-.026-.117-.051-.179-.077a4.5 4.5 0 01-3-2.25H5.072c-1.473 0-2.776.989-3.08 2.417l-.516 2.417a4.5 4.5 0 012.167.223c-1.584.222-2.707 1.616-2.707 3.216v6.024z" />
                        </svg>
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
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9l-3.5 3.5m0 5.25v5.25M5.25 15H9m6-4.5V4.5M15 10.5H19.5M15 10.5l3.5-3.5M15 15V19.5m0-4.5H19.5" />
                        </svg>
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
