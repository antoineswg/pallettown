import { useHelper } from "@react-three/drei"
import { useRef } from "react"
import * as THREE from 'three'
import { useFrame } from "@react-three/fiber"
import { useControls } from "leva"
import { Perf } from "r3f-perf"
import { Html } from "@react-three/drei"

import { Model } from "./Model"
import { Movement } from "./Movement"

export function Scene() {

  // HELPERS
  const directionalLightRef = useRef<THREE.DirectionalLight>(null!);
  useHelper(directionalLightRef, THREE.DirectionalLightHelper, 3, 'white');


  const boxRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (boxRef.current) {
      boxRef.current.rotation.z += delta;
      boxRef.current.position.y += Math.sin(state.clock.elapsedTime - 2) * delta;
    }
  });

  const { showPerf } = useControls('Performance', {
    showPerf: { label: "Show Performances", value: false },
  })

  // const { modelScale, modelRotation, modelPosition, rotateY } = useControls('Models', {
  //   modelScale: { label: "Model Scale", value: 3, min: 1, max: 10, step: 0.1 },
  //   modelRotation: { label: "Model Rotation", value: [0, 0, 0], step: 0.1 },
  //   modelPosition: { label: "Model Position", value: [0, 0, 0], step: 0.1 },
  //   rotateY: { label: "Rotate Y", value: true },
  // })

  return (
    <>

    <Movement />

      {showPerf && <Perf position="top-left" />}

      {/* CAMERA - OrbitControls removed for FPS controls */}
      {/* <OrbitControls /> */}

      {/* FLOOR */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#808080" />
      </mesh>

      {/* OBJECTS */}
      <mesh position={[0, 3, 0]} rotation={[1, 0, 24]}>
        <boxGeometry args={[1, 2, 1]} />
        <meshToonMaterial color="red" />
      </mesh>
      <mesh position={[-3, 0, 0]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshToonMaterial color="green" />
      </mesh>
      <mesh position={[3, 0, 0]}>
        <coneGeometry args={[1, 2, 8]} />
        <meshToonMaterial color="blue" />
      </mesh>
      <mesh position={[0, -3, 0]} rotation={[Math.PI / 2, 0, -4]}>
        <capsuleGeometry args={[1, 1.5, 4, 8]} />
        <meshToonMaterial color="yellow" />
      </mesh>

      {/* LIGHTS */}
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={2} color="antiquewhite" ref={directionalLightRef} />

      {/* MODELS */}
      <Model scale={3} position={[-2, 0, 1]} rotation={[0, 0, 0]} name="Cubone" rotateY={true} />
      <Model scale={5} position={[2, 0, 1]} rotation={[0, 2.5, 0]} name="Snorlax" />

      {/* HTML */}
      <Html position={[5, 0, 0]}>
        <button className="catch-button">
          Catch'em all!
        </button>
      </Html>
    </>
  )
}