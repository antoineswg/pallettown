import { useGLTF } from "@react-three/drei";
import { useMemo, useEffect, useRef, use } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

type MarkerData = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
};

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
  userData 
}: { 
  model: THREE.Group; 
  animations: THREE.AnimationClip[];
  position: THREE.Vector3; 
  rotation: THREE.Euler; 
  scale: THREE.Vector3; 
  animationIndex?: number;
  userData?: any;
}) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const modelClone = useMemo(() => model.clone(), [model]);

  useEffect(() => {
    
    if (groupRef.current && animationIndex !== undefined) {
      if (animations && animations.length > animationIndex) {
        const mixer = new THREE.AnimationMixer(modelClone);
        mixerRef.current = mixer;

        const clip = animations[animationIndex];
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      }
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
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive
        object={modelClone}
        userData={userData}
      />
    </group>
  );
}

export function Map() {
  // Load models
  const palletTown = useGLTF("/models/palletTown.glb");
  const tree = useGLTF("/models/tree.glb");
  const flowerPatch = useGLTF("/models/flowerPatch.glb");
  const fence = useGLTF("/models/fence.glb");
  const sign = useGLTF("/models/sign.glb");
  const signPost = useGLTF("/models/signPost.glb");
  const lab = useGLTF("/models/lab.glb");
  const house = useGLTF("/models/house.glb");
  const letterbox = useGLTF("/models/letterbox.glb");
  const oakBookcase = useGLTF("/models/oakBookcase.glb");
  const oakDesk = useGLTF("/models/oakDesk.glb");
  const oakStarterTable = useGLTF("/models/oakStarterTable.glb");
  const oakMachine = useGLTF("/models/oakMachine.glb");
  const pokemon1 = useGLTF("/models/pokemons/1.glb");
  const pokemon4 = useGLTF("/models/pokemons/4.glb");
  const pokemon7 = useGLTF("/models/pokemons/7.glb");
  const pokemon143 = useGLTF("/models/pokemons/143.glb");

  useEffect(() => {
  }, [pokemon1]);
  useEffect(() => {
  }, [pokemon4]);
  useEffect(() => {
  }, [pokemon7]);

  // Reusable method to locate markers
  const getMarkersFromScene = (
    scene: THREE.Group,
    markerName: string,
  ): MarkerData[] => {
    const markers: MarkerData[] = [];

    scene.traverse((child) => {
      if (child.name.toLowerCase().includes(markerName.toLowerCase())) {
        // Get position, rotation, scale
        const worldPosition = new THREE.Vector3();
        const worldRotation = new THREE.Euler();
        const worldScale = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();

        child.getWorldPosition(worldPosition);
        child.getWorldQuaternion(worldQuaternion);
        child.getWorldScale(worldScale);
        worldRotation.setFromQuaternion(worldQuaternion);

        markers.push({
          position: worldPosition,
          rotation: worldRotation,
          scale: worldScale,
        });
      }
    });

    return markers;
  };

  // Reusable method to render objects at marker positions
  const renderInstancesAtMarkers = (
    model: THREE.Group,
    markers: MarkerData[],
    keyPrefix: string,
    options?: {
      randomRotation?: boolean;
      heightVariation?: boolean;
      noCollision?: boolean;
      animationIndex?: number;
      animations?: THREE.AnimationClip[];
    },
  ) => {
    return markers.map((marker, index) => {
      const rotation = options?.randomRotation
        ? new THREE.Euler(
          marker.rotation.x,
          seededRandom(marker.position.x, marker.position.z, 0) * Math.PI * 2,
          marker.rotation.z,
        )
        : marker.rotation;

      const scale = options?.heightVariation
        ? new THREE.Vector3(
          marker.scale.x,
          marker.scale.y * (0.9 + seededRandom(marker.position.x, marker.position.z, 1) * 0.2),
          marker.scale.z,
        )
        : marker.scale;

      const userData = { hasCollision: !options?.noCollision };

      if (options?.animationIndex !== undefined && options?.animations) {
        return (
          <AnimatedModel
            key={`${keyPrefix}-${index}`}
            model={model}
            animations={options.animations}
            position={marker.position}
            rotation={rotation}
            scale={scale}
            animationIndex={options.animationIndex}
            userData={userData}
          />
        );
      }

      const modelClone = model.clone();
      return (
        <primitive
          key={`${keyPrefix}-${index}`}
          object={modelClone}
          position={marker.position}
          rotation={rotation}
          scale={scale}
          userData={userData}
        />
      );
    });
  };

  // Get marker positions
  const treeMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "TREEMARKER"),
    [palletTown.scene],
  );
  const flowerMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "FLOWERPATCHMARKER"),
    [palletTown.scene],
  );
  const fenceMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "FENCEMARKER"),
    [palletTown.scene],
  );
  const signMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "SIGNMARKER"),
    [palletTown.scene],
  );
  const signPostMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "SIGNPOSTMARKER"),
    [palletTown.scene],
  );
  const labMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "LABMARKER"),
    [palletTown.scene],
  );
  const houseMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "HOUSEMARKER"),
    [palletTown.scene],
  );
  const letterboxMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "LETTERBOXMARKER"),
    [palletTown.scene],
  );
  const oakBookcaseMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "OAKBOOKCASEMARKER"),
    [palletTown.scene],
  );
  const oakDeskMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "OAKDESKMARKER"),
    [palletTown.scene],
  );
  const oakStarterTableMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "OAKSTARTERTABLEMARKER"),
    [palletTown.scene],
  );
  const oakMachineMarkers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "OAKMACHINEMARKER"),
    [palletTown.scene],
  );
  const pokemon1Markers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "POKEMON1MARKER"),
    [palletTown.scene],
  );
  const pokemon4Markers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "POKEMON4MARKER"),
    [palletTown.scene],
  );
  const pokemon7Markers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "POKEMON7MARKER"),
    [palletTown.scene],
  );
  const pokemon143Markers = useMemo(
    () => getMarkersFromScene(palletTown.scene, "POKEMON143MARKER"),
    [palletTown.scene],
  );

  return (
    <>
      {/* Place city model & borders*/}
      <primitive object={palletTown.scene} userData={{ hasCollision: true }} />

      {/* Place all objects at their markers */}
      {renderInstancesAtMarkers(tree.scene, treeMarkers, "tree", { heightVariation: true, randomRotation: true })}
      {renderInstancesAtMarkers(flowerPatch.scene, flowerMarkers,"flowerPatch", { noCollision: true, heightVariation: true, randomRotation: true })}
      {renderInstancesAtMarkers(fence.scene, fenceMarkers, "fence")}
      {renderInstancesAtMarkers(sign.scene, signMarkers, "sign")}
      {renderInstancesAtMarkers(signPost.scene, signPostMarkers, "signPost")}
      {renderInstancesAtMarkers(lab.scene, labMarkers, "lab")}
      {renderInstancesAtMarkers(house.scene, houseMarkers, "house")}
      {renderInstancesAtMarkers(letterbox.scene, letterboxMarkers, "letterbox")}
      {renderInstancesAtMarkers(oakBookcase.scene, oakBookcaseMarkers, "oakBookcase")}
      {renderInstancesAtMarkers(oakDesk.scene, oakDeskMarkers, "oakDesk")}
      {renderInstancesAtMarkers(oakStarterTable.scene, oakStarterTableMarkers, "oakStarterTable")}
      {renderInstancesAtMarkers(oakMachine.scene, oakMachineMarkers, "oakMachine")}
      {renderInstancesAtMarkers(pokemon1.scene, pokemon1Markers, "pokemon1", { animationIndex: 0, animations: pokemon1.animations })}
      {renderInstancesAtMarkers(pokemon4.scene, pokemon4Markers, "pokemon4", { animationIndex: 0, animations: pokemon4.animations })}
      {renderInstancesAtMarkers(pokemon7.scene, pokemon7Markers, "pokemon7", { animationIndex: 0, animations: pokemon7.animations })}
      {renderInstancesAtMarkers(pokemon143.scene, pokemon143Markers, "pokemon143", { animationIndex: 6, animations: pokemon143.animations })}
    </>
  );
}
