import {useGLTF} from '@react-three/drei';
import { useRef } from "react"
import * as THREE from 'three'
import { useFrame } from "@react-three/fiber"

interface ModelProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  name?: string;
  rotateY?: boolean;
}

export function Model({ scale = 3, position = [0, 0, 0], rotation = [0, 180, 0], name = "Cubone", rotateY = false }: ModelProps) {
  const modelRef = useRef<THREE.Mesh>(null!);
  const gltf = useGLTF(`/models/${name}.glb`);

  useFrame((_state, delta) => {
    if (modelRef.current && rotateY === true) {
      modelRef.current.rotation.y += delta;
    }
  });

  return <primitive ref={modelRef} object={gltf.scene} scale={scale} position={position} rotation={rotation} />;
}