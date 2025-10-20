import { useFrame } from "@react-three/fiber";
import { IKRobotComponent } from "./IKRobotComponent";
import { Quaternion, Vector3 } from "three";
import { useRef } from "react";
import {
  BothHands,
  HandDetection,
  LeftArmBasePosition,
} from "./teletable.model";
import ControlPointVisualizer from "./ControlPointVisualizer";

export default function IKRobotFrame({
  handData,
  handId,
  basePosition,
  onJointValuesUpdate,
}: {
  handData: HandDetection;
  handId: string;
  basePosition: Vector3;
  onJointValuesUpdate?: (robotId: string, jointValues: number[]) => void;
}) {
  const handPosition = useRef(new Vector3(0, 0, 0));
  const handQuaternion = useRef(new Quaternion(0, 0, 0, 1));
  const handOtherValues = useRef({
    roll: 0,
    pitch: 0,
    gripper: 0,
  });

  useFrame(() => {
    handPosition.current.set(
      handData.position.x,
      handData.position.y,
      handData.position.z
    );
    handQuaternion.current.set(
      handData.orientation.x,
      handData.orientation.y,
      handData.orientation.z,
      handData.orientation.w
    );
    handOtherValues.current.roll = handData.orientation.z;
    handOtherValues.current.pitch = handData.orientation.y;
    handOtherValues.current.gripper = handData.open;
  });

  return (
    <group position={basePosition}>
      <IKRobotComponent
        basePostion={basePosition}
        goalPosition={handPosition.current}
        goalOtherValues={handOtherValues.current}
        onJointValuesUpdate={(jointValues) => {
          //console.log("Joint values for", handId, ":", jointValues);
          onJointValuesUpdate?.(handId, jointValues);
        }}
      />
      {/* <ControlPointVisualizer handData={handData} color="#ef4444" /> */}

      <ControlPointVisualizer
        handData={handData}
        handId={handId}
        offset={basePosition}
        color="#ef4444"
      />
    </group>
  );
}
