import { useXRInputSourceState } from "@react-three/xr";

import {
    XRSpace,
} from "@react-three/xr";
import { useEffect, useMemo, useRef, useState } from "react";
import { Mesh, Object3D, Quaternion, Vector3 } from "three";
import { CanvasTexture, Euler } from "three";
import { useFrame } from "@react-three/fiber";
import { ControllerIdentifier, getAAndB, ReportControllerContext } from "./ReportController.model";
import * as THREE from "three";

const LABEL_WIDTH = 128;
const LABEL_HEIGHT = 64;

function ControllerAngleLabel({ localXAngleDeg }: { localXAngleDeg: number }) {
    const canvas = useMemo(() => {
        const c = document.createElement("canvas");
        c.width = LABEL_WIDTH;
        c.height = LABEL_HEIGHT;
        return c;
    }, []);
    const texture = useMemo(() => {
        const t = new CanvasTexture(canvas);
        t.needsUpdate = true;
        return t;
    }, [canvas]);
    useFrame(() => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const w = LABEL_WIDTH;
        const h = LABEL_HEIGHT;
        ctx.clearRect(0, 0, w, h);
        // background
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.fill();
        ctx.stroke();
        // text
        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`X: ${localXAngleDeg.toFixed(1)}°`, w / 2, h / 2);
        texture.needsUpdate = true;
    });

    return (
        <group position={[0, 0.05 / 2 + 0.03, 0]}>
            <mesh>
                <planeGeometry args={[0.12, 0.06]} />
                <meshBasicMaterial
                    map={texture}
                    transparent
                    opacity={1}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

export function ReportController({
    identifier,
    children
}: {
    identifier: ControllerIdentifier;
    children?: React.ReactNode;
}) {

    const { a, b } = getAAndB(identifier);


    useEffect(() => {
        (window as any).controllerPositions = controllerPositions;


    }, []);




    const inputState = useXRInputSourceState(a as any, b as any);

    const meshRef = useRef<Mesh>(null!);
    const [localXAngleDeg, setLocalXAngleDeg] = useState(0);
    const lastAngleUpdateTime = useRef(0);

    useEffect(() => {
        const valid = !!inputState?.inputSource?.targetRaySpace;
        const thing = controllerPositions[identifier];



        thing.online = valid;
        thing.id = inputState?.id || -1;

        return () => {
            thing.online = false;
        };
    }, [inputState?.inputSource?.targetRaySpace, inputState?.id, identifier]);

    useFrame(() => {
        if (!meshRef.current) {
            return;
        }

        const thing = controllerPositions[identifier];

        const mesh = meshRef.current as unknown as Object3D;

        if (thing.object !== mesh) {
            thing.object = mesh;
        }

        // Use getWorldPosition/getWorldQuaternion for proper XRSpace coordinate extraction
        mesh.getWorldPosition(thing.position);
        mesh.getWorldQuaternion(thing.quaternion);

        const triggerValue = inputState?.gamepad?.['xr-standard-trigger']?.button ?? 0;
        thing.triggerValue = triggerValue;

        // Update local X angle display (throttled, same as ControllerPositionDisplay in ClientViewXR)
        if (Date.now() - lastAngleUpdateTime.current >= 100) {
            lastAngleUpdateTime.current = Date.now();
            const euler = new Euler().setFromQuaternion(thing.quaternion);
            setLocalXAngleDeg((euler.x * 180) / Math.PI);
        }
    });

    if (!inputState?.inputSource?.targetRaySpace) {
        return null;
    }

    return (
        <>
            <XRSpace space={inputState?.inputSource?.targetRaySpace}>
                <ReportControllerContext.Provider value={{ identifier }}>
                    {children}
                </ReportControllerContext.Provider>
                <mesh ref={meshRef}>
                    <boxGeometry args={[0.05, 0.05, 0.05]} />
                    <meshBasicMaterial color={"blue"} />
                </mesh>
                <ControllerAngleLabel localXAngleDeg={localXAngleDeg} />
            </XRSpace>
        </>
    );
}



export const controllerPositions: Record<ControllerIdentifier, {
    position: Vector3;
    triggerValue: number;
    quaternion: Quaternion;
    id: string | number;
    online: boolean;
    object: Object3D;
}> = {
    rightHand: {
        position: new Vector3(),
        triggerValue: 0,
        quaternion: new Quaternion(),
        id: 0,
        online: false,
        object: new Object3D(),
    },
    leftHand: {
        position: new Vector3(),
        triggerValue: 0,
        quaternion: new Quaternion(),
        id: 1,
        online: false,
        object: new Object3D(),
    },
    rightController: {
        position: new Vector3(),
        triggerValue: 0,
        quaternion: new Quaternion(),
        id: 2,
        online: false,
        object: new Object3D(),
    },
    leftController: {
        position: new Vector3(),
        triggerValue: 0,
        quaternion: new Quaternion(),
        id: 3,
        online: false,
        object: new Object3D(),
    },
};
