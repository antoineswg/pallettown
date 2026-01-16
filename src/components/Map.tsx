import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

export function Map() {
  // Load models
  const palletTown = useGLTF('/models/palletTown.glb')
  const tree = useGLTF('/models/tree.glb')
  
  // Assign trees to markers
  const treeInstances = useMemo(() => {
    const markers: Array<{ position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }> = []
    
    palletTown.scene.traverse((child) => {
      if (child.name.toLowerCase().includes('treemarker')) {
        // Get position, rotation, scale
        const worldPosition = new THREE.Vector3()
        const worldRotation = new THREE.Euler()
        const worldScale = new THREE.Vector3()
        const worldQuaternion = new THREE.Quaternion()
        
        child.getWorldPosition(worldPosition)
        child.getWorldQuaternion(worldQuaternion)
        child.getWorldScale(worldScale)
        worldRotation.setFromQuaternion(worldQuaternion)
        
        markers.push({
          position: worldPosition,
          rotation: worldRotation,
          scale: worldScale
        })
      }
    })
    
    return markers
  }, [palletTown.scene])
  
  return (
    <>
      {/* Place city model */}
      <primitive object={palletTown.scene} />
      
      {treeInstances.map((marker, index) => {
        const treeClone = tree.scene.clone()
        return (
          <primitive
          // Place the trees 
            key={`tree-${index}`}
            object={treeClone}
            position={marker.position}
            rotation={marker.rotation}
            scale={marker.scale}
            userData={{ hasCollision: true }}
          />
        )
      })}
    </>
  )
}
