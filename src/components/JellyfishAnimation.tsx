
import React from "react";
import Lottie from "react-lottie";
import jellyfishAnimation from "@/animations/Jellyfish.yellow.money.json";

interface JellyfishAnimationProps {
  width?: number;
  height?: number;
  className?: string;
}

const JellyfishAnimation: React.FC<JellyfishAnimationProps> = ({ 
  width = 200, 
  height = 200,
  className = "" 
}) => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
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
      />
    </div>
  );
};

export default JellyfishAnimation;
