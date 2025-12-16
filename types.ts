export type AppMode = 'TREE' | 'EXPLODE';

export interface GestureState {
  isHandDetected: boolean;
  gesture: 'NONE' | 'PINCH' | 'OPEN';
  handPosition: { x: number; y: number }; // Normalized 0-1
}

export interface ParticleData {
  positionTree: [number, number, number];
  positionExplode: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  type: 'LEAF' | 'ORNAMENT' | 'RIBBON';
}
