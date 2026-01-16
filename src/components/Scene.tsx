import { Sky } from "@react-three/drei"
import { useControls } from "leva"
import { Perf } from "r3f-perf"

import { Movement } from "./Movement"
import { Map } from "./Map"

export function Scene() {

  const { showPerf } = useControls('Performance', {
    showPerf: { label: "Show Performances", value: false },
  })

  return (
    <>
      {showPerf && <Perf position="top-left" />}

      {/* SKY */}
      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.6}
        azimuth={0.25}
        turbidity={8}
        rayleigh={1.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* LIGHTS */}
      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight
        position={[100, 20, 100]}
        intensity={1.5}
        color="#ffffff"
      />

      {/* GAMEPLAY */}
      <Movement />
      <Map />
    </>
  )
}