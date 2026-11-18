import React from 'react';
import Lottie from 'react-lottie';
import animationData from '@/animations/OOze.QQ.json'; // Adjust path if needed

const OOzeAnimation = ({ width, height, mobileWidth, mobileHeight, showShadow }) => {
  const isMobile = window.innerWidth < 768; // Simple check for mobile

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  const animationStyle = {
    width: isMobile ? mobileWidth : width,
    height: isMobile ? mobileHeight : height,
    // You might want to add shadow styling here if showShadow is true
    // For example: boxShadow: showShadow ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
  };

  return (
    <div style={animationStyle}>
      <Lottie options={defaultOptions} />
    </div>
  );
};

export default OOzeAnimation;
