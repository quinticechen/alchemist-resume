
import React from "react";
import Lottie from "react-lottie";
import jellyfishAnimation from "@/animations/Jellyfish.yellow.money.json";
import { useIsMobile } from "@/hooks/use-mobile";

interface JellyfishAnimationProps {
  width?: number;
  height?: number;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  isPaused?: boolean;
  isStopped?: boolean;
  mobileWidth?: number;
  mobileHeight?: number;
}

const JellyfishAnimation: React.FC<JellyfishAnimationProps> = ({ 
  width = 200, 
  height = 200,
  mobileWidth = 120,
  mobileHeight = 120,
  className = "",
  loop = true,
  autoplay = true,
  isPaused = false,
  isStopped = false
}) => {
  const isMobile = useIsMobile();
  
  const defaultOptions = {
    loop,
    autoplay,
    animationData: jellyfishAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  const finalWidth = isMobile ? mobileWidth : width;
  const finalHeight = isMobile ? mobileHeight : height;

  return (
    <div className={className}>
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

export default JellyfishAnimation;
