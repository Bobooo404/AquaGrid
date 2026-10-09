import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";
import BuildingDashboard from "./components/BuildingDashboard";
import TankGrid from "./components/TankGrid";
import { getMonitoredBuildings, initialBuildings } from "./data/mockData";

const section = (title: string, node: ReactNode) =>
  `<div style="margin-bottom:32px">
     <div style="font:600 12px monospace;letter-spacing:.15em;text-transform:uppercase;color:#7fa5c8;margin-bottom:12px">${title}</div>
     ${renderToString(<>{node}</>)}
   </div>`;

export function renderPreview(): string {
  const monitored = getMonitoredBuildings(initialBuildings);

  return `<div data-theme="dark" style="padding:24px;background:var(--bg-primary);min-height:100vh">
    ${section("A · Building dashboard with selector (default Building D1)", <BuildingDashboard buildings={monitored} />)}
    ${section("B · Building F2 tanks (not installed)", <TankGrid building={monitored[3]} />)}
    ${section("C · Building D2 tanks (under installation)", <TankGrid building={monitored[1]} />)}
  </div>`;
}
