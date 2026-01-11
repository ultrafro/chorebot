import { useContext, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { ReportControllerContext, useReportControllerState } from "./ReportController.model";

// Prong dimensions
const PRONG_WIDTH = 0.006;
const PRONG_LENGTH = 0.025;
const PRONG_DEPTH = 0.008;

// Max spread when fully open
const MAX_SPREAD = 0.025;

export function Clamper() {
    const { identifier } = useContext(ReportControllerContext);
    const state = useReportControllerState(identifier);

    const leftProngRef = useRef<Group>(null);
    const rightProngRef = useRef<Group>(null);

    useFrame(() => {
        const triggerValue = state?.gamepad?.['xr-standard-trigger']?.button ?? 0;
        // Fully closed when trigger=1, fully open when trigger=0
        const spread = MAX_SPREAD * (1 - triggerValue);

        if (leftProngRef.current) {
            leftProngRef.current.position.x = -spread;
        }
        if (rightProngRef.current) {
            rightProngRef.current.position.x = spread;
        }
    });

    const isRight = identifier === "rightController" || identifier === "rightHand";
    const prongColor = isRight ? "#ff6b35" : "#00d9ff";
    const tipColor = isRight ? "#ff3d00" : "#00fff7";
    const glowColor = isRight ? "#ff6b35" : "#00d9ff";

    return (
        <group rotation={[Math.PI / 2, 0, 0]}>
            {/* Left prong */}
            <group ref={leftProngRef} position={[-MAX_SPREAD, 0, 0]}>
                {/* Main prong shaft */}
                <mesh position={[0, -PRONG_LENGTH / 2, 0]}>
                    <boxGeometry args={[PRONG_WIDTH, PRONG_LENGTH, PRONG_DEPTH]} />
                    <meshStandardMaterial
                        color={prongColor}
                        metalness={0.8}
                        roughness={0.2}
                        emissive={glowColor}
                        emissiveIntensity={0.15}
                    />
                </mesh>
                {/* Inner edge - gripping surface */}
                <mesh position={[PRONG_WIDTH / 2, -PRONG_LENGTH / 2, 0]}>
                    <boxGeometry args={[PRONG_WIDTH * 0.3, PRONG_LENGTH, PRONG_DEPTH * 1.2]} />
                    <meshStandardMaterial
                        color={tipColor}
                        metalness={0.9}
                        roughness={0.1}
                        emissive={tipColor}
                        emissiveIntensity={0.3}
                    />
                </mesh>
                {/* Pointed tip */}
                <mesh position={[PRONG_WIDTH * 0.3, -PRONG_LENGTH - 0.003, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[PRONG_WIDTH * 0.8, PRONG_WIDTH * 0.8, PRONG_DEPTH * 0.8]} />
                    <meshStandardMaterial
                        color={tipColor}
                        metalness={0.9}
                        roughness={0.1}
                        emissive={tipColor}
                        emissiveIntensity={0.5}
                    />
                </mesh>
            </group>

            {/* Right prong */}
            <group ref={rightProngRef} position={[MAX_SPREAD, 0, 0]}>
                {/* Main prong shaft */}
                <mesh position={[0, -PRONG_LENGTH / 2, 0]}>
                    <boxGeometry args={[PRONG_WIDTH, PRONG_LENGTH, PRONG_DEPTH]} />
                    <meshStandardMaterial
                        color={prongColor}
                        metalness={0.8}
                        roughness={0.2}
                        emissive={glowColor}
                        emissiveIntensity={0.15}
                    />
                </mesh>
                {/* Inner edge - gripping surface */}
                <mesh position={[-PRONG_WIDTH / 2, -PRONG_LENGTH / 2, 0]}>
                    <boxGeometry args={[PRONG_WIDTH * 0.3, PRONG_LENGTH, PRONG_DEPTH * 1.2]} />
                    <meshStandardMaterial
                        color={tipColor}
                        metalness={0.9}
                        roughness={0.1}
                        emissive={tipColor}
                        emissiveIntensity={0.3}
                    />
                </mesh>
                {/* Pointed tip */}
                <mesh position={[-PRONG_WIDTH * 0.3, -PRONG_LENGTH - 0.003, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[PRONG_WIDTH * 0.8, PRONG_WIDTH * 0.8, PRONG_DEPTH * 0.8]} />
                    <meshStandardMaterial
                        color={tipColor}
                        metalness={0.9}
                        roughness={0.1}
                        emissive={tipColor}
                        emissiveIntensity={0.5}
                    />
                </mesh>
            </group>
        </group>
    );
}
