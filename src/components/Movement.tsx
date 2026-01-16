import { useThree, useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import * as THREE from 'three'

export function Movement() {
  const { camera, gl, scene } = useThree()
  
  const moveSpeed = 3
  const lookSpeed = 0.002
  const gravity = -9.8
  const jumpForce = 5
  const playerHeight = 1.7
  const playerRadius = 0.5
  
  const keysPressed = useRef<Set<string>>(new Set())
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const verticalVelocity = useRef(0)
  const isOnGround = useRef(false)
  const raycaster = useRef(new THREE.Raycaster())
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code)
      // Jump
      if (e.code === 'Space' && isOnGround.current) {
        verticalVelocity.current = jumpForce
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code)
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === gl.domElement) {
        euler.current.setFromQuaternion(camera.quaternion)
        euler.current.y -= e.movementX * lookSpeed
        euler.current.x -= e.movementY * lookSpeed
        euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x))
        camera.quaternion.setFromEuler(euler.current)
      }
    }
    
    const handleClick = () => {
      gl.domElement.requestPointerLock()
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('mousemove', handleMouseMove)
    gl.domElement.addEventListener('click', handleClick)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('mousemove', handleMouseMove)
      gl.domElement.removeEventListener('click', handleClick)
    }
  }, [camera, gl])
  
  useFrame((_state, delta) => {
    // Prevents fall when alt+tab
    delta = Math.min(delta, 0.1)
    
    // Movement
    direction.current.set(0, 0, 0)
    
    if (keysPressed.current.has('KeyW')) direction.current.z -= 1
    if (keysPressed.current.has('KeyS')) direction.current.z += 1
    if (keysPressed.current.has('KeyA')) direction.current.x -= 1
    if (keysPressed.current.has('KeyD')) direction.current.x += 1
    
    direction.current.normalize()
    
    // Apply movement
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    
    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
    
    velocity.current.set(0, 0, 0)
    velocity.current.addScaledVector(forward, -direction.current.z)
    velocity.current.addScaledVector(right, direction.current.x)
    velocity.current.multiplyScalar(moveSpeed * delta)
    
    // Try to move 
    const newPosition = camera.position.clone().add(velocity.current)
    
    // Check collision with objects
    const collides = checkCollision(newPosition, scene)
    if (!collides) {
      camera.position.add(velocity.current)
    }
    
    // Gravity
    verticalVelocity.current += gravity * delta
    camera.position.y += verticalVelocity.current * delta
    
    // Ground collision
    raycaster.current.set(camera.position, new THREE.Vector3(0, -1, 0))
    raycaster.current.far = playerHeight + 0.1
    const intersects = raycaster.current.intersectObjects(scene.children, true)
    
    const groundIntersects = intersects.filter(intersect => {
      let obj = intersect.object
      while (obj) {
        if (obj.userData.hasCollision === false) {
          return false
        }
        if (obj.userData.hasCollision === true) {
          return true
        }
        obj = obj.parent as THREE.Object3D
      }
      return true 
    })
    
    if (groundIntersects.length > 0) {
      const distanceToGround = groundIntersects[0].distance
      if (distanceToGround < playerHeight) {
        camera.position.y = groundIntersects[0].point.y + playerHeight
        verticalVelocity.current = 0
        isOnGround.current = true
      } else {
        isOnGround.current = false
      }
    } else {
      isOnGround.current = false
    }
    
    // Ceiling collision
    raycaster.current.set(camera.position, new THREE.Vector3(0, 1, 0))
    raycaster.current.far = 0.2
    const ceilingIntersects = raycaster.current.intersectObjects(scene.children, true)
    
    // Check for collisions 
    const validCeilingIntersects = ceilingIntersects.filter(intersect => {
      let obj = intersect.object
      while (obj) {
        if (obj.userData.hasCollision === false) {
          return false
        }
        if (obj.userData.hasCollision === true) {
          return true
        }
        obj = obj.parent as THREE.Object3D
      }
      return true
    })
    
    if (validCeilingIntersects.length > 0 && verticalVelocity.current > 0) {
      verticalVelocity.current = 0
    }
  })
  
  // Check collision
  function checkCollision(position: THREE.Vector3, scene: THREE.Scene): boolean {
    const directions = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1)
    ]
    
    for (const dir of directions) {
      raycaster.current.set(position, dir)
      raycaster.current.far = playerRadius
      const intersects = raycaster.current.intersectObjects(scene.children, true)
      
      for (const intersect of intersects) {
        let obj = intersect.object
        while (obj) {
          if (obj.userData.hasCollision === true) {
            return true
          }
          if (obj.userData.hasCollision === false) {
            break 
          }
          obj = obj.parent as THREE.Object3D
        }
      }
    }
    return false
  }

  return null
}