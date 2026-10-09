import type { Building } from "../data/mockData";
import { getTankStatusRows } from "../data/tankStatus";
import TankStatusTile from "./TankStatusTile";

interface TankGridProps {
  building: Building;
  className?: string;
}

export default function TankGrid({ building, className = "" }: TankGridProps) {
  const tanks = getTankStatusRows(building);

  return (
    <div
      className={`grid grid-cols-1 items-stretch gap-4 ${className}`}
    >
      {tanks.map((tank) => (
        <TankStatusTile
          key={tank.kind}
          type={tank.kind}
          data={tank}
          flowEnabled={building.name === "Building D1" && tank.kind === "flushing"}
        />
      ))}
    </div>
  );
}
