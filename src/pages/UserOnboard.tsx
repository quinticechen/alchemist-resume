
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import JellyfishAnimation from "@/components/JellyfishAnimation";
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
        {/* OOze with speech bubble */}
        <div className="relative mb-8 w-full flex justify-center">
          <div className="relative">
            <JellyfishAnimation 
              width={140} 
              height={140} 
              mobileWidth={100}
              mobileHeight={100}
            />
            
            {/* Speech bubble - styled to be lighter */}
            <div className={`absolute ${isMobile ? '-top-40' : '-top-4 -right-64'} bg-white border border-neutral-200 rounded-3xl p-4 shadow-sm w-64 md:w-60 z-10`}>
              <div className={`absolute ${isMobile ? 'left-1/2 -bottom-2 -translate-x-1/2 rotate-45' : '-left-3 top-1/2 -translate-y-1/2 rotate-45'} w-4 h-4 bg-white border-b border-r border-neutral-200`}></div>
              <p className="text-sm font-medium text-neutral-800 relative z-10">
                Hmph! I'm OOze, the Resume Alchemist here. Want to make your resume stand out? Click below to begin!
              </p>
            </div>
          </div>
        </div>

        <Card className="p-6 md:p-8 shadow-sm border border-neutral-200 bg-white w-full">
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center">Welcome to Resume Alchemist!</h1>
          
          <p className="text-base md:text-lg text-neutral-500 text-center mt-4">
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
