
import React, { useEffect, useRef, useState } from "react";
import Lottie from "react-lottie";
import OozeAnimationData from "@/animations/OOze.chat.json";
import { useIsMobile } from "@/hooks/use-mobile";
import gsap from "gsap";

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
  followCursor?: boolean;
  enlargeOnHover?: boolean;
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
  showShadow = false,
  followCursor = false,
  enlargeOnHover = false
}) => {
  const isMobile = useIsMobile();
  const oozeRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const delayedMouse = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>();
  const [isHovering, setIsHovering] = useState(false);
  
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
  
  // Linear interpolation function for smooth movement
  const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;
  
  // Handle mouse movement
  const handleMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    
    mouse.current = {
      x: clientX,
      y: clientY
    };
  };
  
  // Animate the Ooze to follow the cursor
  const animate = () => {
    if (!oozeRef.current || !followCursor) return;
    
    const { x, y } = delayedMouse.current;
    
    delayedMouse.current = {
      x: lerp(x, mouse.current.x, 0.075),
      y: lerp(y, mouse.current.y, 0.075)
    };
    
    const { x: delayedX, y: delayedY } = delayedMouse.current;
    
    // Position the animation at the top-right of the cursor
    // Adjust the offset as needed to make it appear at the top-right
    const topRightOffsetX = 20; // Positive offset moves it to the right
    const topRightOffsetY = -20; // Negative offset moves it up
    
    gsap.set(oozeRef.current, {
      x: delayedX + topRightOffsetX,
      y: delayedY + topRightOffsetY,
      xPercent: 0, // Changed from -50 to 0 to position at the left edge
      yPercent: 0  // Changed from -50 to 0 to position at the top edge
    });
    
    rafId.current = window.requestAnimationFrame(animate);
  };
  
  // Set up mouse tracking and animation
  useEffect(() => {
    if (!followCursor) return;
    
    // Initialize the delayed mouse position
    delayedMouse.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    // Start the animation loop
    animate();
    
    // Add event listener for mouse movement
    window.addEventListener("mousemove", handleMouseMove);
    
    // Clean up
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId.current) {
        window.cancelAnimationFrame(rafId.current);
      }
    };
  }, [followCursor]);

  // Set up hover detection for hero section elements
  useEffect(() => {
    if (!enlargeOnHover) return;
    
    const heroHeadings = document.querySelectorAll('h1, h2, h3, .hero-element, button, a');
    
    const handleMouseEnter = () => {
      setIsHovering(true);
    };
    
    const handleMouseLeave = () => {
      setIsHovering(false);
    };
    
    heroHeadings.forEach(heading => {
      heading.addEventListener('mouseenter', handleMouseEnter);
      heading.addEventListener('mouseleave', handleMouseLeave);
    });
    
    return () => {
      heroHeadings.forEach(heading => {
        heading.removeEventListener('mouseenter', handleMouseEnter);
        heading.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [enlargeOnHover]);

  // Calculate the final size based on hover state
  const displayWidth = isHovering ? finalWidth * 1.5 : finalWidth;
  const displayHeight = isHovering ? finalHeight * 1.5 : finalHeight;

  return (
    <div 
      ref={oozeRef}
      className={`${followCursor ? 'fixed top-0 left-0 pointer-events-none z-50' : 'relative'} ${className}`}
    >
      {showShadow && (
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/10 h-3 w-3/4 rounded-full blur-md"
          style={{
            width: `${displayWidth * 0.6}px`,
            transition: "width 0.3s ease-out"
          }}
        />
      )}
      <div
        style={{
          transition: followCursor ? "width 0.3s ease-out, height 0.3s ease-out" : "none",
          width: `${displayWidth}px`,
          height: `${displayHeight}px`
        }}
      >
        <Lottie
          options={defaultOptions}
          height={displayHeight}
          width={displayWidth}
          isPaused={isPaused}
          isStopped={isStopped}
        />
      </div>
    </div>
  );
};

export default OozeAnimation;
