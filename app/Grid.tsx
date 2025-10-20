import { useMemo } from "react";
import { GridHelper } from "three";

// Grid Component for the ground
export default function Grid() {
  const gridSize = 10;
  const divisions = 20;
  const gridHelper = useMemo(() => {
    const grid = new GridHelper(gridSize, divisions, "#6b7280", "#9ca3af");
    grid.position.y = 0;
    return grid;
  }, []);

  return <primitive object={gridHelper} />;
}
