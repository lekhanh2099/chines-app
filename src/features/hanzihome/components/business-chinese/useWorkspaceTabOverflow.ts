"use client";

import { useEffect, useState } from "react";

/** How many lesson/article tabs fit beside an inline toolbar: 1 on phones, 3 on tablets, all on wide desktops. */
export function useWorkspaceTabCapacity() {
 const [tabCapacity, setTabCapacity] = useState(1);
 useEffect(() => {
  const desktop = window.matchMedia("(min-width: 90rem)");
  const tablet = window.matchMedia("(min-width: 40rem)");
  const update = () =>
   setTabCapacity(desktop.matches ? Number.MAX_SAFE_INTEGER : tablet.matches ? 3 : 1);
  update();
  desktop.addEventListener("change", update);
  tablet.addEventListener("change", update);
  return () => {
   desktop.removeEventListener("change", update);
   tablet.removeEventListener("change", update);
  };
 }, []);
 return tabCapacity;
}

/** Splits tabs into the visible row (always including the active tab) and the overflow menu. */
export function splitWorkspaceTabs<T extends { key: string }>(
 tabs: readonly T[],
 activeKey: string,
 capacity: number,
) {
 const visibleTabs = tabs.slice(0, capacity);
 const activeTab = tabs.find((tab) => tab.key === activeKey);
 if (activeTab && !visibleTabs.some((tab) => tab.key === activeKey)) {
  visibleTabs.splice(visibleTabs.length - 1, 1, activeTab);
 }
 const overflowTabs = tabs.filter((tab) => !visibleTabs.some((visible) => visible.key === tab.key));
 return { visibleTabs, overflowTabs };
}
