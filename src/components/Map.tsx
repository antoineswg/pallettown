import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

type MarkerData = {
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
}

export function Map() {
  // Load models
  const palletTown = useGLTF('/models/palletTown.glb')
  const tree = useGLTF('/models/tree.glb')
  // const flowerPatch = useGLTF('/models/flowerPatch.glb')
  
  // Reusable method to locate markers
  const getMarkersFromScene = (scene: THREE.Group, markerName: string): MarkerData[] => {
    const markers: MarkerData[] = []
    
    scene.traverse((child) => {
      if (child.name.toLowerCase().includes(markerName.toLowerCase())) {
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
  }
  
  // Reusable method to render objects at marker positions
  const renderInstancesAtMarkers = (
    model: THREE.Group,
    markers: MarkerData[],
    keyPrefix: string
  ) => {
    return markers.map((marker, index) => {
      const modelClone = model.clone()
      return (
        <primitive
          key={`${keyPrefix}-${index}`}
          object={modelClone}
          position={marker.position}
          rotation={marker.rotation}
          scale={marker.scale}
          userData={{ hasCollision: true }}
        />
      )
    })
  }
  
  // Get marker positions
  const treeMarkers = useMemo(() => getMarkersFromScene(palletTown.scene, 'TREEMARKER'), [palletTown.scene])
  // const flowerMarkers = useMemo(() => getMarkersFromScene(palletTown.scene, 'FLOWERPATCHMARKER'), [palletTown.scene])
  
  return (
    <>
      {/* Place city model */}
      <primitive object={palletTown.scene} />
      
      {/* Place all objects at their markers */}
      {renderInstancesAtMarkers(tree.scene, treeMarkers, 'tree')}
      {/* {renderInstancesAtMarkers(flowerPatch.scene, flowerMarkers, 'flowerPatch')} */}
    </>
  )
}
