import { useFrame } from "@react-three/fiber";
import { IKRobotComponent } from "./IKRobotComponent";
import { Quaternion, Vector3 } from "three";
import { useRef } from "react";
import {
  BothHands,
  DataFrame,
  HandDetection,
  LeftArmBasePosition,
} from "./teletable.model";
import ControlPointVisualizer from "./ControlPointVisualizer";

export default function IKRobotFrame({
  currentState,
  handId,
  basePosition,
  remotelyControlled,
  onJointValuesUpdate,
}: {
  currentState: DataFrame;
  handId: string;
  basePosition: Vector3;
  remotelyControlled: boolean;
  onJointValuesUpdate?: (robotId: string, jointValues: number[]) => void;
}) {
  const handPosition = useRef(new Vector3(0, 0, -0.3));
  const handQuaternion = useRef(new Quaternion(0, 0, 0, 1));
  const handOtherValues = useRef({
    roll: 0,
    pitch: 0,
    gripper: 0,
  });

  return (
    <group position={basePosition}>
      <IKRobotComponent
        basePostion={basePosition}
        goalPosition={handPosition.current}
        goalOtherValues={handOtherValues.current}
        onJointValuesUpdate={(jointValues) => {
          if (remotelyControlled) {
            return;
          }
          //console.log("Joint values for", handId, ":", jointValues);
          onJointValuesUpdate?.(handId, jointValues);
        }}
        useDirectValues={remotelyControlled}
        directValues={currentState.joints}
      />
      {/* <ControlPointVisualizer handData={handData} color="#ef4444" /> */}

      {!remotelyControlled && (
        <ControlPointVisualizer
          position={handPosition.current}
          basePosition={basePosition}
          otherValues={handOtherValues.current}
          handId={handId}
          offset={basePosition}
          color="#ef4444"
        />
      )}
    </group>
  );
}
