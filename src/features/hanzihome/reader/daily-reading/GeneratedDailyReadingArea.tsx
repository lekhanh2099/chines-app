"use client";

import { useState } from "react";

import { GeneratedDailyReadingLibrary, GeneratedDailyReadingView } from "./GeneratedDailyReading";

export function GeneratedDailyReadingArea() {
 const [selectedId, setSelectedId] = useState<string | null>(null);
 return selectedId === null ? (
  <GeneratedDailyReadingLibrary onOpen={setSelectedId} />
 ) : (
  <GeneratedDailyReadingView id={selectedId} onBack={() => setSelectedId(null)} />
 );
}
