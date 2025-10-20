import { Box, Cylinder, PivotControls, Sphere, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Matrix4, Mesh, Quaternion, Vector3 } from "three";
import { HandDetection } from "./teletable.model";
import ControlSliders from "./ControlSliders";

export default function ControlPointVisualizer({
  handData,
  handId,
  offset,
  color,
}: {
  handData: HandDetection;
  handId: string;
  offset: Vector3;
  color: string;
}) {
  const handRef = useRef<Group>(null);
  const gripperRef = useRef<Group>(null);

  const baseRef = useRef<Mesh>(null);
  const indicatorOpacity = handData?.detected ? 0.85 : 0.5;

  const showDebug = false;

  // State for sliders
  const [wristValue, setWristValue] = useState(0);
  const [gripperValue, setGripperValue] = useState(0);
  const [pitchValue, setPitchValue] = useState(0);

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

    if (baseRef.current) {
      baseRef.current.position.x = handData.base.x;
      baseRef.current.position.y = handData.base.y;
      baseRef.current.position.z = handData.base.z;
    }
  });

  const [handMatrix, setHandMatrix] = useState<Matrix4>(
    new Matrix4().compose(
      new Vector3(0, 0, -0.3),
      new Quaternion(),
      new Vector3(1, 1, 1)
    )
  );

  //   useFrame(() => {
  //     //convert hand data to a matrix:
  //     const matrix = new Matrix4().compose(
  //       new Vector3(
  //         handData.position.x,
  //         handData.position.y,
  //         handData.position.z
  //       ),
  //       new Quaternion(
  //         handData.orientation.x,
  //         handData.orientation.y,
  //         handData.orientation.z,
  //         handData.orientation.w
  //       ),
  //       new Vector3(1, 1, 1)
  //     );
  //     if (handRef.current) {
  //       handRef.current.matrix.copy(matrix);
  //     }
  //   });

  useEffect(() => {
    handData.open = gripperValue;
    handData.orientation.y = pitchValue;
    handData.orientation.z = wristValue;
    handData.orientation.w = 1;
  }, [wristValue, gripperValue, pitchValue]);

  return (
    <group ref={handRef}>
      {/* Main hand rectangle - made thicker for visibility */}
      <Box args={[0.05, 0.05, 0.05]}>
        <meshStandardMaterial
          color={color}
          metalness={0.1}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={handData?.detected ? 0.8 : 0.5}
          transparent={false}
          depthWrite={true}
          depthTest={true}
        />
      </Box>

      <PivotControls
        key={"pivot-control-" + handId}
        anchor={[0, 0, 0]}
        matrix={handMatrix}
        //   matrix={leftHandMatrix}
        enabled={true}
        scale={0.2}
        lineWidth={3}
        fixed={false}
        activeAxes={[true, true, true]}
        disableRotations={true}
        disableScaling={true}
        axisColors={["#ef4444", "#22c55e", "#3b82f6"]}
        hoveredColor="#f59e0b"
        annotations={true}
        autoTransform={false}
        onDrag={(localMatrix, deltaLocal, worldMatrix, deltaWorld) => {
          const position = new Vector3();
          const rotation = new Quaternion();
          const scale = new Vector3();
          localMatrix.decompose(position, rotation, scale);

          handData.position.x = position.x + 0 * offset.x;
          handData.position.y = position.y + 0 * offset.y;
          handData.position.z = position.z + 0 * offset.z;
          // handData.orientation.x = rotation.x;
          // handData.orientation.y = rotation.y;
          // handData.orientation.z = rotation.z;
          // handData.orientation.w = rotation.w;

          setHandMatrix(localMatrix.clone());
        }}
      >
        <Sphere args={[0.01]}>
          <meshStandardMaterial color="#ef4444" transparent opacity={0.6} />
        </Sphere>
      </PivotControls>

      {/* Three sliders for wrist, pitch, and gripper */}
      <ControlSliders
        wristValue={wristValue}
        gripperValue={gripperValue}
        pitchValue={pitchValue}
        onWristChange={setWristValue}
        onGripperChange={setGripperValue}
        onPitchChange={setPitchValue}
        position={[0, -0.05, 0]}
      />
    </group>
  );
}
