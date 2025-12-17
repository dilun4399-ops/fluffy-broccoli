import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from './components/Experience';
import GestureController from './components/GestureController';
import { AppMode, GestureState } from './types';

// 初始化手势状态，严格匹配GestureState接口定义
const initialGestureState: GestureState = {
  isHandDetected: false,
  gesture: 'NONE',
  handPosition: { x: 0.5, y: 0.5 }
};

/**
 * 应用根组件
 * 整合3D场景、手势识别、界面交互逻辑
 */
export default function App() {
  // 应用模式状态：TREE（圣诞树）/EXPLODE（爆炸）
  const [mode, setMode] = useState<AppMode>('TREE');
  // 调试用手势文本展示
  const [debugGesture, setDebugGesture] = useState<string>('NONE');
  // 手势状态Ref：存储实时手势数据（避免频繁渲染）
  const gestureStateRef = useRef<GestureState>(initialGestureState);
  // 自定义光标DOM元素Ref
  const cursorRef = useRef<HTMLDivElement>(null);

  /**
   * 处理手势更新的回调函数
   * @param newState 新的手势状态数据
   */
  const handleGestureUpdate = useCallback((newState: GestureState) => {
    // 更新手势状态Ref
    gestureStateRef.current = newState;

    // 同步调试文本的手势展示
    if (!newState.isHandDetected) {
      setDebugGesture('NONE');
    } else {
      setDebugGesture(newState.gesture);
    }

    // 根据手势类型切换应用模式
    switch (newState.gesture) {
      case 'PINCH':
        setMode('TREE');
        break;
      case 'OPEN':
        setMode('EXPLODE');
        break;
      default:
        break;
    }

    // 更新自定义光标位置与样式
    if (cursorRef.current) {
      const cursor = cursorRef.current;
      if (newState.isHandDetected) {
        // 显示光标并设置归一化坐标（转百分比）
        cursor.style.opacity = '1';
        cursor.style.left = `${newState.handPosition.x * 100}%`;
        cursor.style.top = `${newState.handPosition.y * 100}%`;

        // 捏合手势添加收缩样式
        newState.gesture === 'PINCH' 
          ? cursor.classList.add('pinched') 
          : cursor.classList.remove('pinched');
      } else {
        // 未检测到手部时隐藏光标
        cursor.style.opacity = '0';
        cursor.classList.remove('pinched');
      }
    }
  }, []);

  /**
   * 手动切换模式的函数
   */
  const toggleMode = () => {
    setMode(prevMode => prevMode === 'TREE' ? 'EXPLODE' : 'TREE');
  };

  /**
   * 初始化自定义光标样式（避免CSS样式丢失）
   */
  useEffect(() => {
    if (cursorRef.current) {
      const cursor = cursorRef.current;
      // 基础光标样式兜底
      Object.assign(cursor.style, {
        pointerEvents: 'none',
        position: 'fixed',
        width: '20px',
        height: '20px',
        border: '2px solid #FF69B4',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 0 10px #FF69B4, inset 0 0 5px #FF69B4',
        zIndex: '9999',
        transition: 'width 0.2s, height 0.2s',
        opacity: '0'
      });

      // 捏合样式兜底
      const style = document.createElement('style');
      style.textContent = `
        .gesture-cursor.pinched {
          background-color: #FF69B4;
          width: '10px';
          height: '10px';
        }
      `;
      document.head.appendChild(style);

      return () => document.head.removeChild(style);
    }
  }, []);

  // 组件渲染
  return (
    <div className="w-full h-screen bg-[#050103] relative font-sans text-white overflow-hidden">
      {/* Three.js 3D画布：承载3D场景核心 */}
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
        {/* 3D场景组件：传入模式和手势状态 */}
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

      {/* 手势与模式状态指示器 */}
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
      <div ref={cursorRef} className="gesture-cursor" />
    </div>
  );
}
