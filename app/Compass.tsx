import { Cylinder, Sphere } from "@react-three/drei";
export default function Compass() {
  return (
    <>
      {/* X-axis - pointing in positive X direction */}
      <Cylinder
        args={[0.002, 0.002, 0.3, 8]}
        position={[0.15, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color="#9ca3af" />
      </Cylinder>

      {/* Y-axis - pointing in positive Y direction */}
      <Cylinder args={[0.002, 0.002, 0.3, 8]} position={[0, 0.15, 0]}>
        <meshStandardMaterial color="#6b7280" />
      </Cylinder>

      {/* Z-axis - pointing in positive Z direction */}
      <Cylinder
        args={[0.002, 0.002, 0.3, 8]}
        position={[0, 0, 0.15]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color="#3b82f6" />
      </Cylinder>

      {/* Origin marker */}
      <Sphere args={[0.006]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#e5e7eb" />
      </Sphere>
    </>
  );
}
