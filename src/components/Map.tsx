import { useGLTF } from "@react-three/drei";
import { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

type MarkerData = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
};

interface RenderOptions {
  randomRotation?: boolean;
  heightVariation?: boolean;
  noCollision?: boolean;
  animationIndex?: number;
}

interface ModelConfig {
  path: string;
  marker: string;
  options?: RenderOptions;
}

const seededRandom = (x: number, z: number, salt: number = 0): number => {
  const seed = Math.sin(x * 12.9898 + z * 78.233 + salt * 37.719) * 43758.5453;
  return seed - Math.floor(seed);
};

function AnimatedModel({
  model,
  animations,
  position,
  rotation,
  scale,
  animationIndex,
  userData,
}: {
  model: THREE.Group;
  animations: THREE.AnimationClip[];
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  animationIndex: number;
  userData?: any;
}) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelClone = useMemo(() => model.clone(), [model]);

  useEffect(() => {
    if (animations && animations.length > animationIndex) {
      const mixer = new THREE.AnimationMixer(modelClone);
      mixerRef.current = mixer;

      const clip = animations[animationIndex];
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    };
  }, [modelClone, animations, animationIndex]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return (
    <primitive
      object={modelClone}
      position={position}
      rotation={rotation}
      scale={scale}
      userData={userData}
    />
  );
}

export function Map() {
  const palletTown = useGLTF("/models/palletTown.glb");

  // Models configs
  const modelConfigs: Record<string, ModelConfig> = useMemo(
    () => ({
      tree: {
        path: "/models/tree.glb",
        marker: "TREEMARKER",
        options: { heightVariation: true, randomRotation: true },
      },
      flowerPatch: {
        path: "/models/flowerPatch.glb",
        marker: "FLOWERPATCHMARKER",
        options: {
          noCollision: true,
          heightVariation: true,
          randomRotation: true,
        },
      },
      fence: { path: "/models/fence.glb", marker: "FENCEMARKER" },
      sign: { path: "/models/sign.glb", marker: "SIGNMARKER" },
      signPost: { path: "/models/signPost.glb", marker: "SIGNPOSTMARKER" },
      lab: { path: "/models/lab.glb", marker: "LABMARKER" },
      house: { path: "/models/house.glb", marker: "HOUSEMARKER" },
      letterbox: { path: "/models/letterbox.glb", marker: "LETTERBOXMARKER" },
      oakBookcase: {
        path: "/models/oakBookcase.glb",
        marker: "OAKBOOKCASEMARKER",
      },
      oakDesk: { path: "/models/oakDesk.glb", marker: "OAKDESKMARKER" },
      oakStarterTable: {
        path: "/models/oakStarterTable.glb",
        marker: "OAKSTARTERTABLEMARKER",
      },
      oakMachine: {
        path: "/models/oakMachine.glb",
        marker: "OAKMACHINEMARKER",
      },
      pokemon1: {
        path: "/models/pokemons/1.glb",
        marker: "POKEMON1MARKER",
        options: { animationIndex: 0 },
      },
      pokemon4: {
        path: "/models/pokemons/4.glb",
        marker: "POKEMON4MARKER",
        options: { animationIndex: 0 },
      },
      pokemon7: {
        path: "/models/pokemons/7.glb",
        marker: "POKEMON7MARKER",
        options: { animationIndex: 0 },
      },
      pokemon143: {
        path: "/models/pokemons/143.glb",
        marker: "POKEMON143MARKER",
        options: { animationIndex: 6 },
      },
      pokemon120: {
        path: "/models/pokemons/120.glb",
        marker: "POKEMON120MARKER",
        options: { animationIndex: 4 },
      },
      pokemon90: {
        path: "/models/pokemons/90.glb",
        marker: "POKEMON90MARKER",
        options: { animationIndex: 5 },
      },
    }),
    [],
  );

  // Load models
  const modelPaths = useMemo(
    () => Object.values(modelConfigs).map((c) => c.path),
    [modelConfigs],
  );
  const loadedModels = useGLTF(modelPaths) as any[];

  // Marker extraction
  const getMarkersFromScene = (markerName: string): MarkerData[] => {
    const markers: MarkerData[] = [];
    palletTown.scene.traverse((child) => {
      if (child.name.toLowerCase().includes(markerName.toLowerCase())) {
        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();

        child.getWorldPosition(worldPosition);
        child.getWorldQuaternion(worldQuaternion);
        child.getWorldScale(worldScale);

        markers.push({
          position: worldPosition,
          rotation: new THREE.Euler().setFromQuaternion(worldQuaternion),
          scale: worldScale,
        });
      }
    });
    return markers;
  };

  return (
    <>
      {/* Map */}
      <primitive object={palletTown.scene} userData={{ hasCollision: true }} />

      {/* Objects */}
      {Object.entries(modelConfigs).map(([key, config], configIndex) => {
        const gltf = loadedModels[configIndex];
        const markers = getMarkersFromScene(config.marker);
        const options = config.options || {};

        return markers.map((marker, markerIndex) => {
          const rotation = options.randomRotation
            ? new THREE.Euler(
                marker.rotation.x,
                seededRandom(marker.position.x, marker.position.z, 0) *
                  Math.PI *
                  2,
                marker.rotation.z,
              )
            : marker.rotation;

          const scale = options.heightVariation
            ? new THREE.Vector3(
                marker.scale.x,
                marker.scale.y *
                  (0.9 +
                    seededRandom(marker.position.x, marker.position.z, 1) *
                      0.2),
                marker.scale.z,
              )
            : marker.scale;

          const userData = { hasCollision: !options.noCollision };

          if (options.animationIndex !== undefined && gltf.animations) {
            return (
              <AnimatedModel
                key={`${key}-${markerIndex}`}
                model={gltf.scene}
                animations={gltf.animations}
                position={marker.position}
                rotation={rotation}
                scale={scale}
                animationIndex={options.animationIndex}
                userData={userData}
              />
            );
          }

          return (
            <primitive
              key={`${key}-${markerIndex}`}
              object={gltf.scene.clone()}
              position={marker.position}
              rotation={rotation}
              scale={scale}
              userData={userData}
            />
          );
        });
      })}
    </>
  );
}
