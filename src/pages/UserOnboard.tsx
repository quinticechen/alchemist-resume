
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
      <div className="max-w-2xl w-full text-center">
        <div className="mb-6">
          <JellyfishAnimation width={300} height={300} />
        </div>

        <Card className="p-8 shadow-apple space-y-6 backdrop-blur-sm bg-white/80">
          <h1 className="text-4xl font-bold text-primary">Welcome to Resume Alchemist!</h1>
          
          <div className="text-xl font-medium text-neutral-800">
            <p className="mb-4">
              "Hmph! I'm OOze, the Resume Alchemist here. Want to make your resume stand out? Click below to begin!"
            </p>
          </div>
          
          <Button 
            onClick={handleGetStarted} 
            className="text-lg py-6 px-8 bg-primary hover:bg-primary-dark"
            size="lg"
          >
            Start Your Resume Transformation
          </Button>
          
          <p className="text-neutral-600 mt-4 text-sm">
            Upload your resume and job description to get a tailored, optimized resume that gets you noticed.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default UserOnboard;
