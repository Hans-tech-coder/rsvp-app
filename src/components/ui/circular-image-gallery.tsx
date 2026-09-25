"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X } from "lucide-react"
import { getImageProps } from "next/image"

// GSAP comes from the CDN once per page. GalleryScreen calls this on mount so
// the script is usually ready before the first tap.
let gsapPromise: Promise<void> | null = null
export function loadGsap(): Promise<void> {
  if ((window as { gsap?: unknown }).gsap) return Promise.resolve()
  if (!gsapPromise) {
    gsapPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
      script.onload = () => resolve()
      script.onerror = () => { gsapPromise = null; reject() }
      document.body.appendChild(script)
    })
  }
  return gsapPromise
}

// One resized copy from the Next image optimizer, at least `cssWidth` device
// pixels wide (DPR capped at 2), instead of the full stored photo.
function optimizedSrc(url: string, cssWidth: number): string {
  try {
    const { srcSet, src } = getImageProps({ src: url, alt: "", fill: true, sizes: `${cssWidth}px` }).props
    const need = cssWidth * Math.min(window.devicePixelRatio || 1, 2)
    const candidates = (srcSet ?? "").split(", ").map((c) => {
      const [u, w] = c.split(" ")
      return { u, w: parseInt(w, 10) }
    }).filter((c) => c.u && c.w)
    return (candidates.find((c) => c.w >= need) ?? candidates[candidates.length - 1])?.u ?? src
  } catch {
    return url
  }
}

interface ImageData {
  title?: string
  url: string
}

type ClipShape = "heart" | "circle"

// Both paths are about 10 units in radius around 0,0, so the GSAP scale math
// below works for either.
const SHAPE_PATHS: Record<ClipShape, string> = {
  heart: "M 8.84 -7.39 a 5.5 5.5 0 0 0 -7.78 0 L 0 -6.33 l -1.06 -1.06 a 5.5 5.5 0 0 0 -7.78 7.78 l 1.06 1.06 L 0 9.23 l 7.78 -7.78 l 1.06 -1.06 a 5.5 5.5 0 0 0 0 -7.78 z",
  circle: "M 0 -10 A 10 10 0 1 1 0 10 A 10 10 0 1 1 0 -10 Z",
}

interface ImageGalleryProps {
  images: ImageData[]
  initialIndex?: number
  onClose?: () => void
  shape?: ClipShape
}

