
import React from 'react';
import { Button } from "@/components/ui/button";

export const CallToAction = () => {
  return (
    <section className="relative isolate py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ready to Transform Your Career?
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Join thousands of successful job seekers who have already optimized their resumes with AI
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-90"
              onClick={() => window.location.href = '/alchemist-workshop'}
            >
              Try AI Resume Optimization Free
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
