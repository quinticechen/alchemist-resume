
import React from 'react';
import { FileText, Zap, Download } from 'lucide-react';

const features = [
  {
    title: "Upload Resume",
    description: "Simply upload your current resume and let our AI scan and analyze its content, identifying areas for improvement.",
    icon: FileText,
    color: "from-blue-600 to-blue-400",
  },
  {
    title: "AI Smart Optimization",
    description: "Our AI enhances your resume using data from successful resumes and current recruitment trends, optimizing keywords, skills, and formatting.",
    icon: Zap,
    color: "from-purple-600 to-purple-400",
  },
  {
    title: "Download Perfect Resume",
    description: "Get your professionally optimized resume ready for job applications, designed to pass ATS systems and impress recruiters.",
    icon: Download,
    color: "from-green-600 to-green-400",
  },
];

export const CoreFeatures = () => {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Three Steps to Your Perfect Resume
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Transform your resume with our simple three-step process powered by advanced AI.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8">
            {features.map((feature) => (
              <div key={feature.title} className="relative">
                <div className={`absolute flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg font-semibold leading-8 tracking-tight text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
