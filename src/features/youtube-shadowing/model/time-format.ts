export function formatTimestampMs(ms: number): string {
 const totalSeconds = Math.max(0, Math.floor(ms / 1000));
 const hours = Math.floor(totalSeconds / 3600);
 const minutes = Math.floor((totalSeconds % 3600) / 60);
 const seconds = totalSeconds % 60;
 const paddedSeconds = String(seconds).padStart(2, "0");

 if (hours > 0) {
  return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
 }

 return `${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
}

export function formatDurationSeconds(totalSeconds: number): string {
 const safeSeconds = Math.max(0, Math.floor(totalSeconds));
 const minutes = Math.floor(safeSeconds / 60);
 const seconds = safeSeconds % 60;
 return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
