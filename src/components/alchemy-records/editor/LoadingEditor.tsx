
import React from 'react';
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";

const LoadingEditor: React.FC = () => {
  const loadingOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div className="w-64 h-64 mx-auto">
      <Lottie options={loadingOptions} />
    </div>
  );
};

export default LoadingEditor;
