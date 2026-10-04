import { Profiler, useState } from "react";
import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";
import { useTtsAudioPreview } from "./useTtsAudioPreview";
import { useTtsStudioPlayback } from "./useTtsStudioPlayback";
import { splitTtsStudioText } from "./tts-studio.schemas";
import { useDictationPlayback } from "@/features/dictation/useDictationPlayback";
import { externalDictationEntry } from "@/features/dictation/dictation-workspace-utils";
import {
 MandarinTtsProvider,
 useMandarinReaderSpeechService,
 useSharedMandarinTts,
} from "@/features/speech/MandarinTtsProvider";
import { MandarinSpeakButton } from "../listening/MandarinSpeakButton";
import messages from "../../../../messages/vi/tts-studio.json";

const created: string[] = [];
const revoked: string[] = [];
const waiting: ((blob: Blob) => void)[] = [];
const createUrl = URL.createObjectURL.bind(URL);
const revokeUrl = URL.revokeObjectURL.bind(URL);
const evidence = document.createElement("pre");
evidence.id = "audio-evidence";
const controls = document.createElement("nav");
const container = document.createElement("main");
document.body.append(controls, container, evidence);
function emit() {
 evidence.textContent = JSON.stringify({
  created: created.length,
  revoked: revoked.length,
  pending: waiting.length,
 });
}
URL.createObjectURL = (blob) => {
 const url = createUrl(blob);
 created.push(url);
 emit();
 return url;
};
URL.revokeObjectURL = (url) => {
 revoked.push(url);
 revokeUrl(url);
 emit();
};
const generateAudio: Parameters<typeof useTtsAudioPreview>[0] = () =>
 new Promise((resolve) => {
  waiting.push(resolve);
  emit();
 });
