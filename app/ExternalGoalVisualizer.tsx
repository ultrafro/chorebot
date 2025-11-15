import { useRef } from "react";
import { Mesh, Sphere } from "three";
import { ExternalGoal } from "./teletable.model";
import { useLoop } from "./useLoop";

export function ExternalGoalVisualizer({ goal }: { goal: ExternalGoal }) {
  const meshRef = useRef<Mesh>(null);

  useLoop(() => {
    if (meshRef.current) {
      meshRef.current.position.x = goal.position.x;
      meshRef.current.position.y = goal.position.y;
      meshRef.current.position.z = goal.position.z;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.05]} />
      <meshStandardMaterial color="#ef4444" />
    </mesh>
  );
}
