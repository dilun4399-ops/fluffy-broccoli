import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { GestureState } from '../types';

interface GestureControllerProps {
  onGestureUpdate: (state: GestureState) => void;
}

const GestureController: React.FC<GestureControllerProps> = ({ onGestureUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Internal state ref to prevent excessive re-renders logic upstream if not needed, 
  // but we call the callback frame-by-frame
  const lastVideoTime = useRef(-1);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        landmarkerRef.current = landmarker;
        setLoaded(true);
        startCamera();
      } catch (e) {
        console.error("Failed to load MediaPipe:", e);
        setError("AI Model Load Failed");
      }
    };

    initMediaPipe();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      landmarkerRef.current?.close();
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: 'user' } 
      });
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener('loadeddata', predictWebcam);
    } catch (e) {
      console.error("Camera access denied:", e);
      setError("Camera Blocked");
    }
  };

  const predictWebcam = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker) return;

    if (video.currentTime !== lastVideoTime.current) {
      lastVideoTime.current = video.currentTime;
      const startTimeMs = performance.now();
      
      const results = landmarker.detectForVideo(video, startTimeMs);
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Mirror effect for drawing
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        
        const drawingUtils = new DrawingUtils(ctx);
        
        let gestureState: GestureState = {
          isHandDetected: false,
          gesture: 'NONE',
          handPosition: { x: 0.5, y: 0.5 }
        };

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // Draw landmarks
          drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#FF69B4", lineWidth: 2 });
          drawingUtils.drawLandmarks(landmarks, { color: "#00FFFF", lineWidth: 1, radius: 2 });

          // Logic for Gesture
          // 4 = Thumb Tip, 8 = Index Tip
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const middleTip = landmarks[12];
          const wrist = landmarks[0];

          // Calculate distance between thumb and index
          const dx = thumbTip.x - indexTip.x;
          const dy = thumbTip.y - indexTip.y;
          const dz = thumbTip.z - indexTip.z;
          const pinchDist = Math.sqrt(dx*dx + dy*dy + dz*dz);

          // Calculate if hand is generally open (distance from wrist to middle finger tip)
          // This is a rough heuristic
          
          const isPinch = pinchDist < 0.05; // Tuned threshold
          
          gestureState = {
            isHandDetected: true,
            gesture: isPinch ? 'PINCH' : 'OPEN',
            // Invert X for mirror feel
            handPosition: { x: 1 - landmarks[9].x, y: landmarks[9].y } 
          };
        }
        
        onGestureUpdate(gestureState);
        ctx.restore();
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      <div className="relative rounded-lg overflow-hidden border-2 border-pink-500/50 shadow-[0_0_20px_rgba(255,105,180,0.3)] bg-black/80">
        {!loaded && !error && <div className="absolute inset-0 flex items-center justify-center text-pink-300 text-xs">Loading AI...</div>}
        {error && <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs">{error}</div>}
        <video 
          ref={videoRef} 
          className="w-32 h-24 object-cover transform scale-x-[-1]" 
          autoPlay 
          playsInline
          muted
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full"
          width={320}
          height={240}
        />
      </div>
      <div className="mt-2 text-[10px] text-pink-400 font-mono tracking-widest uppercase opacity-80">
        AI Vision Active
      </div>
    </div>
  );
};

export default GestureController;
