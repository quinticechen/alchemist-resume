
import React from 'react';

export const ValueProposition = () => {
  return (
    <div className="bg-neutral-50 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            What people are saying
          </h2>
          <p className="mt-6 text-lg leading-8 text-neutral-600">
            Don&apos;t just take our word for it. See what others are saying about Resume Alchemist.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm leading-6 text-neutral-600">
              &quot;Resume Alchemist helped me land my dream job. The AI-powered resume builder made it easy to create a resume that highlighted my skills and experience.&quot;
            </p>
            <div className="mt-4 flex items-center gap-x-4">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b2933e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" className="h-10 w-10 rounded-full bg-neutral-50" />
              <div>
                <p className="text-sm font-semibold leading-6 text-neutral-900">
                  Jane Doe
                </p>
                <p className="text-xs leading-5 text-neutral-600">
                  Software Engineer
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm leading-6 text-neutral-600">
              &quot;I was struggling to create a resume that stood out. Resume Alchemist made it easy to create a professional resume that highlighted my skills and experience.&quot;
            </p>
            <div className="mt-4 flex items-center gap-x-4">
              <img src="https://images.unsplash.com/photo-1500648767791-00d5a4a9e341?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80" alt="" className="h-10 w-10 rounded-full bg-neutral-50" />
              <div>
                <p className="text-sm font-semibold leading-6 text-neutral-900">
                  John Smith
                </p>
                <p className="text-xs leading-5 text-neutral-600">
                  Marketing Manager
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm leading-6 text-neutral-600">
              &quot;I was skeptical about using an AI-powered resume builder, but Resume Alchemist exceeded my expectations. The AI-powered resume builder made it easy to create a resume that highlighted my skills and experience.&quot;
            </p>
            <div className="mt-4 flex items-center gap-x-4">
              <img src="https://images.unsplash.com/photo-1507038366474-4a2ea39da5c6?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" className="h-10 w-10 rounded-full bg-neutral-50" />
              <div>
                <p className="text-sm font-semibold leading-6 text-neutral-900">
                  Emily Johnson
                </p>
                <p className="text-xs leading-5 text-neutral-600">
                  Product Manager
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
