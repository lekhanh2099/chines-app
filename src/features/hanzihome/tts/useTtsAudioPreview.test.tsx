import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTtsAudioPreview } from "./useTtsAudioPreview";

const generateAudio = vi.fn<Parameters<typeof useTtsAudioPreview>[0]>();
const onGenerationError = vi.fn<() => void>();
function controller() {
 const captures: ReturnType<typeof useTtsAudioPreview>[] = [];
 function Probe() {
  captures.push(useTtsAudioPreview(generateAudio, onGenerationError));
  return null;
 }
 renderToStaticMarkup(<Probe />);
 const hook = captures[0];
 if (!hook) throw new Error("Missing preview controller");
 return hook;
}
beforeEach(() => {
 generateAudio.mockReset();
 onGenerationError.mockReset();
 vi.spyOn(URL, "createObjectURL").mockReturnValueOnce("blob:first").mockReturnValue("blob:second");
 vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

it("releases the previous preview URL when replacing it", async () => {
 generateAudio.mockResolvedValue(new Blob(["fixture audio"]));
 const hook = controller();
 await expect(hook.prepareAudio("first")).resolves.toBe(true);
 await expect(hook.prepareAudio("second")).resolves.toBe(true);
 expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:first");
});
it("ignores an older generation that completes after its successor", async () => {
 let resolveFirst: (blob: Blob) => void = () => {};
 generateAudio.mockImplementationOnce(
  () =>
   new Promise((resolve) => {
    resolveFirst = resolve;
   }),
 );
 generateAudio.mockResolvedValue(new Blob(["new audio"]));
 const hook = controller();
 const first = hook.prepareAudio("first");
 await expect(hook.prepareAudio("second")).resolves.toBe(true);
 resolveFirst(new Blob(["old audio"]));
 await expect(first).resolves.toBe(false);
 expect(URL.createObjectURL).toHaveBeenCalledOnce();
 expect(onGenerationError).not.toHaveBeenCalled();
});
it("does not manufacture an audio URL after a missing or rejected generation", async () => {
 generateAudio.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("cache failure"));
 const hook = controller();
 await expect(hook.prepareAudio("first")).resolves.toBe(false);
 await expect(hook.prepareAudio("second")).resolves.toBe(false);
 expect(URL.createObjectURL).not.toHaveBeenCalled();
 expect(onGenerationError).toHaveBeenCalledTimes(2);
});
it("clearing a preview invalidates a pending generation and releases its current URL", async () => {
 generateAudio.mockResolvedValueOnce(new Blob(["first"]));
 let complete: (blob: Blob) => void = () => {};
 generateAudio.mockImplementationOnce(
  () =>
   new Promise((resolve) => {
    complete = resolve;
   }),
 );
 const hook = controller();
 await hook.prepareAudio("first");
 const pending = hook.prepareAudio("second");
 hook.clearPreview();
 complete(new Blob(["second"]));
 await expect(pending).resolves.toBe(false);
 expect(URL.createObjectURL).toHaveBeenCalledOnce();
 expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:first");
});
