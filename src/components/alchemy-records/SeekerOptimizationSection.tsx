
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Lottie from "react-lottie";
import animationData from "@/animations/Jellyfish.yellow.money.json";

interface SeekerOptimizationSectionProps {
  optimizationData: any;
}

const SeekerOptimizationSection = ({ optimizationData }: SeekerOptimizationSectionProps) => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <CardTitle className="text-lg">Seeker Optimization Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-4">
          <Lottie 
            options={defaultOptions}
            height={120}
            width={120}
          />
        </div>
        
        {optimizationData?.guidanceForOptimization ? (
          <div className="space-y-4">
            {Array.isArray(optimizationData.guidanceForOptimization) ? (
              optimizationData.guidanceForOptimization.map((tip: string, index: number) => (
                <div key={index} className="p-3 bg-soft-yellow rounded-lg">
                  <p className="text-sm">{tip}</p>
                </div>
              ))
            ) : typeof optimizationData.guidanceForOptimization === 'string' ? (
              <div className="p-3 bg-soft-yellow rounded-lg">
                <p className="text-sm">{optimizationData.guidanceForOptimization}</p>
              </div>
            ) : (
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-sm">No optimization suggestions available at this time.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-sm">No optimization suggestions available at this time.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeekerOptimizationSection;
