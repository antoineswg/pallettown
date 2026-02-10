import { Html, useGLTF } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type PokemonMarker = {
  id: string;
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  pokemonId: number;
  pokemonName: string;
};

type RawMarker = {
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
};

const pokemonNames: Record<number, string> = {
  1: "Bulbasaur",
  4: "Charmander",
  7: "Squirtle",
};

type PokemonPickerProps = {
  isPopupOpen: boolean;
  onPopupChange: (isOpen: boolean, pokemonName?: string) => void;
};

export function PokemonPicker({ isPopupOpen, onPopupChange }: PokemonPickerProps) {
  const { camera } = useThree();
  const palletTown = useGLTF("/models/palletTown.glb");
  const raycaster = useRef(new THREE.Raycaster());
  const interactionMeshes = useRef<THREE.Mesh[]>([]);

  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [markerDistances, setMarkerDistances] = useState<Record<string, number>>({});

  const getMarkersFromScene = useCallback((scene: THREE.Group): RawMarker[] => {
    const markers: RawMarker[] = [];

    scene.traverse((child) => {
      const nameLower = child.name.toLowerCase();
      if (!nameLower.includes("pokemon") || !nameLower.includes("marker")) {
        return;
      }
      
      if (!nameLower.match(/pokemon[147]marker/)) {
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

  const markers = useMemo<PokemonMarker[]>(() => {
    const rawMarkers = getMarkersFromScene(palletTown.scene);

    return rawMarkers
      .map((marker, index) => {
        const nameLower = marker.name.toLowerCase();
        const match1 = nameLower.match(/pokemon1/);
        const match4 = nameLower.match(/pokemon4/);
        const match7 = nameLower.match(/pokemon7/);

        let pokemonId: number | null = null;
        if (match1) pokemonId = 1;
        else if (match4) pokemonId = 4;
        else if (match7) pokemonId = 7;

        if (!pokemonId) return null;

        const pokemonName = pokemonNames[pokemonId] || "Unknown";
        const id = marker.name ? `${marker.name}-${index}` : `pokemonMarker-${index}`;

        return {
          id,
          name: marker.name,
          position: marker.position,
          rotation: marker.rotation,
          scale: marker.scale,
          pokemonId,
          pokemonName,
        };
      })
      .filter((marker): marker is PokemonMarker => marker !== null);
  }, [getMarkersFromScene, palletTown.scene]);

  const openPopup = useCallback((marker: PokemonMarker) => {
    setActiveMarkerId(marker.id);
    onPopupChange(true, marker.pokemonName);
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
