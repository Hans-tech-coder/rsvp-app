"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X } from "lucide-react"

interface ImageData {
  title?: string
  url: string
}

interface ImageGalleryProps {
  images: ImageData[]
  initialIndex?: number
  onClose?: () => void
}

// Main component for the Image Gallery
export function CircularImageGallery({ images, initialIndex = 0, onClose }: ImageGalleryProps) {
  const [opened, setOpened] = useState(initialIndex)
  const [inPlace, setInPlace] = useState(initialIndex)
  const [disabled, setDisabled] = useState(false)
  const [gsapReady, setGsapReady] = useState(false)
  const autoplayTimer = useRef<number | null>(null)

  useEffect(() => {
    // This effect loads the GSAP library and its plugin from a CDN.
    const loadScripts = () => {
      // @ts-ignore
      if (window.gsap && window.MotionPathPlugin) {
        // @ts-ignore
        window.gsap.registerPlugin(window.MotionPathPlugin)
        setGsapReady(true)
        return
      }

      const gsapScript = document.createElement("script")
      gsapScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
      gsapScript.onload = () => {
        const motionPathScript = document.createElement("script")
        motionPathScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/MotionPathPlugin.min.js"
        motionPathScript.onload = () => {
          // @ts-ignore
          if (window.gsap && window.MotionPathPlugin) {
            // @ts-ignore
            window.gsap.registerPlugin(window.MotionPathPlugin)
            setGsapReady(true)
          }
        }
        document.body.appendChild(motionPathScript)
      }
      document.body.appendChild(gsapScript)
    }

    loadScripts()
  }, [])

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
                title={image.title || ""}
                open={opened === i}
                inPlace={inPlace === i}
                onInPlace={onInPlace}
                activeIndex={opened}
              />
            </div>
          ))}
        <div className="absolute left-0 top-0 z-[100] h-full w-full pointer-events-none">
          <Tabs images={images} onSelect={onClick} activeIndex={opened} />
        </div>
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
  title: string
  open: boolean
  inPlace: boolean
  id: number
  onInPlace: (id: number) => void
  total: number
  activeIndex: number
}

function GalleryImage({ url, title, open, inPlace, id, onInPlace, total, activeIndex }: GalleryImageProps) {
  const [firstLoad, setLoaded] = useState(true)
  const clip = useRef<SVGPathElement>(null)
  
  // Use dynamic window size so it maps perfectly to the screen
  const [size, setSize] = useState({ width: 1200, height: 800 })
  useEffect(() => {
    setSize({ width: window.innerWidth, height: window.innerHeight })
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const { width, height } = size

  // --- Animation Constants ---
  const gap = 12
  const circleRadius = 8
  const heartBaseRadius = 10 // Approximate radius of our heart SVG path
  const defaults = { transformOrigin: "center center" }
  const duration = 0.4
  const viewportDiagonal = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
  const maxScale = (viewportDiagonal / 2) / heartBaseRadius * 1.5 // Ensure it safely covers corners
  
  const bigSize = heartBaseRadius * maxScale
  const overlap = 0

  // --- Position Calculation Functions ---
  const getPosSmall = () => {
    const isMobile = width < 768;
    if (isMobile) {
      let diff = id - activeIndex;
      if (diff > total / 2) diff -= total;
      else if (diff < -total / 2) diff += total;
      return { x: width / 2 + diff * (circleRadius * 2 + gap), y: height - 90, scale: circleRadius / heartBaseRadius };
    }
    return { x: width / 2 - (total * (circleRadius * 2 + gap) - gap) / 2 + id * (circleRadius * 2 + gap), y: height - 50, scale: circleRadius / heartBaseRadius };
  }
  
  const getPosSmallAbove = () => {
    const isMobile = width < 768;
    if (isMobile) {
      let diff = id - activeIndex;
      if (diff > total / 2) diff -= total;
      else if (diff < -total / 2) diff += total;
      return { x: width / 2 + diff * (circleRadius * 2 + gap), y: height / 2, scale: (circleRadius * 2) / heartBaseRadius };
    }
    return { x: width / 2 - (total * (circleRadius * 2 + gap) - gap) / 2 + id * (circleRadius * 2 + gap), y: height / 2, scale: (circleRadius * 2) / heartBaseRadius };
  }
  
  const getPosCenter = () => ({ x: width / 2, y: height / 2, scale: (circleRadius * 7) / heartBaseRadius })
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
        <clipPath id={`${id}_circleClip`}>
          <path className="clip" d="M 8.84 -7.39 a 5.5 5.5 0 0 0 -7.78 0 L 0 -6.33 l -1.06 -1.06 a 5.5 5.5 0 0 0 -7.78 7.78 l 1.06 1.06 L 0 9.23 l 7.78 -7.78 l 1.06 -1.06 a 5.5 5.5 0 0 0 0 -7.78 z" ref={clip}></path>
        </clipPath>
        <clipPath id={`${id}_squareClip`}>
          <rect className="clip" width={width} height={height}></rect>
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}${inPlace ? "_squareClip" : "_circleClip"})`}>
        <image width={width} height={height} href={url} className="pointer-events-none opacity-40 blur-xl" preserveAspectRatio="xMidYMid slice"></image>
        <image width={width} height={height} href={url} className="pointer-events-none" preserveAspectRatio="xMidYMid meet"></image>
      </g>
    </svg>
  )
}

interface TabsProps {
  images: ImageData[]
  onSelect: (index: number) => void
  activeIndex: number
}

function Tabs({ images, onSelect, activeIndex }: TabsProps) {
  const [size, setSize] = useState({ width: 1200, height: 800 })
  useEffect(() => {
    setSize({ width: window.innerWidth, height: window.innerHeight })
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
            className={`absolute rounded-full border-2 ${activeIndex === i ? 'border-wedding-gold scale-125 z-10' : 'border-white/70 hover:border-white'} pointer-events-auto overflow-hidden shadow-sm transition-[left,border-color,transform,z-index] duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
            style={{
              width: circleRadius * 2 + 4,
              height: circleRadius * 2 + 4,
              left: x - circleRadius - 2,
              top: y - circleRadius - 2,
            }}
            aria-label={`View image ${i + 1}`}
          >
            <img src={image.url} className="w-full h-full object-cover" loading="lazy" alt="" />
          </button>
        )
      })}
    </div>
  )
}
