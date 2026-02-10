import { Html, useGLTF } from "@react-three/drei";
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type TeleportMarker = {
  id: string;
  name: string;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3 | null;
};

type RawMarker = {
  name: string;
  position: THREE.Vector3;
};

type TeleporterProps = {
  disabled?: boolean;
  onFadeChange: (opacity: number) => void;
};

export function Teleporter({ disabled = false, onFadeChange }: TeleporterProps) {
  const { camera } = useThree();
  const palletTown = useGLTF("/models/palletTown.glb");
  const raycaster = useRef(new THREE.Raycaster());
  const interactionMeshes = useRef<THREE.Mesh[]>([]);

  const [markerDistances, setMarkerDistances] = useState<Record<string, number>>({});

  const [isTeleporting, setIsTeleporting] = useState(false);

  const getMarkersFromScene = useCallback((scene: THREE.Group): RawMarker[] => {
    const markers: RawMarker[] = [];

    scene.traverse((child) => {
      const nameLower = child.name.toLowerCase();
      if (!nameLower.includes("tp")) {
        return;
      }

      const worldPosition = new THREE.Vector3();
      child.getWorldPosition(worldPosition);

      markers.push({
        name: child.name,
        position: worldPosition,
      });
    });

    return markers;
  }, []);

  const teleportMarkers = useMemo<TeleportMarker[]>(() => {
    const rawMarkers = getMarkersFromScene(palletTown.scene);

    const startMarkers = rawMarkers.filter((marker) =>
      marker.name.toLowerCase().includes("start")
    );

    return startMarkers.map((startMarker, index) => {
      const nameLower = startMarker.name.toLowerCase();
      
      const tpMatch = nameLower.match(/tp(\d+)start/);
      const tpNumber = tpMatch ? tpMatch[1] : null;

      let targetPosition: THREE.Vector3 | null = null;
      if (tpNumber) {
        const endMarkerName = `tp${tpNumber}end`;
        const endMarker = rawMarkers.find((marker) =>
          marker.name.toLowerCase() === endMarkerName
        );
        if (endMarker) {
          targetPosition = endMarker.position;
        }
      }

      return {
        id: `${startMarker.name}-${index}`,
        name: startMarker.name,
        position: startMarker.position,
        targetPosition,
      };
    });
  }, [getMarkersFromScene, palletTown.scene]);

  const teleportPlayer = useCallback(async (marker: TeleportMarker) => {
    if (!marker.targetPosition || isTeleporting) {
      return;
    }

    setIsTeleporting(true);

    onFadeChange(1);

    await new Promise(resolve => setTimeout(resolve, 500));

    camera.position.set(
      marker.targetPosition.x,
      marker.targetPosition.y + 1.7,
      marker.targetPosition.z
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    onFadeChange(0);

    await new Promise(resolve => setTimeout(resolve, 500));

    setIsTeleporting(false);
  }, [camera, isTeleporting, onFadeChange]);

  const tryInteract = useCallback(() => {
    if (interactionMeshes.current.length === 0 || disabled || isTeleporting) {
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

    const marker = teleportMarkers.find((item) => item.id === markerId);
    if (marker) {
      teleportPlayer(marker);
    }
  }, [camera, teleportMarkers, teleportPlayer, disabled, isTeleporting]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyE" && !disabled && !isTeleporting) {
        tryInteract();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tryInteract, disabled, isTeleporting]);

  useFrame(() => {
    const distances: Record<string, number> = {};
    teleportMarkers.forEach((marker) => {
      const dist = camera.position.distanceTo(marker.position);
      distances[marker.id] = dist;
    });
    setMarkerDistances(distances);
  });

  const maxDistance = 5;
  const minDistance = 1;

  return (
    <>
      {teleportMarkers.map((marker, index) => {
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

            {isInRange && !disabled && !isTeleporting && (
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
                    teleportPlayer(marker);
                  }}
                  onKeyDown={(event) => {
                    if (event.code === "KeyE") {
                      event.preventDefault();
                      teleportPlayer(marker);
                    }
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
