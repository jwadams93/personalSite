declare module 'hydra-synth' {
  export default class Hydra {
    constructor(options?: {
      canvas?: HTMLCanvasElement;
      detectAudio?: boolean;
      enableStreamCapture?: boolean;
    });
    
    hush(): void;
    osc(frequency?: number, sync?: number, offset?: number): any;
    noise(scale?: number, offset?: number, octaves?: number): any;
    voronoi(scale?: number, speed?: number, blending?: number): any;
  }
} 