"use client";

import React from 'react';

interface PopInNumberProps {
  value: string;
  className?: string;
}

export function PopInNumber({ value, className = "" }: PopInNumberProps) {
  const chars = value.split('');

  return (
    <span className={`t-digit-group is-animating ${className}`}>
      {chars.map((ch, i) => {
        let stagger = undefined;
        if (i === chars.length - 2) stagger = "1";
        else if (i === chars.length - 1) stagger = "2";

        return (
          <span 
            key={`${i}-${ch}`}
            className="t-digit"
            data-stagger={stagger}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}