function Probe() {
 const [result, setResult] = useState("");
 const { audioUrl, isGenerating, prepareAudio } = useTtsAudioPreview(generateAudio, () =>
  setResult("error"),
 );
 return (
  <section>
   <Button
    onClick={() => {
     void prepareAudio("fixture").then((prepared) => setResult(String(prepared)));
    }}
   >
    Generate preview
   </Button>
   <Typography as="p" role="status">
    {isGenerating ? "generating" : "idle"}
   </Typography>
   <Typography as="p">{audioUrl ? "Preview available" : "No preview"}</Typography>
   <Typography as="p">{result}</Typography>
  </section>
 );
}
const playbackEvidence = document.createElement("pre");
playbackEvidence.id = "tts-playback-evidence";
document.body.append(playbackEvidence);
const spoken: string[][] = [];
const completions: (() => void)[] = [];
let stops = 0;
function emitPlayback() {
 playbackEvidence.textContent = JSON.stringify({ spoken, stops });
}
const speakSequence: Parameters<typeof useTtsStudioPlayback>[0]["speakSequence"] = (
 texts,
 onComplete,
) => {
 spoken.push([...texts]);
 if (onComplete) completions.push(onComplete);
 emitPlayback();
};
const stopPlayback: Parameters<typeof useTtsStudioPlayback>[0]["stop"] = () => {
 stops += 1;
 emitPlayback();
};
function PlaybackProbe() {
 const [text, setText] = useState("你好。谢谢！");
 const [autoAdvance, setAutoAdvance] = useState(false);
 const [loopCurrent, setLoopCurrent] = useState(false);
 const [activeIndex, setActiveIndex] = useState(0);
 const playback = useTtsStudioPlayback({
  text,
  mode: "sentence",
  segments: splitTtsStudioText(text, "sentence"),
  autoAdvance,
  loopCurrent,
  speakSequence,
  stop: stopPlayback,
  pause: () => {},
  resume: () => {},
  isSpeaking: false,
  isPaused: false,
  onSelect: setActiveIndex,
  onOpenClip: () => {},
  setSelectedVoiceName: () => {},
  setRate: () => {},
 });
 return (
  <section aria-label="Playback lifecycle probe">
   <label>
    Playback source
    <Textarea value={text} onChange={(event) => setText(event.target.value)} />
   </label>
   <Button onClick={() => setAutoAdvance(true)}>Enable advance</Button>
   <Button onClick={() => setLoopCurrent(true)}>Enable loop</Button>
   <Button onClick={() => playback.playSegmentAt(0)}>Play first segment</Button>
   <Button onClick={playback.playSegments}>Play passage</Button>
   <Button onClick={playback.stopPlayback}>Stop playback</Button>
   <Button onClick={() => completions.shift()?.()}>Complete playback</Button>
   <Typography as="p">Active segment: {activeIndex}</Typography>
  </section>
 );
}
const dictationEvidence = document.createElement("pre");
dictationEvidence.id = "dictation-playback-evidence";
document.body.append(dictationEvidence);
const dictationSpoken: string[][] = [];
const dictationCompletions: (() => void)[] = [];
function emitDictation() {
 dictationEvidence.textContent = JSON.stringify(dictationSpoken);
}
const dictationSpeech: Parameters<typeof useDictationPlayback>[0]["speakSequence"] = (
 texts,
 onComplete,
) => {
 dictationSpoken.push([...texts]);
 if (onComplete) dictationCompletions.push(onComplete);
 emitDictation();
};
const dictationVoices: Parameters<typeof useDictationPlayback>[0]["loadVoices"] = async () => [];
const dictationEntries = [
 externalDictationEntry("first", "你好。", "First", "nǐ hǎo"),
 externalDictationEntry("second", "谢谢！", "Second", "xiè xie"),
];
function DictationPlaybackProbe() {
 const playback = useDictationPlayback({
  entries: dictationEntries,
  enabled: true,
  playWholePassage: false,
  loadVoices: dictationVoices,
  stop: () => {},
  speakSequence: dictationSpeech,
  pause: () => {},
  resume: () => {},
  isLoading: false,
  isPaused: false,
  isSpeaking: false,
 });
 return (
  <section aria-label="Dictation lifecycle probe">
   <Button onClick={playback.playTransport}>Dictation play</Button>
   <Button onClick={() => playback.changeTransportLoop(true)}>Dictation loop</Button>
   <Button onClick={() => playback.changeTransportAutoAdvance(true)}>Dictation advance</Button>
   <Button onClick={playback.resetPlayback}>Dictation reset</Button>
   <Button onClick={() => dictationCompletions.shift()?.()}>Dictation complete</Button>
   <Typography as="p">
    Dictation active: {dictationEntries[playback.effectiveActiveEntryIndex]?.id ?? ""}
   </Typography>
   <Typography as="p">
    Dictation loop: {String(playback.loopCurrent)}, advance: {String(playback.autoAdvance)}
   </Typography>
  </section>
 );
}
const root = createRoot(container);
const contextEvidence = document.createElement("pre");
contextEvidence.id = "tts-context-evidence";
document.body.append(contextEvidence);
const contextCommits = { full: 0, reader: 0, button: 0 };
function emitContext() {
 contextEvidence.textContent = JSON.stringify(contextCommits);
}
function FullSubscriber() {
 const tts = useSharedMandarinTts();
 return (
  <section aria-label="Full TTS subscriber">
   <Button onClick={() => tts.setRate(1.25)}>Set fixture rate 1.25</Button>
   <Button onClick={() => tts.setRate(1.5)}>Set fixture rate 1.5</Button>
   <Typography as="p">Fixture rate: {tts.rate}</Typography>
  </section>
 );
}
function ReaderSubscriber() {
 const speech = useMandarinReaderSpeechService();
 return <Button onClick={speech.stop}>Reader stable stop</Button>;
}
root.render(
 <>
  <Probe />
  <PlaybackProbe />
  <DictationPlaybackProbe />
  <MandarinTtsProvider>
   <NextIntlClientProvider
    locale="vi"
    messages={{ TtsStudio: messages }}
    timeZone="Asia/Ho_Chi_Minh"
   >
    <Profiler
     id="full"
     onRender={() => {
      contextCommits.full += 1;
      emitContext();
     }}
    >
     <FullSubscriber />
    </Profiler>
    <Profiler
     id="reader"
     onRender={() => {
      contextCommits.reader += 1;
      emitContext();
     }}
    >
     <ReaderSubscriber />
    </Profiler>
    <Profiler
     id="button"
     onRender={() => {
      contextCommits.button += 1;
      emitContext();
     }}
    >
     <MandarinSpeakButton text="测试" />
    </Profiler>
   </NextIntlClientProvider>
  </MandarinTtsProvider>
 </>,
);
function button(label: string, action: () => void) {
 const control = document.createElement("button");
 control.textContent = label;
 control.onclick = action;
 controls.append(control);
}
button("Reset context commits", () => {
 contextCommits.full = 0;
 contextCommits.reader = 0;
 contextCommits.button = 0;
 emitContext();
});
button("Complete generation", () => {
 waiting.shift()?.(new Blob(["fixture audio"]));
 emit();
});
button("Unmount preview", () => {
 root.unmount();
 emit();
});
emit();
