"use client";

import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { useInView } from 'motion/react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface TextsRevealProps {
  children: React.ReactNode;
  className?: string;
  isHero?: boolean;
}

export function TextsReveal({ children, className = "", isHero = false }: TextsRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  useIsomorphicLayoutEffect(() => {
    if (!isInView) return;

    // The screen crossfades in from the tap (0.7s in page.tsx). Start the stagger
    // once the screen is partly visible so the lines rise with it, not after it.
    // The hero waits a little longer for the loader's fade on first load.
    const delay = isHero ? 350 : 150;
    
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.classList.remove("is-hiding");
        void containerRef.current.offsetHeight; // force reflow
        containerRef.current.classList.add("is-shown");
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isInView, isHero]);

  // Convert children to an array to map over them
  const childArray = React.Children.toArray(children);

  return (
    <div ref={containerRef} className={`t-stagger ${className}`}>
      {childArray.map((child, index) => {
        // If the child is a valid React element, we can clone it and add our classes
        if (React.isValidElement<{ className?: string; style?: React.CSSProperties }>(child)) {
          // Merge existing classes with our stagger class
          const existingClass = child.props.className || "";
          // Add inline style for the index
          const existingStyle = child.props.style || {};
          
          return React.cloneElement(child, {
            className: `t-stagger-line ${existingClass}`,
            style: {
              ...existingStyle,
              "--stagger-idx": index
            } as React.CSSProperties
          });
        }
        
        // If it's just text or a number, wrap it in a span
        return (
          <span 
            key={index}
            className="t-stagger-line"
            style={{ "--stagger-idx": index } as React.CSSProperties}
          >
            {child}
          </span>
        );
      })}
    </div>
  );
}

