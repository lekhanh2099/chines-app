"use client";

import * as React from "react";
import { Toaster } from "sonner";

const SONNER_HEIGHT_TRANSITIONS = [
 ["transition:transform .4s,opacity .4s,", " .4s,box-shadow .2s"],
 ["transition: transform 400ms, opacity 400ms,", " 400ms, box-shadow 200ms"],
];

function removeSonnerHeightTransition() {
 for (const style of Array.from(document.querySelectorAll("style"))) {
  const css = style.textContent;
  if (!css?.includes("[data-sonner-toast]") || !css.includes("height")) continue;

  let nextCss = css;
  for (const [prefix, suffix] of SONNER_HEIGHT_TRANSITIONS) {
   const transition = `${prefix}height${suffix}`;
   nextCss = nextCss.replace(transition, transition.replace(/,?\s*height (?:\.4s|400ms)/, ""));
  }

  if (nextCss !== css) {
   style.textContent = nextCss;
  }
 }
}

export function AppToaster() {
 React.useInsertionEffect(() => {
  removeSonnerHeightTransition();
 }, []);

 return <Toaster position="top-right" richColors />;
}
