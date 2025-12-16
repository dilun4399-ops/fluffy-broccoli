import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

const SnowParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const count = 300;
  
  const particles = useMemo(() => {
    const position = new Float32Array(count * 3);
    const random = new Float32Array(count * 3); // For random offset/speed
    
    for (let i = 0; i < count; i++) {
      // Wide distribution around the center
      position[i * 3] = (Math.random() - 0.5) * 60;     // x
      position[i * 3 + 1] = (Math.random() - 0.5) * 40; // y
      position[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10; // z (slightly pushed back)
      
      random[i * 3] = Math.random();
      random[i * 3 + 1] = Math.random();
      random[i * 3 + 2] = Math.random();
    }
    return { position, random };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#FFFFFF') }
  }), []);

  const vertexShader = `
    uniform float uTime;
    attribute vec3 aRandom;
    varying vec3 vRandom;
    varying float vAlpha;

    void main() {
      vRandom = aRandom;
      vec3 pos = position;
      
      // Falling animation
      float speed = 1.0 + aRandom.y * 2.0;
      float yOffset = mod(pos.y - uTime * speed + 20.0, 40.0) - 20.0;
      pos.y = yOffset;
      
      // Swaying animation
      pos.x += sin(uTime * 0.5 + aRandom.z * 10.0) * 0.5;
      pos.z += cos(uTime * 0.3 + aRandom.x * 10.0) * 0.5;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation (larger for bokeh effect)
      gl_PointSize = (150.0 * aRandom.x + 50.0) * (1.0 / -mvPosition.z);
      
      // Fade out at top and bottom boundaries
      float distY = abs(pos.y);
      vAlpha = 1.0 - smoothstep(15.0, 20.0, distY);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    varying vec3 vRandom;
    varying float vAlpha;

    void main() {
      // Coordinate centered at 0,0
      vec2 uv = gl_PointCoord - 0.5;
      float dist = length(uv);
      
      // 1. Basic circular soft glow (Bokeh)
      float circle = 1.0 - smoothstep(0.0, 0.5, dist);
      
      // 2. Snowflake pattern (6-sided modulation)
      float angle = atan(uv.y, uv.x);
      float spike = cos(angle * 6.0) * 0.5 + 0.5;
      
      // Combine: Core is bright, edges are soft and shaped
      float alpha = circle * (0.8 + 0.2 * spike);
      
      // Soft edge glow (Halo effect)
      // Make the center semi-transparent but the "bulk" glowing
      // We want a "dreamy" look, so just a soft power curve
      alpha = pow(alpha, 1.5);

      // Discard outer pixels
      if (dist > 0.5) discard;

      // Color with Bloom intensity
      // Multiply color > 1.0 to trigger bloom (uColor is white 1.0, so multiply by something)
      // Semi-transparent: low base alpha, but high brightness
      gl_FragColor = vec4(uColor * 2.0, alpha * 0.4 * vAlpha);
    }
  `;

  useFrame((state) => {
    if (pointsRef.current) {
      (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.position.length / 3}
          array={particles.position}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={particles.random.length / 3}
          array={particles.random}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        depthWrite={false}
        transparent
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const BackgroundEffects = () => {
  return (
    <group>
      {/* Dense Background Dust */}
      <Stars 
        radius={100} 
        depth={60} 
        count={20000} 
        factor={3} 
        saturation={0} 
        fade 
        speed={0.5} 
      />
      {/* Brighter, Closer Stars */}
      <Stars 
        radius={120} 
        depth={50} 
        count={5000} 
        factor={6} 
        saturation={0.9} 
        fade 
        speed={1} 
      />
      {/* Floating Bokeh Snow */}
      <SnowParticles />
    </group>
  );
};