// Main component for the Image Gallery
export function CircularImageGallery({ images, initialIndex = 0, onClose, shape = "heart" }: ImageGalleryProps) {
  const [opened, setOpened] = useState(initialIndex)
  const [inPlace, setInPlace] = useState(initialIndex)
  const [disabled, setDisabled] = useState(false)
  const [gsapReady, setGsapReady] = useState(false)
  const autoplayTimer = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    loadGsap().then(() => { if (!cancelled) setGsapReady(true) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Only the open, in-place and closing photos are visible; the rest are tiny
  // shapes hidden under the dot strip. Mount the heavy full-screen <image>s
  // for those few only, and warm the neighbours so next/prev open instantly.
  const [closing, setClosing] = useState<number | null>(null)
  const lastOpened = useRef(opened)
  useEffect(() => {
    if (lastOpened.current !== opened) setClosing(lastOpened.current)
    lastOpened.current = opened
  }, [opened])
  useEffect(() => {
    const w = window.innerWidth
    for (const i of [opened + 1, opened - 1]) {
      const image = images[(i + images.length) % images.length]
      if (image) new window.Image().src = optimizedSrc(image.url, w)
    }
  }, [opened, images])

  const onClick = (index: number) => {
    if (!disabled) setOpened(index)
  }

  const onInPlace = (index: number) => setInPlace(index)

  const next = useCallback(() => {
    setOpened((currentOpened) => {
      let nextIndex = currentOpened + 1
      if (nextIndex >= images.length) nextIndex = 0
      return nextIndex
    })
  }, [images.length])

  const prev = useCallback(() => {
    setOpened((currentOpened) => {
      let prevIndex = currentOpened - 1
      if (prevIndex < 0) prevIndex = images.length - 1
      return prevIndex
    })
  }, [images.length])

  // Disable clicks during animation transitions
  useEffect(() => setDisabled(true), [opened])
  useEffect(() => setDisabled(false), [inPlace])

  // Esc closes; the arrow keys follow the on-screen buttons, disabled included.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.()
      else if (e.key === "ArrowLeft" && !disabled) prev()
      else if (e.key === "ArrowRight" && !disabled) next()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose, prev, next, disabled])

  const caption = images[opened]?.title

  // Autoplay and timer reset logic
  useEffect(() => {
    if (!gsapReady) return

    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current)
    }

    // Set auto play
    // autoplayTimer.current = window.setInterval(next, 4500)

    return () => {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current)
      }
    }
  }, [opened, gsapReady, next])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md font-sans touch-none">
      {onClose && (
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-wedding-cream/70 hover:text-wedding-cream transition-colors z-[110] bg-black/50 hover:bg-black/70 p-3 rounded-full backdrop-blur-sm"
          aria-label="Close gallery"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      <div className="relative h-full w-full overflow-hidden">
        {gsapReady &&
          images.map((image, i) => (
            <div
              key={`${image.url}-${i}`}
              className="absolute left-0 top-0 h-full w-full"
              style={{ zIndex: inPlace === i ? i : images.length + 1 }}
            >
              <GalleryImage
                total={images.length}
                id={i}
                url={image.url}
                shape={shape}
                open={opened === i}
                inPlace={inPlace === i}
                onInPlace={onInPlace}
                activeIndex={opened}
                visible={opened === i || inPlace === i || closing === i}
              />
            </div>
          ))}
        <div className="absolute left-0 top-0 z-[100] h-full w-full pointer-events-none">
          <Tabs images={images} onSelect={onClick} activeIndex={opened} />
        </div>
        {caption && (
          <div
            aria-live="polite"
            className={`absolute inset-x-0 bottom-[120px] md:bottom-[80px] z-[101] flex justify-center px-4 pointer-events-none transition-opacity duration-[var(--duration-medium)] ease-[var(--ease-smooth-out)] motion-reduce:transition-none ${inPlace === opened ? "opacity-100" : "opacity-0"}`}
          >
            <span className="rounded-full bg-black/55 backdrop-blur-sm px-4 py-1.5 text-xs sm:text-sm uppercase tracking-widest text-wedding-cream drop-shadow-sm">
              {caption}
            </span>
          </div>
        )}
      </div>

      <button
        className="absolute left-4 sm:left-8 top-1/2 z-[101] flex h-16 w-16 -translate-y-1/2 cursor-pointer items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-wedding-cream transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-wedding-cream/70 hover:text-wedding-cream drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        onClick={(e) => { e.stopPropagation(); prev(); }}
        disabled={disabled}
        aria-label="Previous Image"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:-translate-x-1">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        className="absolute right-4 sm:right-8 top-1/2 z-[101] flex h-16 w-16 -translate-y-1/2 cursor-pointer items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-wedding-cream transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-wedding-cream/70 hover:text-wedding-cream drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        onClick={(e) => { e.stopPropagation(); next(); }}
        disabled={disabled}
        aria-label="Next Image"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}

interface GalleryImageProps {
  url: string
  shape: ClipShape
  open: boolean
  inPlace: boolean
  id: number
  onInPlace: (id: number) => void
  total: number
  activeIndex: number
  visible: boolean
}

function GalleryImage({ url, shape, open, inPlace, id, onInPlace, total, activeIndex, visible }: GalleryImageProps) {
  const [firstLoad, setLoaded] = useState(true)
  const clip = useRef<SVGPathElement>(null)
  
  // Use dynamic window size so it maps perfectly to the screen
  // The gallery mounts only after a tap, so the window is always there.
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const { width, height } = size
  const src = visible ? optimizedSrc(url, width) : ""

  // --- Animation Constants ---
  const gap = 12
  const circleRadius = 8
  const shapeBaseRadius = 10 // Radius of the clip path (see SHAPE_PATHS)
  const defaults = { transformOrigin: "center center" }
  const duration = 0.4
  const viewportDiagonal = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
  const maxScale = (viewportDiagonal / 2) / shapeBaseRadius * 1.5 // Ensure it safely covers corners
  
  const bigSize = shapeBaseRadius * maxScale
  const overlap = 0

  // --- Position Calculation Functions ---
  const getPosSmall = () => {
    const isMobile = width < 768;
    if (isMobile) {
      let diff = id - activeIndex;
      if (diff > total / 2) diff -= total;
      else if (diff < -total / 2) diff += total;
      return { x: width / 2 + diff * (circleRadius * 2 + gap), y: height - 90, scale: circleRadius / shapeBaseRadius };
    }
    return { x: width / 2 - (total * (circleRadius * 2 + gap) - gap) / 2 + id * (circleRadius * 2 + gap), y: height - 50, scale: circleRadius / shapeBaseRadius };
  }
  
  const getPosSmallAbove = () => {
    const isMobile = width < 768;
    if (isMobile) {
      let diff = id - activeIndex;
      if (diff > total / 2) diff -= total;
      else if (diff < -total / 2) diff += total;
      return { x: width / 2 + diff * (circleRadius * 2 + gap), y: height / 2, scale: (circleRadius * 2) / shapeBaseRadius };
    }
    return { x: width / 2 - (total * (circleRadius * 2 + gap) - gap) / 2 + id * (circleRadius * 2 + gap), y: height / 2, scale: (circleRadius * 2) / shapeBaseRadius };
  }
  
  const getPosCenter = () => ({ x: width / 2, y: height / 2, scale: (circleRadius * 7) / shapeBaseRadius })
  const getPosEnd = () => ({ x: width / 2 - bigSize + overlap, y: height / 2, scale: maxScale })
  const getPosStart = () => ({ x: width / 2 + bigSize - overlap, y: height / 2, scale: maxScale })

  const wasOpen = useRef(open)

  // --- Animation Logic ---
  useEffect(() => {
    // @ts-ignore
    const gsap = window.gsap
    if (!gsap) return // Guard against GSAP not being loaded yet

    setLoaded(false)
    if (clip.current) {
      const flipDuration = firstLoad ? 0 : duration
      const upDuration = firstLoad ? 0 : 0.2
      const bounceDuration = firstLoad ? 0.01 : 1
      const delay = firstLoad ? 0 : flipDuration + upDuration

      if (open) {
        gsap
          .timeline({ overwrite: true })
          .set(clip.current, { ...defaults, ...getPosSmall() })
          .to(clip.current, {
            ...defaults,
            ...getPosCenter(),
            duration: upDuration,
            ease: "power3.inOut",
          })
          .to(clip.current, {
            ...defaults,
            ...getPosEnd(),
            duration: flipDuration,
            ease: "power4.in",
            onComplete: () => onInPlace(id),
          })
      } else {
        if (wasOpen.current || firstLoad) {
          // Closing animation
          gsap
            .timeline({ overwrite: true })
            .set(clip.current, { ...defaults, ...getPosStart() })
            .to(clip.current, {
              ...defaults,
              ...getPosCenter(),
              delay: delay,
              duration: flipDuration,
              ease: "power4.out",
            })
            .to(clip.current, {
              ...defaults,
              ...getPosSmall(),
              duration: bounceDuration,
              ease: "bounce.out",
            })
        } else {
          // Already closed, just sliding (e.g. activeIndex changed)
          gsap.to(clip.current, {
            ...defaults,
            ...getPosSmall(),
            duration: duration,
            ease: "power3.out",
            overwrite: true,
          })
        }
      }
    }
    
    wasOpen.current = open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, width, height, firstLoad, id, total, activeIndex])

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-full w-full"
    >
      <defs>
        <clipPath id={`${id}_shapeClip`}>
          <path className="clip" d={SHAPE_PATHS[shape]} ref={clip}></path>
        </clipPath>
        <clipPath id={`${id}_squareClip`}>
          <rect className="clip" width={width} height={height}></rect>
        </clipPath>
      </defs>
      {visible && (
        <g clipPath={`url(#${id}${inPlace ? "_squareClip" : "_shapeClip"})`}>
          <image width={width} height={height} href={src} className="pointer-events-none opacity-40 blur-xl" preserveAspectRatio="xMidYMid slice"></image>
          <image width={width} height={height} href={src} className="pointer-events-none" preserveAspectRatio="xMidYMid meet"></image>
        </g>
      )}
    </svg>
  )
}

