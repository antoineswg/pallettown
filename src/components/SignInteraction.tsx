import { Html, useGLTF } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type MarkerData = {
  id: string;
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  type: "sign" | "post";
  text: string;
};

type RawMarker = {
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
};

const signTextsByNumber: Record<number, string> = {
  1: "Welcome to Pallet Town.",
  2: "Communal garden.",
};

const signPostText = "Made with <3 by antoine!";

type SignInteractionProps = {
  onPopupChange: (isOpen: boolean, text?: string, type?: "sign" | "post") => void;
  isPopupOpen: boolean;
};

export function SignInteraction({ onPopupChange, isPopupOpen }: SignInteractionProps) {
  const { camera } = useThree();
  const palletTown = useGLTF("/models/palletTown.glb");
  const raycaster = useRef(new THREE.Raycaster());
  const interactionMeshes = useRef<THREE.Mesh[]>([]);

  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [markerDistances, setMarkerDistances] = useState<Record<string, number>>({});

  const getMarkersFromScene = useCallback((scene: THREE.Group): RawMarker[] => {
    const markers: RawMarker[] = [];

    scene.traverse((child) => {
      if (!child.name.toLowerCase().includes("buttonmarker")) {
        return;
      }

      const worldPosition = new THREE.Vector3();
      const worldRotation = new THREE.Euler();
      const worldScale = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();

      child.getWorldPosition(worldPosition);
      child.getWorldQuaternion(worldQuaternion);
      child.getWorldScale(worldScale);
      worldRotation.setFromQuaternion(worldQuaternion);

      markers.push({
        name: child.name,
        position: worldPosition,
        rotation: worldRotation,
        scale: worldScale,
      });
    });

    return markers;
  }, []);

  const markers = useMemo<MarkerData[]>(() => {
    const rawMarkers = getMarkersFromScene(palletTown.scene);

    return rawMarkers.map((marker, index) => {
      const nameLower = marker.name.toLowerCase();
      const isPost = nameLower.includes("signpost");
      const signMatch = nameLower.match(/sign(\d+)/);
      const signNumber = signMatch ? Number(signMatch[1]) : null;
      const id = marker.name ? `${marker.name}-${index}` : `buttonMarker-${index}`;

      let text = signPostText;
      if (!isPost) {
        text = signNumber
          ? signTextsByNumber[signNumber] || `Sign ${signNumber}`
          : "Sign";
      }

      return {
        id,
        name: marker.name,
        position: marker.position,
        rotation: marker.rotation,
        scale: marker.scale,
        type: isPost ? "post" : "sign",
        text,
      };
    });
  }, [getMarkersFromScene, palletTown.scene]);

  const openPopup = useCallback((marker: MarkerData) => {
    setActiveMarkerId(marker.id);
    onPopupChange(true, marker.text, marker.type);
  }, [onPopupChange]);

  const tryInteract = useCallback(() => {
    if (interactionMeshes.current.length === 0) {
      return;
    }

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    raycaster.current.set(camera.position, direction);
    raycaster.current.far = 2.5;

    const hits = raycaster.current.intersectObjects(
      interactionMeshes.current,
      true,
    );

    if (hits.length === 0) {
      return;
    }

    const hit = hits[0].object;
    const markerId = hit.userData.markerId as string | undefined;
    if (!markerId) {
      return;
    }

    const marker = markers.find((item) => item.id === markerId);
    if (marker) {
      openPopup(marker);
    }
  }, [camera, markers, openPopup]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyE" && !activeMarkerId) {
        tryInteract();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tryInteract, activeMarkerId]);

  useEffect(() => {
    if (!isPopupOpen && activeMarkerId) {
      setActiveMarkerId(null);
    }
  }, [isPopupOpen, activeMarkerId]);

  useFrame(() => {
    const distances: Record<string, number> = {};
    markers.forEach((marker) => {
      const dist = camera.position.distanceTo(marker.position);
      distances[marker.id] = dist;
    });
    setMarkerDistances(distances);
  });

  const maxDistance = 5;
  const minDistance = 1;

  return (
    <>
      {markers.map((marker, index) => {
        const distance = markerDistances[marker.id] ?? 999;
        const isInRange = distance < maxDistance;
        const distanceRatio = Math.max(0, Math.min(1, (maxDistance - distance) / (maxDistance - minDistance)));
        const scale = 0.3 + distanceRatio * 0.7;

        return (
          <group key={marker.id} position={marker.position}>
            <mesh
              ref={(mesh) => {
                if (mesh) {
                  interactionMeshes.current[index] = mesh;
                }
              }}
              userData={{ markerId: marker.id, hasCollision: false }}
            >
              <sphereGeometry args={[0.6, 12, 12]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {isInRange && !isPopupOpen && (
              <Html center distanceFactor={8} zIndexRange={[0, 100]}>
                <button
                  className="sign-interact-button"
                  type="button"
                  style={{
                    transform: `scale(${scale})`,
                    opacity: distanceRatio,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    openPopup(marker);
                  }}
                >
                  E
                </button>
              </Html>
            )}
          </group>
        );
      })}

    </>
  );
}
