
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SeekerAnimation from "@/components/OozeAnimation";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

const UserOnboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleGetStarted = () => {
    navigate("/alchemist-workshop");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col items-center">
        {/* OOze with speech bubble - centered on page */}
        <div className="relative mb-12 flex justify-center">
          {/* Speech bubble */}
          <div className="relative mb-4 z-10">
            <div className={`bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm ${isMobile ? 'max-w-xs' : 'max-w-md'}`}>
              <div className="absolute left-1/2 bottom-0 transform translate-y-1/2 -translate-x-1/2 rotate-45 w-4 h-4 bg-white border-r border-b border-neutral-100"></div>
              <p className="text-center text-sm md:text-base font-medium text-neutral-800">
                Hmph! I'm OOze, the Resume Alchemist here. Want to make your resume stand out? Click below to begin!
              </p>
            </div>
          </div>
          
          {/* Seeker animation */}
          <div className="absolute top-full -mt-2">
            <SeekerAnimation 
              width={100} 
              height={100} 
              mobileWidth={80}
              mobileHeight={80}
              showShadow={true}
            />
          </div>
        </div>
        
        {/* Add spacing to account for the Seeker */}
        <div className="mt-16"></div>

        <Card className="p-6 md:p-8 shadow-sm border border-neutral-200 bg-white w-full max-w-2xl mx-auto mt-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center">Welcome to Resume Alchemist!</h1>
          
          <p className="text-base md:text-lg text-neutral-500 text-center mt-4 mx-auto max-w-xl">
            Upload your resume and job description to get a tailored, optimized resume that gets you noticed.
          </p>
          
          <div className="flex justify-center mt-6 md:mt-8">
            <Button 
              onClick={handleGetStarted} 
              className="text-base md:text-lg py-4 md:py-6 px-6 md:px-8 bg-primary hover:bg-primary/90"
              size="lg"
            >
              Start Your Resume Transformation
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserOnboard;
