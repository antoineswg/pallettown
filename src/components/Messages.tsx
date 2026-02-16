import { Html, useGLTF } from "@react-three/drei";
import { useMemo, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type MessageMarkerData = {
  id: string;
  name: string;
  position: THREE.Vector3;
  message: string;
};

const MessagesContent: Record<number, string> = {
  1: "I'm Red's mom",
  2: "I'm Blue's mom",
};

type MessagesProps = {
  isPopupOpen: boolean;
};

export function Messages({ isPopupOpen }: MessagesProps) {
  const { camera } = useThree();
  const palletTown = useGLTF("/models/palletTown.glb");
  const [markerDistances, setMarkerDistances] = useState<
    Record<string, number>
  >({});

  const markers = useMemo<MessageMarkerData[]>(() => {
    const messageMarkers: MessageMarkerData[] = [];

    palletTown.scene.traverse((child) => {
      const nameLower = child.name.toLowerCase();

      const messageMatch = nameLower.match(/message(\d+)marker/);

      if (messageMatch) {
        const messageNumber = Number(messageMatch[1]);
        const worldPosition = new THREE.Vector3();
        child.getWorldPosition(worldPosition);

        const message = MessagesContent[messageNumber] || "...";

        messageMarkers.push({
          id: child.name,
          name: child.name,
          position: worldPosition,
          message,
        });
      }
    });

    return messageMarkers;
  }, [palletTown.scene]);

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
      {markers.map((marker) => {
        const distance = markerDistances[marker.id] ?? 999;
        const isInRange = distance < maxDistance;
        const distanceRatio = Math.max(
          0,
          Math.min(1, (maxDistance - distance) / (maxDistance - minDistance)),
        );
        const scale = 0.3 + distanceRatio * 0.7;

        const opacityThreshold = 0.6;
        const opacityFalloff =
          distanceRatio > opacityThreshold
            ? 1
            : Math.pow(distanceRatio / opacityThreshold, 3);

        return (
          <group key={marker.id} position={marker.position}>
            {isInRange && !isPopupOpen && (
              <Html center distanceFactor={8} zIndexRange={[0, 100]}>
                <div
                  className="speech"
                  style={{
                    transform: `scale(${scale})`,
                    opacity: opacityFalloff,
                  }}
                >
                  {marker.message}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}
