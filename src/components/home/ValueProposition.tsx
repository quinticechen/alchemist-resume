
import React from 'react';
import { Target, Layout, Clock, Building } from 'lucide-react';

const benefits = [
  {
    title: "Precise Job Matching",
    description: "Our AI analyzes job requirements and optimizes your resume to match perfectly with your target role.",
    icon: Target,
  },
  {
    title: "Professional Presentation",
    description: "Get a professionally formatted resume that catches the eye of both ATS systems and human recruiters.",
    icon: Layout,
  },
  {
    title: "Efficient Job Search",
    description: "Save time with smart optimization that ensures your resume passes ATS screening every time.",
    icon: Clock,
  },
  {
    title: "Top Company Success",
    description: "Join thousands who've landed roles at leading companies using our AI-optimized resumes.",
    icon: Building,
  },
];

export const ValueProposition = () => {
  return (
    <section className="py-24 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Why Choose Resume Alchemist?
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Transform your job search with our AI-powered resume optimization
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
                  <benefit.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-base leading-7 text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
