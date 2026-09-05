import React, { useEffect, useRef } from 'react';

export const BinaryRainBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
      } else {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
      }
    };

    // Initial size setup
    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const fontSize = 14;
    // Set up column head indices
    let columns = Math.ceil(width / fontSize) || 20;
    // Initialize head points randomly staggered above the view
    let drops: number[] = Array(columns).fill(0).map(() => Math.floor(Math.random() * -100));

    const draw = () => {
      // Clear completely to keep the background 100% transparent and prevent build-up
      ctx.clearRect(0, 0, width, height);

      // Set elegant technical font
      ctx.font = `bold ${fontSize}px "JetBrains Mono", Courier, monospace`;

      columns = Math.ceil(width / fontSize) || 20;
      if (drops.length < columns) {
        const extra = columns - drops.length;
        for (let j = 0; j < extra; j++) {
          drops.push(Math.floor(Math.random() * -100));
        }
      }

      for (let i = 0; i < columns; i++) {
        const headY = drops[i];

        // Draw a tail of 12 elements trailing behind the head drop
        const tailLength = 12;
        for (let j = 0; j < tailLength; j++) {
          const y = Math.floor((headY - j) * fontSize);
          
          if (y < -fontSize || y > height + fontSize) continue;

          // Head is brightest, trailing digits fade out
          const opacity = (1 - j / tailLength) * 0.25; // 25% max opacity for high visibility but subtle styling
          
          // Use academic blue tone #2f47b3 for high branding cohesion
          ctx.fillStyle = `rgba(47, 71, 179, ${opacity})`;

          // Determine character - primarily binary digits (1s and 0s)
          const textStr = Math.random() > 0.98 ? (Math.random() > 0.5 ? '1' : '0') : ((i + j) % 2 === 0 ? '1' : '0');
          const x = i * fontSize;

          ctx.fillText(textStr, x, y);
        }

        // Reset the drop sequence to top when the entire tail has left the viewport
        if ((headY - tailLength) * fontSize > height) {
          if (Math.random() > 0.975) {
            drops[i] = 0;
          }
        }

        // Move the drop head downwards smoothly and cleanly
        drops[i] += 0.25;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0 select-none"
      id="binary-rain-canvas"
    />
  );
};
