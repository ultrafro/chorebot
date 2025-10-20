import { Quaternion, Vector3 } from "three";
import { IKRobotComponent } from "./IKRobotComponent";
import { BothHands } from "./teletable.model";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export function IKRobotGroup({
  handData,
  onJointValuesUpdate,
}: {
  handData: BothHands;
  onJointValuesUpdate?: (robotId: string, jointValues: number[]) => void;
}) {
  const leftPosition = useRef(new Vector3(0, 0, 0));
  const leftQuaternion = useRef(new Quaternion(0, 0, 0, 1));
  const rightPosition = useRef(new Vector3(0, 0, 0));
  const rightQuaternion = useRef(new Quaternion(0, 0, 0, 1));

  useFrame(() => {
    leftPosition.current.set(
      handData.left.position.x,
      handData.left.position.y,
      handData.left.position.z
    );
    leftQuaternion.current.set(
      handData.left.orientation.x,
      handData.left.orientation.y,
      handData.left.orientation.z,
      handData.left.orientation.w
    );
    rightPosition.current.set(
      handData.right.position.x,
      handData.right.position.y,
      handData.right.position.z
    );
    rightQuaternion.current.set(
      handData.right.orientation.x,
      handData.right.orientation.y,
      handData.right.orientation.z,
      handData.right.orientation.w
    );
  });

  return (
    <group>
      <IKRobotComponent
        basePostion={new Vector3(-1, 0, 0)}
        goalPosition={leftPosition.current}
        goalQuaternion={leftQuaternion.current}
        onJointValuesUpdate={(jointValues) =>
          onJointValuesUpdate?.("left", jointValues)
        }
      />
      <IKRobotComponent
        basePostion={new Vector3(1, 0, 0)}
        goalPosition={rightPosition.current}
        goalQuaternion={rightQuaternion.current}
        onJointValuesUpdate={(jointValues) =>
          onJointValuesUpdate?.("right", jointValues)
        }
      />
    </group>
  );
}
