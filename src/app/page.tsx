"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./page.module.css";

const TOTAL_FRAMES = 128;

// Easing functions
const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Smooth animation refs
  const scrollYRef = useRef(0);
  const targetScrollRef = useRef(0);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef(-1);

  // State for reactive UI
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  // Preload images with smart batching
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    let loadedCount = 0;

    const loadImage = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.src = `/frames/${String(index).padStart(3, "0")}.gif`;
        img.onload = () => {
          loadedImages[index] = img;
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
          resolve();
        };
        img.onerror = () => {
          loadedCount++;
          resolve();
        };
      });
    };

    // Priority loading: first 10 frames
    const priority = Array.from({ length: 10 }, (_, i) => i);
    const rest = Array.from({ length: TOTAL_FRAMES - 10 }, (_, i) => i + 10);

    Promise.all(priority.map(loadImage)).then(() => {
      imagesRef.current = loadedImages;
      setImagesLoaded(true);
    });

    Promise.all(rest.map(loadImage));
  }, []);

  // Draw frame with smooth rendering
  const drawFrame = useCallback((frame: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const frameIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frame)));
    const img = imagesRef.current[frameIdx];

    if (!img?.complete || lastFrameRef.current === frameIdx) return;
    lastFrameRef.current = frameIdx;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(w / img.width, h / img.height);
    const imgW = img.width * scale;
    const imgH = img.height * scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (w - imgW) / 2, (h - imgH) / 2, imgW, imgH);
  }, []);

  // Buttery smooth animation loop
  const animate = useCallback(() => {
    // Smooth scroll interpolation
    scrollYRef.current += (targetScrollRef.current - scrollYRef.current) * 0.08;

    // Smooth frame interpolation
    currentFrameRef.current += (targetFrameRef.current - currentFrameRef.current) * 0.12;

    drawFrame(currentFrameRef.current);

    // Update progress for UI (throttled)
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollYRef.current / maxScroll : 0;
    setScrollProgress(progress);

    // Determine active section
    if (progress < 0.18) setActiveSection(0);
    else if (progress < 0.36) setActiveSection(1);
    else if (progress < 0.54) setActiveSection(2);
    else if (progress < 0.72) setActiveSection(3);
    else if (progress < 0.88) setActiveSection(4);
    else setActiveSection(5);

    rafRef.current = requestAnimationFrame(animate);
  }, [drawFrame]);

  // Setup
  useEffect(() => {
    if (!imagesLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const size = Math.min(window.innerWidth * 0.5, window.innerHeight * 0.55, 500);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastFrameRef.current = -1;
    };

    resize();
    drawFrame(0);

    const onScroll = () => {
      targetScrollRef.current = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetFrameRef.current = (window.scrollY / maxScroll) * (TOTAL_FRAMES - 1);
    };

    rafRef.current = requestAnimationFrame(animate);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    onScroll();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
    };
  }, [imagesLoaded, drawFrame, animate]);

  // Section data with compelling copy
  const sections = [
    {
      eyebrow: "Apple Intelligence",
      title: "iPhone 16 Pro",
      subtitle: "The most powerful iPhone ever. Built for Apple Intelligence.",
      link: "Explore Apple Intelligence"
    },
    {
      eyebrow: "Aerospace-Grade Design",
      title: "Titanium",
      subtitle: "The strongest material ever used in iPhone. Remarkably light, incredibly durable.",
      link: "See the design"
    },
    {
      eyebrow: "Game-Changing Performance",
      title: "A18 Pro Chip",
      subtitle: "The fastest chip ever in a smartphone. Powers everything from gaming to AI.",
      link: "Discover performance"
    },
    {
      eyebrow: "Pro Photography",
      title: "48MP Fusion",
      subtitle: "Capture stunning detail with the most advanced camera system on iPhone.",
      link: "Explore camera"
    },
    {
      eyebrow: "Revolutionary Control",
      title: "Camera Control",
      subtitle: "A dedicated button that gives you instant access to the camera anytime.",
      link: "Learn more"
    },
  ];

  const getTextTransform = (sectionIndex: number) => {
    const isActive = activeSection === sectionIndex;
    const isPast = activeSection > sectionIndex;

    if (isActive) {
      return {
        opacity: 1,
        y: 0,
        scale: 1,
        blur: 0
      };
    } else if (isPast) {
      return {
        opacity: 0,
        y: -80,
        scale: 0.9,
        blur: 12
      };
    } else {
      return {
        opacity: 0,
        y: 80,
        scale: 0.9,
        blur: 12
      };
    }
  };

  return (
    <div className={styles.page} ref={containerRef}>
      {/* Loader */}
      {!imagesLoaded && (
        <div className={styles.loader}>
          <div className={styles.loaderContent}>
            <div className={styles.loaderRing}>
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className={styles.loaderTrack} />
                <circle
                  cx="50" cy="50" r="45"
                  className={styles.loaderProgress}
                  style={{ strokeDashoffset: 283 - (283 * loadingProgress / 100) }}
                />
              </svg>
            </div>
            <span className={styles.loaderPercent}>{loadingProgress}%</span>
          </div>
        </div>
      )}

      {/* Fixed container */}
      <div className={styles.fixedContainer}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <svg className={styles.appleLogo} viewBox="0 0 17 48" fill="currentColor">
              <path d="M15.5752 19.0792C15.5048 13.5432 20.0428 10.8648 20.2596 10.7336C17.5412 6.7184 13.3252 6.1824 11.8596 6.1344C8.24757 5.7664 4.75717 8.2688 2.91797 8.2688C1.04277 8.2688 -1.78483 6.1824 -4.86483 6.2464C-8.80643 6.3104 -12.4644 8.5632 -14.4276 12.0304C-18.4532 19.0992 -15.4148 29.4976 -11.53 35.0976C-9.63477 37.8256 -7.41517 40.8656 -4.48757 40.7536C-1.65117 40.6336 -0.564826 38.8976 2.82397 38.8976C6.17677 38.8976 7.17437 40.7536 10.1356 40.6816C13.1876 40.6336 15.0892 37.9056 16.9324 35.1616C19.0892 32.0256 19.938 28.9536 19.9764 28.7936C19.9028 28.7696 15.6532 27.1936 15.5752 19.0792Z" />
            </svg>
          </div>
          <span className={styles.headerTitle}>iPhone 16 Pro</span>
          <a href="#" className={styles.buyBtn}>Buy</a>
        </header>

        {/* Progress indicators */}
        <div className={styles.progressDots}>
          {sections.map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${activeSection === i ? styles.dotActive : ''}`}
            />
          ))}
        </div>

        {/* Main content area */}
        <div className={styles.contentArea}>
          {/* Floating text sections with morph transitions */}
          {sections.map((section, i) => {
            const transform = getTextTransform(i);
            return (
              <div
                key={i}
                className={styles.textSection}
                style={{
                  opacity: transform.opacity,
                  transform: `translateY(${transform.y}px) scale(${transform.scale})`,
                  filter: `blur(${transform.blur}px)`,
                  pointerEvents: activeSection === i ? 'auto' : 'none'
                }}
              >
                {section.eyebrow && (
                  <span className={styles.eyebrow}>{section.eyebrow}</span>
                )}
                <h1 className={styles.mainTitle}>{section.title}</h1>
                {section.subtitle && (
                  <p className={styles.subtitle}>{section.subtitle}</p>
                )}
                {section.link && (
                  <a href="#" className={styles.learnMore}>
                    {section.link} <span>→</span>
                  </a>
                )}
              </div>
            );
          })}

          {/* Phone canvas with enhanced depth effect */}
          <div
            className={styles.phoneWrapper}
            style={{
              transform: `
                perspective(1500px)
                rotateX(${scrollProgress * 8}deg)
                rotateY(${Math.sin(scrollProgress * Math.PI) * 3}deg)
                translateZ(${scrollProgress * 120}px)
                scale(${1 + scrollProgress * 0.15})
              `
            }}
          >
            <canvas ref={canvasRef} className={styles.canvas} />

            {/* Ambient glow */}
            <div
              className={styles.glow}
              style={{
                opacity: 0.5 + scrollProgress * 0.4,
                transform: `scale(${1 + scrollProgress * 0.3})`
              }}
            />
          </div>
        </div>

        {/* CTA Section */}
        <div
          className={styles.ctaSection}
          style={{
            opacity: activeSection === 5 ? 1 : 0,
            transform: `translateY(${activeSection === 5 ? 0 : 40}px)`,
            pointerEvents: activeSection === 5 ? 'auto' : 'none'
          }}
        >
          <h2 className={styles.ctaTitle}>Experience it for yourself.</h2>
          <p className={styles.ctaPrice}>From $999 or $41.62/mo. for 24 mo.*</p>
          <div className={styles.ctaButtons}>
            <a href="#" className={styles.btnPrimary}>Buy</a>
            <a href="#" className={styles.btnSecondary}>Learn more →</a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className={styles.scrollIndicator}
          style={{ opacity: scrollProgress < 0.05 ? 1 : 0 }}
        >
          <span>Scroll to explore</span>
          <div className={styles.scrollLine}>
            <div className={styles.scrollDot} />
          </div>
        </div>
      </div>

      {/* Scroll track */}
      <div className={styles.scrollTrack} />
    </div>
  );
}
