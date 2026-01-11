import { useXRInputSourceState } from "@react-three/xr";
import { createContext } from "react";

export function getAAndB(identifier: ControllerIdentifier) {
    let a = "";
    let b = "";
    if (identifier === "rightController" || identifier === "leftController") {
        a = "controller";
    } else {
        a = "hand";
    }
    if (identifier === "rightController" || identifier === "rightHand") {
        b = "right";
    } else {
        b = "left";
    }
    return { a, b };
}

export const ReportControllerContext = createContext<{
    identifier: ControllerIdentifier;
}>({
    identifier: "rightController",
});

export type ControllerIdentifier = "rightController" | "leftController" | "rightHand" | "leftHand";


export function useReportControllerState(identifier: ControllerIdentifier) {
    const { a, b } = getAAndB(identifier);
    return useXRInputSourceState(a as any, b as any);
}