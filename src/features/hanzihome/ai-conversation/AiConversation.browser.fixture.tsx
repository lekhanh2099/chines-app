import { Profiler, type ComponentProps, type ElementType } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import type {
 useRouter as navigationRouter,
 usePathname as navigationPathname,
} from "next/navigation";
import {
 Typography as ActualTypography,
 type TypographyProps,
} from "../../../components/ui/display/typography";
import { loadAppMessages } from "@/i18n/messages";
import { AiConversationWorkspace } from "./AiConversationWorkspace";
import "@/app/globals.css";

const completedContents = new Set<string>();
const bodyCommits = new Map<string, number[]>();
export function Typography<T extends ElementType = "p">(props: TypographyProps<T>) {
 const content = typeof props.children === "string" ? props.children : "";
 if (!completedContents.has(content)) return <ActualTypography {...props} />;
 return (
  <Profiler
   id={content}
   onRender={(_id, _phase, duration) => {
    const samples = bodyCommits.get(content) ?? [];
    samples.push(duration);
    bodyCommits.set(content, samples);
   }}
  >
   <ActualTypography {...props} />
  </Profiler>
 );
}

const navigations: string[] = [];
const router: ReturnType<typeof navigationRouter> = {
 push: (href) => navigations.push(href),
 replace: (href) => {
  navigations.push(href);
  window.history.replaceState(null, "", href);
 },
 prefetch: () => {},
 back: () => {},
 forward: () => {},
 refresh: () => {},
 bfcacheId: "ai-conversation-fixture",
};
export function useRouter(): ReturnType<typeof navigationRouter> {
 return router;
}
export const usePathname: typeof navigationPathname = () => "/ai-conversation";
export function useSearchParams() {
 return new URLSearchParams(window.location.search);
}
export function Link(props: ComponentProps<"a">) {
 return <a {...props} />;
}
export default Link;

const container = document.createElement("main");
container.className = "h-screen";
document.body.append(container);
const root = createRoot(container);
const queryClient = new QueryClient({
 defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
const harness = {
 async mount(contents: string[]) {
  contents.forEach((content) => completedContents.add(content));
  const messages = await loadAppMessages("vi");
  root.render(
   <QueryClientProvider client={queryClient}>
    <NextIntlClientProvider locale="vi" messages={messages}>
     <AiConversationWorkspace />
    </NextIntlClientProvider>
   </QueryClientProvider>,
  );
 },
 reset: () => bodyCommits.clear(),
 snapshot: () => ({
  bodies: [...bodyCommits].map(([content, durations]) => ({ content, durations: [...durations] })),
  navigations: [...navigations],
 }),
 unmount: () => {
  root.render(null);
  queryClient.clear();
 },
};
declare global {
 interface Window {
  aiConversationHarness: typeof harness;
 }
}
window.aiConversationHarness = harness;
