"use client";

import { useEffect, useState } from "react";

const COARSE_POINTER_QUERY = "(hover: none), (pointer: coarse)";

export function useCoarsePointer() {
 const [isCoarsePointer, setIsCoarsePointer] = useState(false);

 useEffect(() => {
  const media = window.matchMedia(COARSE_POINTER_QUERY);
  const update = () => setIsCoarsePointer(media.matches);

  update();
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
 }, []);

 return isCoarsePointer;
}
