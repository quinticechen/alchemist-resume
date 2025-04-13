
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import JellyfishAnimation from "@/components/JellyfishAnimation";
import { Card } from "@/components/ui/card";

const UserOnboard = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/alchemist-workshop");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col items-center">
        {/* OOze with speech bubble */}
        <div className="relative mb-8 w-full flex justify-center">
          <div className="relative">
            <JellyfishAnimation width={200} height={200} />
            
            {/* Speech bubble */}
            <div className="absolute -top-4 -right-64 bg-white rounded-2xl p-4 shadow-lg w-60 z-10">
              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 rotate-45 w-6 h-6 bg-white"></div>
              <p className="text-sm font-medium text-neutral-800 relative z-10">
                Hmph! I'm OOze, the Resume Alchemist here. Want to make your resume stand out? Click below to begin!
              </p>
            </div>
          </div>
        </div>

        <Card className="p-8 shadow-apple space-y-6 backdrop-blur-sm bg-white/80 w-full">
          <h1 className="text-4xl font-bold text-primary text-center">Welcome to Resume Alchemist!</h1>
          
          <p className="text-lg text-neutral-600 text-center">
            Upload your resume and job description to get a tailored, optimized resume that gets you noticed.
          </p>
          
          <div className="flex justify-center">
            <Button 
              onClick={handleGetStarted} 
              className="text-lg py-6 px-8 bg-primary hover:bg-primary-dark"
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
