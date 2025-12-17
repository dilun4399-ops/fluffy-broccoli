import React, { useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from './components/Experience';
import GestureController from './components/GestureController';
import { AppMode, GestureState } from './types';

// 初始化手势状态，严格匹配GestureState接口
const initialGestureState: GestureState = {
  isHandDetected: false,
  gesture: 'NONE',
  handPosition: { x: 0.5, y: 0.5 }
};

// 组件核心逻辑
export default function App() {
  // 模式状态：默认TREE，匹配AppMode类型
  const [mode, setMode] = useState<AppMode>('TREE');
  // 调试用手势文本状态
  const [debugGesture, setDebugGesture] = useState<string>('NONE');
  // 手势状态Ref：存储实时手势数据
  const gestureStateRef = useRef<GestureState>(initialGestureState);
  // 自定义光标Ref：绑定DOM元素
  const cursorRef = useRef<HTMLDivElement>(null);

  // 处理手势更新：使用useCallback缓存函数
  const handleGestureUpdate = useCallback((newState: GestureState) => {
    // 更新手势状态Ref
    gestureStateRef.current = newState;

    // 更新调试文本：同步手势类型
    if (!newState.isHandDetected) {
      setDebugGesture('NONE');
    } else {
      setDebugGesture(newState.gesture);
    }

    // 基于手势切换模式：匹配AppMode的取值
    if (newState.gesture === 'PINCH') {
      setMode('TREE');
    } else if (newState.gesture === 'OPEN') {
      setMode('EXPLODE');
    }

    // 更新自定义光标位置与样式
    if (cursorRef.current) {
      if (newState.isHandDetected) {
        // 显示光标并设置位置（归一化坐标转百分比）
        cursorRef.current.style.opacity = '1';
        cursorRef.current.style.left = `${newState.handPosition.x * 100}%`;
        cursorRef.current.style.top = `${newState.handPosition.y * 100}%`;

        // 捏合手势时添加收缩样式
        if (newState.gesture === 'PINCH') {
          cursorRef.current.classList.add('pinched');
        } else {
          cursorRef.current.classList.remove('pinched');
        }
      } else {
        // 未检测到手部时隐藏光标
        cursorRef.current.style.opacity = '0';
        cursorRef.current.classList.remove('pinched');
      }
    }
  }, []);

  // 手动切换模式函数
  const toggleMode = () => {
    setMode(prevMode => prevMode === 'TREE' ? 'EXPLODE' : 'TREE');
  };

  // 组件渲染
  return (
    <div className="w-full h-screen bg-[#050103] relative font-sans text-white overflow-hidden">
      {/* Three.js 3D画布：承载3D场景 */}
      <Canvas
        className="absolute inset-0 z-0"
        shadows
        dpr={[1, 2]} // 适配不同设备像素比
        gl={{
          antialias: false,
          toneMapping: 3, // ACESFilmic色调映射
          toneMappingExposure: 1.2
        }}
        onClick={toggleMode} // 点击画布切换模式
      >
        {/* 3D场景核心组件：传入模式和手势状态 */}
        <Experience mode={mode} gestureState={gestureStateRef} />
      </Canvas>

      {/* 界面文案叠加层 */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-400 drop-shadow-[0_0_10px_rgba(255,105,180,0.5)]">
          赛博粉红圣诞梦
        </h1>
        <div className="mt-4 space-y-2 text-sm text-pink-200/80 max-w-sm">
          <p><span className="text-pink-500 font-bold">捏合</span>显示圣诞树</p >
          <p><span className="text-purple-400 font-bold">张开</span>触发爆炸效果</p >
          <p><span className="text-cyan-400 font-bold">移动</span>控制场景旋转</p >
          <p className="text-xs opacity-50 mt-2">点击屏幕也可切换模式</p >
        </div>
      </div>

      {/* 手势状态指示器 */}
      <div className="absolute top-8 right-8 z-10 flex flex-col items-end pointer-events-none">
        <div 
          className={`px-3 py-1 rounded-full text-xs font-bold border 
            ${mode === 'TREE' 
              ? 'border-pink-500 bg-pink-500/10' 
              : 'border-purple-500 bg-purple-500/10'}`}
        >
          模式：{mode === 'TREE' ? '圣诞树' : '爆炸'}
        </div>
        <div className="mt-2 text-xs text-white/50">
          手势：{debugGesture}
        </div>
      </div>

      {/* 手势识别控制器：传入更新回调 */}
      <GestureController onGestureUpdate={handleGestureUpdate} />
      {/* 自定义光标DOM元素 */}
      <div ref={cursorRef} className="gesture-cursor" style={{ opacity: 0 }} />
    </div>
  );
}
