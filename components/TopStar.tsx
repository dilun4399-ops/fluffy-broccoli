import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

export const TopStar = ({ mode }: { mode: 'TREE' | 'EXPLODE' }) => {
    const starRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    const starShape = useMemo(() => {
        const shape = new THREE.Shape();
        const outerRadius = 1.5;
        const innerRadius = 0.6;
        const points = 5;
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();
        return shape;
    }, []);

    const extrudeSettings = {
        depth: 0.2,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.1,
        bevelThickness: 0.1,
    };

    useFrame((state, delta) => {
        if (starRef.current) {
            // Idle rotation
            starRef.current.rotation.y += delta * 0.5;
            starRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
            
            // Bobbing motion
            starRef.current.position.y = 9.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;

            // Pulse emission
            if (materialRef.current) {
                const pulse = (Math.sin(state.clock.elapsedTime * 3) + 1) * 0.5; // 0 to 1
                materialRef.current.emissiveIntensity = 1 + pulse * 2;
            }

            // If exploding, scale down or fly away? Let's make it spin crazy
            if (mode === 'EXPLODE') {
                starRef.current.rotation.x += delta * 2;
                starRef.current.rotation.y += delta * 5;
            } else {
                 starRef.current.rotation.x = THREE.MathUtils.lerp(starRef.current.rotation.x, 0, delta * 2);
            }
        }
    });

    return (
        <group ref={starRef} position={[0, 9.5, 0]}>
            <mesh>
                <extrudeGeometry args={[starShape, extrudeSettings]} />
                <meshStandardMaterial 
                    ref={materialRef}
                    color="#FFD700" 
                    emissive="#FFD700"
                    emissiveIntensity={2}
                    roughness={0.2}
                    metalness={1}
                />
            </mesh>
            {/* Core Glow */}
            <pointLight distance={5} intensity={5} color="#FF69B4" decay={2} />
            
            {/* Dynamic Sparkles around the star */}
            <Sparkles 
                count={50} 
                scale={4} 
                size={6} 
                speed={0.4} 
                opacity={0.8}
                color="#FFF"
            />
        </group>
    );
};
