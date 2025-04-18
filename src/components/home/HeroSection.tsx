
import React from 'react';
import { Button } from "@/components/ui/button";
import OozeAnimation from "@/components/OozeAnimation";
import SeekerAnimation from "@/components/SeekerAnimation";

export const HeroSection = () => {
  return (
    <section className="relative isolate pt-14 bg-gradient-to-b from-neutral-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Say Goodbye to Lost Resumes - Let Ooze and Seeker Open the Door to Your Dream Job!
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Tired of your resume getting lost in the applicant tracking systems? Our AI-powered resume optimization ensures your application stands out and gets noticed by recruiters.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Button
                size="lg"
                className="bg-gradient-primary hover:opacity-90"
                onClick={() => window.location.href = '/alchemist-workshop'}
              >
                Upload Now for AI Analysis!
              </Button>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute left-1/4 top-1/2 -translate-y-1/2">
              <OozeAnimation width={200} height={200} />
            </div>
            <div className="absolute right-1/4 top-1/2 -translate-y-1/2">
              <SeekerAnimation width={200} height={200} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
