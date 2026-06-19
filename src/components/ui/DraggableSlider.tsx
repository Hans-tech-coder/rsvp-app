"use client";

import React, { useRef, useEffect } from 'react';

interface DraggableSliderProps {
  children: React.ReactNode;
  reverse?: boolean;
  className?: string;
  speed?: number;
}

export function DraggableSlider({ children, reverse = false, className = "", speed = 0.5 }: DraggableSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const isHovered = useRef(false);
  const isDragging = useRef(false);
  const accumulatedScroll = useRef(0);

  useEffect(() => {
    let animationId: number;
    const slider = sliderRef.current;
    if (!slider) return;

    const scrollStep = () => {
      if (!isDown.current && !isHovered.current) {
        accumulatedScroll.current += speed;
        if (accumulatedScroll.current >= 1) {
          const step = Math.floor(accumulatedScroll.current);
          accumulatedScroll.current -= step;

          if (reverse) {
            slider.scrollLeft -= step;
            if (slider.scrollLeft <= 0) {
              slider.scrollLeft = slider.scrollWidth / 2;
            }
          } else {
            slider.scrollLeft += step;
            if (slider.scrollLeft >= slider.scrollWidth / 2) {
               slider.scrollLeft = 0;
            }
          }
        }
      }
      animationId = requestAnimationFrame(scrollStep);
    };
    
    if (reverse) {
      setTimeout(() => {
        if (slider) slider.scrollLeft = slider.scrollWidth / 2;
      }, 100);
    }
    
    animationId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animationId);
  }, [reverse, speed]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    isDown.current = true;
    isDragging.current = false;
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeft.current = sliderRef.current.scrollLeft;
    sliderRef.current.style.cursor = 'grabbing';
  };

  const onMouseLeave = () => {
    isDown.current = false;
    isHovered.current = false;
    if (sliderRef.current) sliderRef.current.style.cursor = 'grab';
  };

  const onMouseEnter = () => {
    isHovered.current = true;
  };

  const onMouseUp = () => {
    isDown.current = false;
    if (sliderRef.current) sliderRef.current.style.cursor = 'grab';
    setTimeout(() => {
       isDragging.current = false;
    }, 50);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    if (Math.abs(walk) > 5) {
      isDragging.current = true;
    }
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const onTouchStart = () => { isHovered.current = true; };
  const onTouchEnd = () => { isHovered.current = false; };

  return (
    <div 
      ref={sliderRef}
      className={`flex w-full gap-4 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing ${className}`}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
      {children}
    </div>
  );
}
