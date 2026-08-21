"use client";

import React, { useState } from 'react';

interface RevealImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
}

export function RevealImage({ wrapperClassName = "", className = "", src, alt, ...props }: RevealImageProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className={`t-skel ${isRevealed ? 'is-revealed' : ''} ${wrapperClassName}`}>
      <div className={`t-skel-skeleton absolute inset-0 bg-wedding-gold/10 ${!isRevealed ? 'is-pulsing' : ''} rounded-inherit`}></div>
      <img
        src={src}
        alt={alt}
        className={`t-skel-content !relative ${className}`}
        onLoad={() => setIsRevealed(true)}
        {...props}
      />
    </div>
  );
}
