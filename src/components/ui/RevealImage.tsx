"use client";

import React, { useState } from 'react';
import { getImageProps } from 'next/image';

interface RevealImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
}

export function RevealImage({ wrapperClassName = "", className = "", src, alt, sizes, loading = "lazy", decoding = "async", ...props }: RevealImageProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  // With `sizes`, serve a resized srcset through the Next image optimizer instead
  // of the full stored file. The <img> and its layout stay the caller's.
  const optimized = sizes && typeof src === 'string' && src
    ? getImageProps({ src, alt: alt ?? "", fill: true, sizes }).props
    : null;

  return (
    <div className={`t-skel ${isRevealed ? 'is-revealed' : ''} ${wrapperClassName}`}>
      <div className={`t-skel-skeleton absolute inset-0 bg-wedding-gold/10 ${!isRevealed ? 'is-pulsing' : ''} rounded-inherit`}></div>
      <img
        src={optimized?.src ?? src}
        srcSet={optimized?.srcSet}
        sizes={optimized?.sizes ?? sizes}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={`t-skel-content !relative ${className}`}
        onLoad={() => setIsRevealed(true)}
        {...props}
      />
    </div>
  );
}
