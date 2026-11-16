"use client";

import { useEffect, useState } from "react";

/** Matches the `2xl` breakpoint where the scenario brief moves beside the dialogue. */
export function useWideSpeakingDrillsLayout() {
 const [wide, setWide] = useState(false);
 useEffect(() => {
  const query = window.matchMedia("(min-width: 96rem)");
  const update = () => setWide(query.matches);
  update();
  query.addEventListener("change", update);
  return () => query.removeEventListener("change", update);
 }, []);
 return wide;
}
