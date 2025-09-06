import { Box, Cylinder, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group, Quaternion, Vector3 } from "three";
import { HandDetection } from "./teletable.model";

// Hand Visualizer Component
export function HandVisualizer({
  handData,
  position,
  color,
}: {
  handData: HandDetection;
  position: [number, number, number];
  color: string;
}) {
  const handRef = useRef<Group>(null);
  const gripperRef = useRef<Group>(null);

  // Calculate opacity based on detection status
  const baseOpacity = handData.detected ? 0.7 : 0.2;
  const indicatorOpacity = handData.detected ? 0.5 : 0.15;

  useFrame(() => {
    if (handRef.current) {
      if (handData.detected) {
        // Update position based on hand data
        const targetPos = new Vector3(
          handData.position.x,
          handData.position.y,
          handData.position.z
        );

        handRef.current.position.lerp(targetPos, 0.1);

        // Update rotation based on orientation
        const targetQuat = new Quaternion(
          handData.orientation.x,
          handData.orientation.y,
          handData.orientation.z,
          handData.orientation.w
        );

        handRef.current.quaternion.slerp(targetQuat, 0.1);
      }
    }

    // Update gripper animation based on hand openness
    if (gripperRef.current) {
      const gripperOpenness = handData.detected ? handData.open : 0.5;
      const maxGripperDistance = 0.15;
      const currentDistance = maxGripperDistance * gripperOpenness;

      gripperRef.current.children.forEach((child, index) => {
        if (index === 0) {
          // Left gripper finger
          child.position.x = -currentDistance / 2;
        } else if (index === 1) {
          // Right gripper finger
          child.position.x = currentDistance / 2;
        }
      });
    }
  });

  return (
    <group ref={handRef} position={position}>
      {/* Main hand sphere */}
      <Sphere args={[0.1]}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={baseOpacity}
          emissive={color}
          emissiveIntensity={handData.detected ? 0.2 : 0.05}
        />
      </Sphere>

      {/* Hand orientation indicator */}
      <Cylinder args={[0.02, 0.02, 0.3, 8]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={indicatorOpacity}
        />
      </Cylinder>

      {/* Gripper visualization */}
      <group ref={gripperRef} position={[0, 0, 0.2]}>
        {/* Left gripper finger */}
        <Box args={[0.03, 0.08, 0.05]} position={[-0.075, 0, 0]}>
          <meshStandardMaterial
            color={color}
            transparent
            opacity={baseOpacity}
            emissive={color}
            emissiveIntensity={handData.detected ? 0.1 : 0.02}
          />
        </Box>

        {/* Right gripper finger */}
        <Box args={[0.03, 0.08, 0.05]} position={[0.075, 0, 0]}>
          <meshStandardMaterial
            color={color}
            transparent
            opacity={baseOpacity}
            emissive={color}
            emissiveIntensity={handData.detected ? 0.1 : 0.02}
          />
        </Box>

        {/* Gripper base */}
        <Box args={[0.12, 0.04, 0.03]} position={[0, -0.06, 0]}>
          <meshStandardMaterial
            color={color}
            transparent
            opacity={baseOpacity * 0.8}
            emissive={color}
            emissiveIntensity={handData.detected ? 0.1 : 0.02}
          />
        </Box>
      </group>
    </group>
  );
}
