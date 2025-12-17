import React, { useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from './components/Experience';
import GestureController from './components/GestureController';
import { AppMode, GestureState } from './types';

// 初始状态
const initialGesture: GestureState = {
  detectedHandAction: false,
  gesture: 'none',
  handPosition: { x: 0.5, y: 0.5 }
};

export default function App() {
  const [mode, setMode] = useState<AppMode>('tree');
  const [debugGesture, setDebugGesture] = useState<string>('none');
  
  // 存储手势状态的Ref
  const gestureStateRef = useRef<GestureState>(initialGesture);
  // 自定义光标Ref
  const cursorRef = useRef<HTMLDivElement>(null);

  // 处理手势更新
  const handleGestureUpdate = useCallback((newState: GestureState) => {
    gestureStateRef.current = newState;

    // 更新调试文本
    if (!newState.detectedHandAction) {
      setDebugGesture('none');
    } else {
      setDebugGesture(newState.gesture);
    }

    // 基于手势更新模式
    if (newState.gesture === 'pinch') {
      setMode('tree');
    } else if (newState.gesture === 'open') {
      setMode('explosion');
    }

    // 更新自定义光标位置
    if (cursorRef.current) {
      if (newState.detectedHandAction) {
        cursorRef.current.style.opacity = '1';
        cursorRef.current.style.left = `${newState.handPosition.x * 100}%`;
        cursorRef.current.style.top = `${newState.handPosition.y * 100}%`;

        if (newState.gesture === 'pinch') {
          cursorRef.current.classList.add('pinched');
        } else {
          cursorRef.current.classList.remove('pinched');
        }
      } else {
        cursorRef.current.style.opacity = '0';
      }
    }
  }, []);

  // 切换模式
  const toggleMode = () => {
    setMode(prevMode => prevMode === 'tree' ? 'explosion' : 'tree');
  };

  return (
    <div className="w-full h-screen bg-[#050103] relative font-sans text-white overflow-hidden">
      {/* 3D画布 */}
      <Canvas
        className="absolute inset-0 z-0"
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: false,
          toneMapping: 3, // ACESFilmic
          toneMappingExposure: 1.2
        }}
        onClick={toggleMode}
      >
        <Experience mode={mode} gestureState={gestureStateRef} />
      </Canvas>

      {/* 界面叠加层 */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-400 drop-shadow-[0_0_10px_rgba(255,180,0,0.5)]">
          赛博粉红圣诞梦
        </h1>
        <div className="mt-4 space-y-2 text-sm text-pink-200/80 max-w-sm">
          <p><span className="text-pink-500 font-bold">捏</span>捏树</p >
          <p><span className="text-purple-400 font-bold">敞开</span>爆炸</p >
          <p><span className="text-cyan-400 font-bold">移动</span>旋转</p >
          <p className="text-xs opacity-50 mt-2">或者点击屏幕切换</p >
        </div>
      </div>

      {/* 手势状态指示器 */}
      <div className="absolute top-8 right-8 z-10 flex flex-col items-end pointer-events-none">
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${mode === 'tree' ? 'border-pink-500 bg-pink-500/10' : 'border-purple-500 bg-purple-500/10'}`}>
          模式：{mode}
        </div>
        <div className="mt-2 text-xs text-white/50">
          手势：{debugGesture}
        </div>
      </div>

      {/* AI控制器 */}
      <GestureController onGestureUpdate={handleGestureUpdate} />
      {/* 自定义光标元素 */}
      <div ref={cursorRef} className="gesture-cursor" style={{ opacity: 0 }} />
    </div>
  );
}
