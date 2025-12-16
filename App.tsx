import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './components/Experience';
import GestureController from './components/GestureController';
import { AppMode, GestureState } from './types';

// Initial state
const INITIAL_GESTURE: GestureState = {
  isHandDetected: false,
  gesture: 'NONE',
  handPosition: { x: 0.5, y: 0.5 }
};

export default function App() {
  const [mode, setMode] = useState<AppMode>('TREE');
  const [debugGesture, setDebugGesture] = useState<string>('No Hand');
  
  // We use a Ref for gesture state to avoid re-rendering the entire Canvas tree 
  // on every single webcam frame update. The Scene components will read this ref in useFrame.
  const gestureStateRef = useRef<GestureState>(INITIAL_GESTURE);

  // Custom Cursor Ref
  const cursorRef = useRef<HTMLDivElement>(null);

  const handleGestureUpdate = useCallback((newState: GestureState) => {
    gestureStateRef.current = newState;

    // Update UI Debug text
    if (!newState.isHandDetected) {
      setDebugGesture('No Hand');
    } else {
      setDebugGesture(newState.gesture);
      
      // Update Mode based on Gesture
      // Pinch -> TREE
      // Open -> EXPLODE
      if (newState.gesture === 'PINCH') {
        setMode('TREE');
      } else if (newState.gesture === 'OPEN') {
        setMode('EXPLODE');
      }
    }

    // Update Custom Cursor Position
    if (cursorRef.current) {
        if (newState.isHandDetected) {
            cursorRef.current.style.opacity = '1';
            cursorRef.current.style.left = `${newState.handPosition.x * 100}%`;
            cursorRef.current.style.top = `${newState.handPosition.y * 100}%`;
            
            if (newState.gesture === 'PINCH') {
                cursorRef.current.classList.add('pinched');
            } else {
                cursorRef.current.classList.remove('pinched');
            }
        } else {
            cursorRef.current.style.opacity = '0';
        }
    }
  }, []);

  const toggleMode = () => {
    setMode((prev) => (prev === 'TREE' ? 'EXPLODE' : 'TREE'));
  };

  return (
    <div className="w-full h-screen bg-[#050103] relative font-sans text-white overflow-hidden">
      
      {/* 3D Canvas */}
      <Canvas
        className="absolute inset-0 z-0"
        shadows
        dpr={[1, 2]} // Optimize pixel ratio
        gl={{ 
            antialias: false, 
            toneMapping: 3, // ACESFilmic
            toneMappingExposure: 1.2
        }}
        onClick={toggleMode} // Mouse fallback
      >
        <Experience mode={mode} gestureState={gestureStateRef} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-400 drop-shadow-[0_0_10px_rgba(255,105,180,0.5)]">
          Cyber-Pink Christmas
        </h1>
        <div className="mt-4 space-y-2 text-sm text-pink-200/80 max-w-sm">
            <p><span className="text-pink-500 font-bold">PINCH</span> to Assemble Tree</p>
            <p><span className="text-purple-400 font-bold">OPEN HAND</span> to Explode</p>
            <p><span className="text-cyan-400 font-bold">MOVE OPEN HAND</span> to Rotate</p>
            <p className="text-xs opacity-50 mt-2">Or click screen to toggle.</p>
        </div>
      </div>

      {/* Gesture Status Indicator */}
      <div className="absolute top-8 right-8 z-10 flex flex-col items-end pointer-events-none">
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
            mode === 'TREE' ? 'border-pink-500 text-pink-500 bg-pink-500/10' : 'border-purple-500 text-purple-500 bg-purple-500/10'
        }`}>
            STATE: {mode}
        </div>
        <div className="mt-2 text-xs text-white/50">
            Gesture: {debugGesture}
        </div>
      </div>

      {/* AI Controller (Camera & Logic) */}
      <GestureController onGestureUpdate={handleGestureUpdate} />

      {/* Custom Cursor Element */}
      <div ref={cursorRef} className="gesture-cursor" style={{ opacity: 0 }} />
      
    </div>
  );
}
