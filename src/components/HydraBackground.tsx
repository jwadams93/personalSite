import { useEffect, useRef } from 'react';

// Declare global Hydra functions
declare global {
  function voronoi(scale?: number, speed?: number, blending?: number): any;
  function osc(frequency?: number, sync?: number, offset?: number): any;
  function src(source?: any): any;
  function solid(r?: number, g?: number, b?: number): any;
  function shape(scale?: number, smoothness?: number, complexity?: number): any;
  function noise(scale?: number, speed?: number, offset?: number): any;
  function gradient(colors?: number[]): any;
  function render(buffer?: any): any;
  const time: number;
  const o0: any;
  const o1: any;
  const o2: any;
  const o3: any;
  const a: any;
  const mouse: { x: number; y: number };
  interface Array<T> {
    fast(speed: number): any;
    smooth(): any;
  }
}

interface HydraBackgroundProps {
  isActive?: boolean;
  currentPattern?: number;
  onPatternChange?: (patternIndex: number) => void;
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

// Pattern definitions - we'll add more patterns here
const PATTERNS = [
  {
    name: 'Original Glitch',
    create: () => {
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
    }
  },
  {
    name: 'Audio Reactive Oscillators',
    create: () => {
      osc(18, 0.1, 0).color(2, 0.1, 2)
        .mult(osc(20, 0.01, 0)).repeat(2, 20).rotate(0.5).modulate(o1)
        .scale(1, () => (a.fft[0]*0.9 + 2)).diff(o1).out(o0);
      osc(20, 0.2, 0).color(2, 0.7, 0.1).mult(osc(40)).modulateRotate(o0, 0.2)
        .rotate(0.2).out(o1);
    }
  },
  {
    name: 'Random Geometric Shapes',
    create: () => {
      function r(min=0,max=1) { return Math.random()*(max-min)+min; }
      
      solid(1,1,1)
        .diff(shape([4,4,4,24].smooth().fast(.5),r(0.6,0.93),.09).repeat(20,10))
        .modulateScale(osc(8).rotate(r(-.5,.5)),.52)
        .add(
          src(o0).scale(0.965).rotate(.012*(Math.round(r(-2,1))))
          .color(r(),r(),r())
          .modulateRotate(o0,r(0,0.5))
          .brightness(.15)
          ,.7)
        .out();
    }
  },
  {
    name: 'Kaleidoscope Mouse',
    create: () => {
      osc(20, 0.01, 1.1)
        .kaleid(5)
        .color(2.83,0.91,0.39)
        .rotate(0, 0.1)
        .modulate(o0, () => mouse.x * 0.0003)
        .scale(1.01)
        .out(o0);
    }
  },
  {
    name: 'Dynamic Scaling Shapes',
    create: () => {
      const speed = 0.3;
      
      shape(20,0.2,0.3)
        .color(0.5,0.8,50)
        .scale(() => Math.sin(time)+1*2)
        .repeat(() => Math.sin(time)*10)
        .modulateRotate(o0)
        .scale(() => Math.sin(time)+1 *1.5)
        .modulate(noise(2,2))
        .rotate(1, .2)
        // .invert(2.4)
        .out(o0);
    }
  },
  {
    name: 'Voronoi Scroll Patterns',
    create: () => {
      shape(1,1)
        .mult(voronoi(1000,2)
        .blend(o0).luma())
        .add(shape(3,0.125)
             .rotate(1,1).mult(voronoi(1000,1).luma())
             .rotate(1.5)).scrollX([0.1,-0.0625,0.005,0.00001],0)
        .scrollY([0.1,-0.0625,0.005,0.00001],0)
        .out();
    }
  },
  {
    name: 'Kaleidoscope Modulation',
    create: () => {
      osc(40, 0.2, 1)
        .modulateScale(osc(40, 0, 1.739)
        .kaleid(8))
        .repeat(2, 2.2639)
        .modulate(o0, 0.05)
        .modulateKaleid(shape(4, 0.1, 1))
        .out(o0);
    }
  },
  {
    name: 'Multi-Buffer Complex',
    create: () => {
      noise(3,0.3,3).thresh(0.3,0.03).diff(o3,0.3).out(o1);
      gradient([0.3,0.3,3]).diff(o0).blend(o1).out(o3);
      voronoi(33,3,30).rotate(3,0.3,0).modulateScale(o2,0.3).color(-3,3,0).brightness(3).out(o0);
      shape(30,0.3,1).invert(()=>Math.sin(time)*3).out(o2);
      
      render(o3);
    }
  }
];

const HydraBackground: React.FC<HydraBackgroundProps> = ({ 
  isActive = true, 
  currentPattern = 0,
  onPatternChange 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hydraRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const autoCycleRef = useRef<number | null>(null);

  // Auto-cycle patterns every 30 seconds
  useEffect(() => {
    if (!isActive || PATTERNS.length <= 1) return;

    const startAutoCycle = () => {
      autoCycleRef.current = setInterval(() => {
        const nextPattern = (currentPattern + 1) % PATTERNS.length;
        onPatternChange?.(nextPattern);
      }, 30000); // 30 seconds
    };

    startAutoCycle();

    return () => {
      if (autoCycleRef.current) {
        clearInterval(autoCycleRef.current);
      }
    };
  }, [isActive, currentPattern, onPatternChange]);

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

        // Create the current pattern
        const createPattern = () => {
          console.log(`Creating pattern: ${PATTERNS[currentPattern]?.name || 'Unknown'}`);
          // Clear any existing sketches
          hydra.hush();

          try {
            const pattern = PATTERNS[currentPattern];
            if (pattern) {
              pattern.create();
              console.log('Pattern created successfully');
            }
          } catch (error) {
            console.error('Error creating pattern:', error);
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

        // Start the current pattern
        createPattern();

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
  }, [isActive, currentPattern]);

  // Update pattern when currentPattern changes
  useEffect(() => {
    if (hydraRef.current && isActive) {
      const createPattern = () => {
        console.log(`Switching to pattern: ${PATTERNS[currentPattern]?.name || 'Unknown'}`);
        // Clear any existing sketches
        hydraRef.current.hush();

        try {
          const pattern = PATTERNS[currentPattern];
          if (pattern) {
            pattern.create();
            console.log('Pattern switched successfully');
          }
        } catch (error) {
          console.error('Error switching pattern:', error);
        }
      };

      createPattern();
    }
  }, [currentPattern, isActive]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (autoCycleRef.current) {
        clearInterval(autoCycleRef.current);
      }
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