interface TabsProps {
  images: ImageData[]
  onSelect: (index: number) => void
  activeIndex: number
}

function Tabs({ images, onSelect, activeIndex }: TabsProps) {
  // The gallery mounts only after a tap, so the window is always there.
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const { width, height } = size
  
  const gap = 12
  const circleRadius = 8

  const getPosX = (i: number) => {
    const isMobile = width < 768;
    if (isMobile) {
      // Create infinite looping effect centered around activeIndex
      const total = images.length;
      let diff = i - activeIndex;
      
      // Wrap around the shortest path
      if (diff > total / 2) diff -= total;
      else if (diff < -total / 2) diff += total;

      return width / 2 + diff * (circleRadius * 2 + gap);
    }
    // Desktop layout
    return width / 2 - (images.length * (circleRadius * 2 + gap) - gap) / 2 + i * (circleRadius * 2 + gap);
  }
  const getPosY = () => (width < 768 ? height - 90 : height - 50)

  return (
    <div className="absolute left-0 top-0 w-full h-full pointer-events-none z-[110] overflow-hidden">
      {images.map((image, i) => {
        const x = getPosX(i)
        const y = getPosY()
        // On mobile, hide thumbnails that are way off-screen to improve performance and avoid weird wrapping visuals
        if (width < 768 && (x < -50 || x > width + 50)) return null;

        return (
          <button
            key={`${image.url}-tab-${i}`}
            onClick={(e) => { e.stopPropagation(); onSelect(i); }}
            className={`absolute rounded-full border-2 ${activeIndex === i ? 'border-wedding-gold scale-125 z-10' : 'border-white/70 hover:border-white'} pointer-events-auto overflow-hidden shadow-sm transition-[translate,border-color,transform,z-index] duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
            style={{
              width: circleRadius * 2 + 4,
              height: circleRadius * 2 + 4,
              left: 0,
              top: 0,
              translate: `${x - circleRadius - 2}px ${y - circleRadius - 2}px`,
            }}
            aria-label={`View image ${i + 1}`}
          >
            <img src={optimizedSrc(image.url, 48)} className="w-full h-full object-cover" loading="lazy" decoding="async" alt="" />
          </button>
        )
      })}
    </div>
  )
}
