import React, { useRef } from 'react';
import { PerspectiveCamera, OrbitControls, Environment, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { TreeParticles } from './TreeParticles';
import { TopStar } from './TopStar';
import { BackgroundEffects } from './BackgroundEffects';
import { AppMode, GestureState } from '../types';
import * as THREE from 'three';

interface ExperienceProps {
  mode: AppMode;
  gestureState: React.MutableRefObject<GestureState>;
}

export const Experience: React.FC<ExperienceProps> = ({ mode, gestureState }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 25]} fov={50} />
      
      {/* While we have gesture control, orbit controls are good for fallback mouse debugging or fine tuning */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={10} 
        maxDistance={40}
        // Disable orbit rotation if gesture is active to avoid conflict? 
        // We'll leave it enabled for mouse users.
      />

      {/* Lighting - Cyberpunkish */}
      <ambientLight intensity={0.5} color="#220011" />
      <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={200} color="#ff0080" />
      <spotLight position={[-10, 5, 10]} angle={0.5} penumbra={1} intensity={200} color="#00ffff" />
      
      {/* Rim light from behind */}
      <spotLight position={[0, 10, -20]} angle={0.5} intensity={300} color="#FFD700" />

      {/* Background Elements */}
      <BackgroundEffects />

      {/* The Content */}
      <group position={[0, -4, 0]}>
        <TreeParticles mode={mode} gestureState={gestureState} />
        <TopStar mode={mode} />
      </group>

      {/* Environment Reflections */}
      <Environment preset="city" />

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={1.2} // Only very bright things glow
            mipmapBlur 
            intensity={1.5} 
            radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <Noise opacity={0.05} />
      </EffectComposer>

      {/* Fog to blend the floor - Pushed back to allow stars to be seen */}
      <fog attach="fog" args={['#050103', 30, 150]} />
    </>
  );
};
