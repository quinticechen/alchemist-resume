

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import WebsitesSection from "@/components/WebsitesSection";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { HeroSection } from "@/components/home/HeroSection";
import { CoreFeatures } from "@/components/home/CoreFeatures";
import { ValueProposition } from "@/components/home/ValueProposition";
import { CallToAction } from "@/components/home/CallToAction";
import WebsitesSection from "@/components/WebsitesSection";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="relative isolate z-0 overflow-hidden bg-gradient-to-b from-neutral-50 to-white">
        {/* Hero Section */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.neutral-100),white)] opacity-20"/>
        <div className="overflow-hidden pt-32 sm:pt-40 pb-80">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
              <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
                <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
                  We&apos;re changing the way you build resumes.
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

        {/* Features Section */}
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

        {/* Testimonials Section */}
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

        {/* Pricing CTA Section */}
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
                  View Pricing
                </a>
                <a href="/faq" className="text-sm font-semibold leading-6 text-neutral-900">
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <img
              src="/lovable-uploads/home-cta.png"
              alt="Product screenshot"
              className="mt-16 w-[48rem] max-w-none rounded-md bg-neutral-100 shadow-xl ring-1 ring-neutral-400/10 sm:mt-24"
            />
          </div>
        </div>
        
        {/* Alchemist Section */}
        {/* <AlchemistSection /> */}
        
        {/* FAQ Section (existing) */}
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
        
        {/* New Websites Section */}
        <WebsitesSection />
        
        {/* Keep existing end content */}
      </div>
    </div>
  );
};
const navigate = useNavigate();
const [session, setSession] = useState<Session | null>(null);
const [isLoading, setIsLoading] = useState(true);
const { toast } = useToast();

useEffect(() => {
  const initializeSession = async () => {
    try {
      const {
        data: { session: initialSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }

      setSession(initialSession);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, currentSession) => {
        setSession(currentSession);

        if (event === "SIGNED_IN" && currentSession) {
          toast({
            title: "Successfully signed in",
            description: "Redirecting to workshop...",
          });
          navigate("/alchemist-workshop");
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem checking your login status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  initializeSession();
}, [navigate, toast]);

if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="mb-4 text-xl font-semibold text-primary">
          Loading...
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
    <HeroSection />
    <CoreFeatures />
    <ValueProposition />
    <WebsitesSection />
    <CallToAction />
  </div>
);


export default Home;

