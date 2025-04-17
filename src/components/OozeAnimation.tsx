import React from "react";
import Lottie from "react-lottie";
import OozeAnimationData from "@/animations/OOze.chat.json";
import { useIsMobile } from "@/hooks/use-mobile";

interface OozeAnimationProps {
  width?: number;
  height?: number;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  isPaused?: boolean;
  isStopped?: boolean;
  mobileWidth?: number;
  mobileHeight?: number;
  showShadow?: boolean;
}

const OozeAnimation: React.FC<OozeAnimationProps> = ({ 
  width = 200, 
  height = 200,
  mobileWidth = 120,
  mobileHeight = 120,
  className = "",
  loop = true,
  autoplay = true,
  isPaused = false,
  isStopped = false,
  showShadow = false
}) => {
  const isMobile = useIsMobile();
  
  const defaultOptions = {
    loop,
    autoplay,
    animationData: OozeAnimationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  const finalWidth = isMobile ? mobileWidth : width;
  const finalHeight = isMobile ? mobileHeight : height;

  return (
    <div className={`relative ${className}`}>
      {showShadow && (
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/10 h-3 w-3/4 rounded-full blur-md"
          style={{
            width: `${finalWidth * 0.6}px`,
          }}
        />
      )}
      <Lottie
        options={defaultOptions}
        height={finalHeight}
        width={finalWidth}
        isPaused={isPaused}
        isStopped={isStopped}
      />
    </div>
  );
};

export default OozeAnimation; 