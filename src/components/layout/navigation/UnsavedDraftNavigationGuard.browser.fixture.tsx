import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import shellMessages from "../../../../messages/vi/shell.json";
import { UnsavedDraftNavigationGuard, useUnsavedDraftGuard } from "./UnsavedDraftNavigationGuard";

window.history.replaceState(null, "", "/previous");
window.history.pushState(null, "", "/navigation-audit");

const popstateEvents = document.createElement("output");
popstateEvents.dataset.testid = "popstate-events";
popstateEvents.textContent = "0";
document.body.append(popstateEvents);
window.addEventListener(
 "popstate",
 () => {
  popstateEvents.textContent = String(Number(popstateEvents.textContent) + 1);
 },
 true,
);

function DraftProbe({ dirty }: { dirty: boolean }) {
 useUnsavedDraftGuard(dirty);

 return <output data-testid="draft-state">{dirty ? "dirty" : "clean"}</output>;
}

function App() {
 const [dirty, setDirty] = useState(true);
 const [popstateBubbles, setPopstateBubbles] = useState(0);

 useEffect(() => {
  const handlePopState = () => setPopstateBubbles((count) => count + 1);
  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
 }, []);

 return (
  <NextIntlClientProvider
   locale="vi"
   messages={{ Shell: shellMessages }}
   timeZone="Asia/Ho_Chi_Minh"
  >
   <UnsavedDraftNavigationGuard>
    <main>
     <Button type="button" variant="outline" onClick={() => setDirty((value) => !value)}>
      Toggle draft
     </Button>
     <DraftProbe dirty={dirty} />
     <output data-testid="popstate-bubbles">{popstateBubbles}</output>
    </main>
   </UnsavedDraftNavigationGuard>
  </NextIntlClientProvider>
 );
}

const container = document.createElement("div");
document.body.append(container);
createRoot(container).render(<App />);

export function usePathname() {
 return window.location.pathname;
}

export function useSearchParams() {
 return new URLSearchParams(window.location.search);
}
