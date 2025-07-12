import { useEffect, useRef } from 'react';

// Declare global Hydra functions
declare global {
  function voronoi(scale?: number, speed?: number, blending?: number): any;
  function osc(frequency?: number, sync?: number, offset?: number): any;
  function src(source?: any): any;
  const time: number;
  const o0: any;
  interface Array<T> {
    fast(speed: number): any;
    smooth(): any;
  }
}

interface HydraBackgroundProps {
  isActive?: boolean;
}

// WebGL detection function
const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
};

const HydraBackground: React.FC<HydraBackgroundProps> = ({ isActive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hydraRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    if (!canvasRef.current || !isActive) return;

    // Check WebGL support first
    if (!isWebGLAvailable()) {
      console.error('WebGL is not supported in this browser');
      return;
    }

    console.log('WebGL is available, proceeding with Hydra initialization');

    // Dynamic import to avoid global issues
    const initHydra = async () => {
      try {
        // Set global polyfill
        (window as any).global = window;
        
        // Wait for canvas to be properly rendered
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const canvas = canvasRef.current!;
        
        // Ensure canvas is visible and has proper dimensions
        if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
          console.log('Canvas not ready, retrying...', retryCountRef.current);
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            setTimeout(initHydra, 200);
            return;
          } else {
            console.error('Canvas failed to initialize after retries');
            return;
          }
        }
        
        const Hydra = (await import('hydra-synth')).default;
        
        // Set up canvas with standard resolution (no high-DPI scaling)
        const rect = canvas.getBoundingClientRect();
        
        // Use standard resolution like the Hydra site
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Set the CSS size to match
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        console.log('Initializing Hydra with canvas:', canvas);
        console.log('Canvas size:', canvas.width, 'x', canvas.height);
        console.log('Display size:', rect.width, 'x', rect.height);

        // Initialize Hydra with standard settings
        const hydra = new Hydra({
          canvas: canvas,
          detectAudio: false,
          enableStreamCapture: false,
        });

        hydraRef.current = hydra;
        console.log('Hydra initialized successfully');

        // Create the exact Hydra pattern from the website
        const createBackground = () => {
          console.log('Creating Hydra pattern...');
          // Clear any existing sketches
          hydra.hush();

          try {
            // The exact pattern from Hydra website - no modifications
            voronoi(350, 0.15)
              .modulateScale(osc(8).rotate(Math.sin(time)), 0.5)
              .thresh(0.8)
              .modulateRotate(osc(7), 0.4)
              .thresh(0.7)
              .diff(src(o0).scale(1.8))
              .modulateScale(osc(2).modulateRotate(o0, 0.74))
              .diff(src(o0).rotate([-0.012, 0.01, -0.002, 0]).scrollY(0, [-1/199800, 0].fast(0.7)))
              .brightness([-0.02, -0.17].smooth().fast(0.5))
              .out();
            console.log('Hydra pattern created successfully');
          } catch (error) {
            console.error('Error creating Hydra pattern:', error);
          }
        };

        // Handle window resize
        const handleResize = () => {
          const rect = canvas.getBoundingClientRect();
          
          canvas.width = rect.width;
          canvas.height = rect.height;
          
          canvas.style.width = rect.width + 'px';
          canvas.style.height = rect.height + 'px';
          
          console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
        };

        window.addEventListener('resize', handleResize);

        // Start the background
        createBackground();

        return () => {
          window.removeEventListener('resize', handleResize);
          if (hydraRef.current) {
            hydraRef.current.hush();
          }
        };
      } catch (error) {
        console.error('Failed to initialize Hydra:', error);
        
        // Retry if we haven't exceeded max retries
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Retrying Hydra initialization (${retryCountRef.current}/${maxRetries})...`);
          setTimeout(initHydra, 500);
        } else {
          console.error('Failed to initialize Hydra after all retries');
        }
      }
    };

    // Reset retry count when component mounts
    retryCountRef.current = 0;
    initHydra();
  }, [isActive]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (hydraRef.current) {
        hydraRef.current.hush();
      }
    };
  }, []);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        // Remove all filters and blend modes to match Hydra site exactly
        pointerEvents: 'none', // Don't interfere with terminal
      }}
    />
  );
};

export default HydraBackground; 