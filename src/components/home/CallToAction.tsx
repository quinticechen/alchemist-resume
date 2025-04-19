
import React from 'react';

export const CallToAction = () => {
  return (
    <div className="relative isolate bg-white py-16 sm:py-24 lg:overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <svg
            className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] stroke-neutral-100 [mask-image:radial-gradient(64rem_at_100%_50%,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="e813992c-7d03-4cc4-a9bd-164642698d3c"
                width={250}
                height={250}
                patternUnits="userSpaceOnUse"
              >
                <rect width={250} height={250} fill="currentColor" />
                <circle cx={125} cy={125} r={125} fill="none" stroke="currentColor" strokeWidth={0.5} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#e813992c-7d03-4cc4-a9bd-164642698d3c)" />
          </svg>
        </div>
        <div className="mx-auto max-w-2xl text-center lg:max-w-none">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Start building your resume today
          </h2>
          <p className="mt-4 text-lg leading-8 text-neutral-600">
            Join thousands of job seekers who are using Resume Alchemist to land their dream jobs.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/pricing"
              className="rounded-md bg-gradient-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              Try AI Resume Optimization Free
            </a>
            <a href="/faq" className="text-sm font-semibold leading-6 text-neutral-900">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <img
          src="/lovable-uploads/home-cta.png"
          alt="Product screenshot"
          className="mt-16 w-[48rem] max-w-none rounded-md bg-neutral-100 shadow-xl ring-1 ring-neutral-400/10 sm:mt-24 mx-auto"
        />
      </div>
      
      {/* FAQ Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-6 text-lg leading-8 text-neutral-600">
              Have questions? We&apos;ve got answers.
            </p>
          </div>
          <dl className="mt-16 space-y-10 divide-y divide-neutral-900/10">
            <div>
              <dt className="text-lg font-semibold leading-7 text-neutral-900">
                What is Resume Alchemist?
              </dt>
              <dd className="mt-2 text-base leading-7 text-neutral-600">
                Resume Alchemist is an AI-powered resume builder that helps you craft a resume that gets you hired.
              </dd>
            </div>
            <div>
              <dt className="text-lg font-semibold leading-7 text-neutral-900">
                How does Resume Alchemist work?
              </dt>
              <dd className="mt-2 text-base leading-7 text-neutral-600">
                Resume Alchemist uses AI to analyze your experience and skills to craft a resume that highlights your strengths.
              </dd>
            </div>
            <div>
              <dt className="text-lg font-semibold leading-7 text-neutral-900">
                Is Resume Alchemist free?
              </dt>
              <dd className="mt-2 text-base leading-7 text-neutral-600">
                Resume Alchemist offers a free trial with limited features. To unlock all features, you can upgrade to a paid plan.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};
