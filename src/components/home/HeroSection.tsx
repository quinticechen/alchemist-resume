
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const HeroSection = () => {
  const navigate = useNavigate();
  
  return (
    <div className="overflow-hidden pt-32 sm:pt-40 pb-80">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.neutral-100),white)] opacity-20"/>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
          <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
              Say Goodbye to Lost Resumes - Let Ooze and Seeker Open the Door to Your Dream Job!
            </h1>
            <p className="relative mt-6 text-lg leading-8 text-neutral-600 sm:max-w-md lg:max-w-none">
              Resume Alchemist is the AI-powered resume builder that helps you craft a resume that gets you hired.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <a
                href="/alchemist-workshop"
                className="rounded-md bg-gradient-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              >
                Get started
              </a>
              <a href="/faq" className="text-sm font-semibold leading-6 text-neutral-900">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
            <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
              <div className="relative">
                <img
                  src="/lovable-uploads/home-hero-1.png"
                  alt=""
                  className="aspect-[2/3] w-full rounded-xl bg-neutral-900/5 object-cover shadow-lg"
                />
              </div>
            </div>
            <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 lg:pt-52">
              <div className="relative">
                <img
                  src="/lovable-uploads/home-hero-2.png"
                  alt=""
                  className="aspect-[2/3] w-full rounded-xl bg-neutral-900/5 object-cover shadow-lg"
                />
              </div>
              <div className="relative">
                <img
                  src="/lovable-uploads/home-hero-3.png"
                  alt=""
                  className="aspect-[2/3] w-full rounded-xl bg-neutral-900/5 object-cover shadow-lg"
                />
              </div>
            </div>
            <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
              <div className="relative">
                <img
                  src="/lovable-uploads/home-hero-4.png"
                  alt=""
                  className="aspect-[2/3] w-full rounded-xl bg-neutral-900/5 object-cover shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
