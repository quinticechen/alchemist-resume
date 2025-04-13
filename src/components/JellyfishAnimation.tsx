
import React from "react";
import Lottie from "react-lottie";
import jellyfishAnimation from "@/animations/Jellyfish.yellow.money.json";

interface JellyfishAnimationProps {
  width?: number;
  height?: number;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  isPaused?: boolean;
  isStopped?: boolean;
}

const JellyfishAnimation: React.FC<JellyfishAnimationProps> = ({ 
  width = 200, 
  height = 200,
  className = "",
  loop = true,
  autoplay = true,
  isPaused = false,
  isStopped = false
}) => {
  const defaultOptions = {
    loop,
    autoplay,
    animationData: jellyfishAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  return (
    <div className={className}>
      <Lottie
        options={defaultOptions}
        height={height}
        width={width}
        isPaused={isPaused}
        isStopped={isStopped}
      />
    </div>
  );
};

export default JellyfishAnimation;
