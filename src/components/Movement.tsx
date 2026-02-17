import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type MovementProps = {
  disabled?: boolean;
  joystickX?: number;
  joystickY?: number;
};

export function Movement({ disabled = false, joystickX = 0, joystickY = 0 }: MovementProps) {
  const { camera, gl, scene } = useThree();

  const moveSpeed = 3;
  const lookSpeed = 0.002;
  const gravity = -9.8;
  const jumpForce = 5;
  const playerHeight = 1.7;
  const playerRadius = 0.5;

  const keysPressed = useRef<Set<string>>(new Set());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const verticalVelocity = useRef(0);
  const isOnGround = useRef(false);
  const raycaster = useRef(new THREE.Raycaster());
  const lastTouchX = useRef(0);
  const lastTouchY = useRef(0);
  const isTouchMoving = useRef(false);
  const joystickDirection = useRef({ x: 0, y: 0 });

  useEffect(() => {
    joystickDirection.current = { x: joystickX, y: joystickY };
    if (joystickX !== 0 || joystickY !== 0) {
    }
  }, [joystickX, joystickY]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      keysPressed.current.add(e.code);
      // Jump
      if (e.code === "Space" && isOnGround.current) {
        verticalVelocity.current = jumpForce;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (disabled) return;
      if (document.pointerLockElement === gl.domElement) {
        euler.current.setFromQuaternion(camera.quaternion);
        euler.current.y -= e.movementX * lookSpeed;
        euler.current.x -= e.movementY * lookSpeed;
        euler.current.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, euler.current.x),
        );
        camera.quaternion.setFromEuler(euler.current);
      }
    };

    const handleClick = () => {
      if (disabled) return;
      gl.domElement.requestPointerLock();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (disabled) return;
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const joystickArea = 180; 
        if (touch.clientX < joystickArea && touch.clientY > window.innerHeight - joystickArea) {
          return;
        }
        lastTouchX.current = touch.clientX;
        lastTouchY.current = touch.clientY;
        isTouchMoving.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (disabled || !isTouchMoving.current) return;
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastTouchX.current;
        const deltaY = touch.clientY - lastTouchY.current;

        euler.current.setFromQuaternion(camera.quaternion);
        euler.current.y -= deltaX * lookSpeed;
        euler.current.x -= deltaY * lookSpeed;
        euler.current.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, euler.current.x),
        );
        camera.quaternion.setFromEuler(euler.current);

        lastTouchX.current = touch.clientX;
        lastTouchY.current = touch.clientY;
      }
    };

    const handleTouchEnd = () => {
      isTouchMoving.current = false;
    };

    if (disabled && document.pointerLockElement === gl.domElement) {
      document.exitPointerLock();
      keysPressed.current.clear();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    gl.domElement.addEventListener("touchstart", handleTouchStart, { passive: false });
    gl.domElement.addEventListener("touchmove", handleTouchMove, { passive: false });
    gl.domElement.addEventListener("touchend", handleTouchEnd);

    if (!disabled) {
      gl.domElement.addEventListener("click", handleClick);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleMouseMove);
      gl.domElement.removeEventListener("click", handleClick);
      gl.domElement.removeEventListener("touchstart", handleTouchStart);
      gl.domElement.removeEventListener("touchmove", handleTouchMove);
      gl.domElement.removeEventListener("touchend", handleTouchEnd);
    };
  }, [camera, gl, disabled]);

  useFrame((_state, delta) => {
    if (disabled) return;

    // Prevents fall when alt+tab
    delta = Math.min(delta, 0.1);

    // Movement
    direction.current.set(0, 0, 0);

    if (keysPressed.current.has("KeyW")) direction.current.z -= 1;
    if (keysPressed.current.has("KeyS")) direction.current.z += 1;
    if (keysPressed.current.has("KeyA")) direction.current.x -= 1;
    if (keysPressed.current.has("KeyD")) direction.current.x += 1;

    direction.current.x += joystickDirection.current.x;
    direction.current.z += joystickDirection.current.y;

    if (joystickDirection.current.x !== 0 || joystickDirection.current.y !== 0) {
    }

    if (direction.current.length() > 0) {
      direction.current.normalize();
    }

    // Apply movement
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    velocity.current.set(0, 0, 0);
    velocity.current.addScaledVector(forward, -direction.current.z);
    velocity.current.addScaledVector(right, direction.current.x);
    velocity.current.multiplyScalar(moveSpeed * delta);

    // Try to move
    const newPosition = camera.position.clone().add(velocity.current);

    // Check collision with objects
    const collision = checkCollisionWithNormal(newPosition, scene);
    if (collision) {
      const slideVelocity = velocity.current.clone();
      const dotProduct = slideVelocity.dot(collision.normal);
      slideVelocity.addScaledVector(collision.normal, -dotProduct);

      const slidePosition = camera.position.clone().add(slideVelocity);
      const slideCollision = checkCollisionWithNormal(slidePosition, scene);

      if (!slideCollision) {
        camera.position.copy(slidePosition);
      }
    } else {
      camera.position.add(velocity.current);
    }

    // Gravity
    verticalVelocity.current += gravity * delta;
    camera.position.y += verticalVelocity.current * delta;

    // Ground collision
    raycaster.current.set(camera.position, new THREE.Vector3(0, -1, 0));
    raycaster.current.far = playerHeight + 0.1;
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    const groundIntersects = intersects.filter((intersect) => {
      let obj = intersect.object;
      while (obj) {
        if (obj.userData.hasCollision === false) {
          return false;
        }
        if (obj.userData.hasCollision === true) {
          return true;
        }
        obj = obj.parent as THREE.Object3D;
      }
      return true;
    });

    if (groundIntersects.length > 0) {
      const distanceToGround = groundIntersects[0].distance;
      if (distanceToGround < playerHeight) {
        camera.position.y = groundIntersects[0].point.y + playerHeight;
        verticalVelocity.current = 0;
        isOnGround.current = true;
      } else {
        isOnGround.current = false;
      }
    } else {
      isOnGround.current = false;
    }

    // Ceiling collision
    raycaster.current.set(camera.position, new THREE.Vector3(0, 1, 0));
    raycaster.current.far = 0.2;
    const ceilingIntersects = raycaster.current.intersectObjects(
      scene.children,
      true,
    );

    // Check for collisions
    const validCeilingIntersects = ceilingIntersects.filter((intersect) => {
      let obj = intersect.object;
      while (obj) {
        if (obj.userData.hasCollision === false) {
          return false;
        }
        if (obj.userData.hasCollision === true) {
          return true;
        }
        obj = obj.parent as THREE.Object3D;
      }
      return true;
    });

    if (validCeilingIntersects.length > 0 && verticalVelocity.current > 0) {
      verticalVelocity.current = 0;
    }
  });

  // Check collision with normal vector
  function checkCollisionWithNormal(
    position: THREE.Vector3,
    scene: THREE.Scene,
  ): { normal: THREE.Vector3 } | null {
    const directions = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];

    for (const dir of directions) {
      raycaster.current.set(position, dir);
      raycaster.current.far = playerRadius;
      const intersects = raycaster.current.intersectObjects(
        scene.children,
        true,
      );

      for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj) {
          if (obj.userData.hasCollision === true) {
            const normal =
              intersect.face?.normal.clone() || dir.clone().negate();
            normal.transformDirection(intersect.object.matrixWorld);
            normal.normalize();
            return { normal };
          }
          if (obj.userData.hasCollision === false) {
            break;
          }
          obj = obj.parent as THREE.Object3D;
        }
      }
    }
    return null;
  }

  return null;
}
