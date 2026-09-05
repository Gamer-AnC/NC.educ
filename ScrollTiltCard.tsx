import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ThreeDCard } from './ThreeDCard';

interface ScrollTiltCardProps {
  children: React.ReactNode;
  depth?: number;
  glareOpacity?: number;
  className?: string;
  idx?: number;
}

export function ScrollTiltCard({
  children,
  depth = 10,
  glareOpacity = 0.18,
  className = '',
  idx = 0,
}: ScrollTiltCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Hook into the viewport scroll progress relative to this specific card's bounds
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Calculate gentle, organic physical responses as the element enters, passes, and exits the screen
  // 1. rotateX: as you scroll down (from start end to end start), card tilts forward and backward
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [12, 0, -12]);
  
  // 2. rotateY: staggered based on card index to create organic asymmetrical tilt
  const rotYBound = idx % 2 === 0 ? 6 : -6;
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [-rotYBound, 0, rotYBound]);

  // 3. Subtle vertical parallax translation (gently floating up slower than the scroll rate)
  const translateY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  // 4. Subtle scale pop in the sweet spot of the center viewport
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1.02, 0.95]);

  // 5. Fade opacity slightly at the extreme scroll boundaries for a cinematic effect
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.4]);

  return (
    <div ref={containerRef} className="w-full h-full perspective-1000">
      <motion.div
        style={{
          rotateX,
          rotateY,
          y: translateY,
          scale,
          opacity,
          transformStyle: 'preserve-3d',
        }}
        className="w-full h-full"
      >
        <ThreeDCard
          depth={depth}
          glareOpacity={glareOpacity}
          className={`${className} transition-shadow hover:shadow-indigo-200/50`}
        >
          {children}
        </ThreeDCard>
      </motion.div>
    </div>
  );
}
