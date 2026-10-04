import { Profiler } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { useShadowingRecorder } from "./useShadowingRecorder";

// Deterministic browser fixture: no microphone permission or hardware recording.
class FixtureRecorder extends EventTarget implements MediaRecorder {
 readonly audioBitsPerSecond = 0;
 readonly videoBitsPerSecond = 0;
 readonly mimeType = "audio/webm";
 state: MediaRecorder["state"] = "inactive";
 ondataavailable: MediaRecorder["ondataavailable"] = null;
 onerror: MediaRecorder["onerror"] = null;
 onpause: MediaRecorder["onpause"] = null;
 onresume: MediaRecorder["onresume"] = null;
 onstart: MediaRecorder["onstart"] = null;
 onstop: MediaRecorder["onstop"] = null;
 constructor(readonly stream: MediaStream) {
  super();
 }
 static isTypeSupported() {
  return true;
 }
 start() {
  this.state = "recording";
 }
 stop() {
  this.state = "inactive";
  this.onstop?.call(this, new Event("stop"));
 }
 pause() {
  this.state = "paused";
 }
 resume() {
  this.state = "recording";
 }
 requestData() {}
}
window.MediaRecorder = FixtureRecorder;
Object.defineProperty(navigator, "mediaDevices", {
 configurable: true,
 value: { getUserMedia: async () => new MediaStream() },
});
let elapsed = 0;
let activeTimer = false;
let commits = 0;
const timer = { tick: () => {} };
Date.now = () => 1_000_000 + elapsed;
Object.defineProperty(window, "setInterval", {
 configurable: true,
 value: (handler: TimerHandler) => {
  if (typeof handler !== "function") throw new Error("Expected interval callback");
  timer.tick = () => handler();
  activeTimer = true;
  return 1;
 },
});
window.clearInterval = () => {
 activeTimer = false;
};
const evidence = document.createElement("pre");
evidence.id = "recorder-evidence";
const commitCount = document.createElement("output");
commitCount.id = "recorder-commits";
const controls = document.createElement("nav");
const container = document.createElement("main");
document.body.append(controls, container, evidence, commitCount);
function emit() {
 commitCount.textContent = String(commits);
 evidence.textContent = JSON.stringify({ commits, elapsed, activeTimer });
}
function Probe() {
 const recorder = useShadowingRecorder();
 return (
  <section>
   <Button
    onClick={() => {
     void recorder.start();
    }}
   >
    Start fixture recording
   </Button>
   <Typography as="p" role="status">
    {recorder.isRecording ? "recording" : "idle"}
   </Typography>
   <Typography as="p">Displayed seconds: {recorder.durationSeconds}</Typography>
  </section>
 );
}
const root = createRoot(container);
root.render(
 <Profiler
  id="recorder"
  onRender={() => {
   commits += 1;
   emit();
  }}
 >
  <Probe />
 </Profiler>,
);
function button(label: string, action: () => void) {
 const control = document.createElement("button");
 control.textContent = label;
 control.onclick = action;
 controls.append(control);
}
for (const time of [500, 1000, 1500, 2000])
 button(`Tick ${time}`, () => {
  elapsed = time;
  if (activeTimer) timer.tick();
  emit();
 });
button("Unmount recorder", () => {
 root.unmount();
 emit();
});
emit();
