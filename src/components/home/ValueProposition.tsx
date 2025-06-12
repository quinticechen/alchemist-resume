
import React from 'react';

export const ValueProposition = () => {
  return (
    <div className="bg-neutral-50 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
         <h2 className="text-4xl font-bold text-center bg-gradient-primary text-transparent bg-clip-text">
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
              <img src="https://images.pexels.com/photos/3970083/pexels-photo-3970083.jpeg?_gl=1*1f1x235*_ga*MTU4MDMwMDIyNi4xNzQ5NzA0MTgw*_ga_8JE65Q40S6*czE3NDk3MDQxNzkkbzEkZzAkdDE3NDk3MDQxNzkkajYwJGwwJGgw" alt="" className="h-10 w-10 rounded-full bg-neutral-50" />
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
              <img src="https://images.pexels.com/photos/1645820/pexels-photo-1645820.jpeg?_gl=1*kg97o8*_ga*MTU4MDMwMDIyNi4xNzQ5NzA0MTgw*_ga_8JE65Q40S6*czE3NDk3MDQxNzkkbzEkZzEkdDE3NDk3MDQyNDAkajYwJGwwJGgw" alt="" className="h-10 w-10 rounded-full bg-neutral-50" />
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
              <img src="https://images.pexels.com/photos/6182551/pexels-photo-6182551.jpeg?_gl=1*1krkj89*_ga*MTU4MDMwMDIyNi4xNzQ5NzA0MTgw*_ga_8JE65Q40S6*czE3NDk3MDQxNzkkbzEkZzEkdDE3NDk3MDQyNTUkajQ1JGwwJGgw" alt="" className="h-10 w-10 rounded-full bg-neutral-50" />
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
