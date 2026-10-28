"use client";

import {
 createContext,
 useCallback,
 useContext,
 useEffect,
 useLayoutEffect,
 useMemo,
 useRef,
 useState,
 type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { useSelector } from "@tanstack/react-store";

import { Button } from "@/components/ui/actions/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { focusModeStore, isFocusNavigationAllowed } from "@/stores/shell/focus-mode-store";
import { noteTabsStore } from "@/stores/notes/note-tabs-store";

type UnsavedDraftGuardValue = {
 registerDirty: (owner: symbol, dirty: boolean) => void;
 requestNavigation: (navigate: () => void) => void;
};

const UnsavedDraftGuardContext = createContext<UnsavedDraftGuardValue>({
 registerDirty: () => {},
 requestNavigation: (navigate) => navigate(),
});

export function useUnsavedDraftGuard(dirty: boolean) {
 const guard = useContext(UnsavedDraftGuardContext);
 const owner = useRef(Symbol("unsaved-draft"));

 useLayoutEffect(() => {
  const ownerId = owner.current;
  guard.registerDirty(ownerId, dirty);
  return () => guard.registerDirty(ownerId, false);
 }, [dirty, guard]);

 return guard.requestNavigation;
}

export function UnsavedDraftNavigationGuard({ children }: { children: ReactNode }) {
 const t = useTranslations("Shell.unsavedDraft");
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const searchParamsString = searchParams.toString();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const dirtyOwners = useRef(new Set<symbol>());
 const [dirtyCount, setDirtyCount] = useState(0);
 const [open, setOpen] = useState(false);
 const pendingNavigation = useRef<() => void>(() => {});
 const pendingBack = useRef(false);
 const guardedHref = useRef("");
 const bypassClick = useRef(false);
 const bypassPopState = useRef(false);
 const bypassPopStateTimer = useRef(0);
 const allowUnload = useRef(false);

 const registerDirty = useCallback((owner: symbol, dirty: boolean) => {
  if (dirty) dirtyOwners.current.add(owner);
  else dirtyOwners.current.delete(owner);
  setDirtyCount(dirtyOwners.current.size);
 }, []);

 const requestNavigation = useCallback((navigate: () => void) => {
  if (dirtyOwners.current.size === 0) {
   navigate();
   return;
  }
  pendingNavigation.current = navigate;
  pendingBack.current = false;
  setOpen(true);
 }, []);
 const guard = useMemo(
  () => ({ registerDirty, requestNavigation }),
  [registerDirty, requestNavigation],
 );

 useEffect(() => {
  if (dirtyCount === 0 || focusModeEnabled) {
   guardedHref.current = "";
   return;
  }
  const href = window.location.href;
  if (guardedHref.current === href) return;
  guardedHref.current = href;
  window.history.pushState(window.history.state, "", href);
 }, [dirtyCount, focusModeEnabled, pathname, searchParamsString]);

 useLayoutEffect(() => {
  const handleClick = (event: MouseEvent) => {
   if (
    dirtyOwners.current.size === 0 ||
    bypassClick.current ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
   )
    return;
   const target = event.target;
   if (!(target instanceof Element)) return;
   const anchor = target.closest<HTMLAnchorElement>("a[href]");
   if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self"))
    return;
   const currentHref = window.location.href;
   const targetHref = anchor.href;
   const targetUrl = new URL(targetHref);
   const currentUrl = new URL(currentHref);
   if (
    targetUrl.origin === currentUrl.origin &&
    targetUrl.pathname === currentUrl.pathname &&
    targetUrl.search === currentUrl.search
   )
    return;
   if (
    focusModeStore.get().enabled &&
    !isFocusNavigationAllowed({
     currentHref,
     targetHref,
     openNoteIds: noteTabsStore.get().tabs.map((tab) => tab.noteId),
    })
   )
    return;

   event.preventDefault();
   event.stopPropagation();
   pendingBack.current = false;
   pendingNavigation.current = () => {
    bypassClick.current = true;
    allowUnload.current = true;
    anchor.click();
    bypassClick.current = false;
    window.setTimeout(() => {
     allowUnload.current = false;
    }, 1000);
   };
   setOpen(true);
  };

  const handlePopState = () => {
   if (bypassPopState.current) {
    bypassPopState.current = false;
    window.clearTimeout(bypassPopStateTimer.current);
    bypassPopStateTimer.current = 0;
    allowUnload.current = false;
    return;
   }
   if (dirtyOwners.current.size === 0 || focusModeStore.get().enabled) return;
   pendingBack.current = true;
   pendingNavigation.current = () => {
    bypassPopState.current = true;
    allowUnload.current = true;
    window.history.back();
    window.clearTimeout(bypassPopStateTimer.current);
    bypassPopStateTimer.current = window.setTimeout(() => {
     bypassPopState.current = false;
     allowUnload.current = false;
    }, 500);
   };
   setOpen(true);
  };

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
   if (dirtyOwners.current.size === 0 || allowUnload.current) return;
   event.preventDefault();
   event.returnValue = "";
  };

  document.addEventListener("click", handleClick, true);
  window.addEventListener("popstate", handlePopState);
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => {
   document.removeEventListener("click", handleClick, true);
   window.removeEventListener("popstate", handlePopState);
   window.removeEventListener("beforeunload", handleBeforeUnload);
   window.clearTimeout(bypassPopStateTimer.current);
  };
 }, []);

 const keepDraft = () => {
  setOpen(false);
  pendingNavigation.current = () => {};
  if (pendingBack.current) {
   pendingBack.current = false;
   bypassPopState.current = true;
   window.history.forward();
   window.clearTimeout(bypassPopStateTimer.current);
   bypassPopStateTimer.current = window.setTimeout(() => {
    bypassPopState.current = false;
    allowUnload.current = false;
   }, 500);
  }
 };

 const leave = () => {
  setOpen(false);
  pendingBack.current = false;
  const navigate = pendingNavigation.current;
  pendingNavigation.current = () => {};
  navigate();
 };

 return (
  <UnsavedDraftGuardContext.Provider value={guard}>
   {children}
   <Dialog
    open={open}
    onOpenChange={(next) => {
     if (!next) keepDraft();
    }}
   >
    <DialogContent size="sm" closeLabel={t("stay")}>
     <DialogHeader>
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogDescription>{t("description")}</DialogDescription>
     </DialogHeader>
     <DialogFooter>
      <Button type="button" variant="outline" onClick={keepDraft}>
       {t("stay")}
      </Button>
      <Button type="button" variant="destructive" onClick={leave}>
       {t("leave")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </UnsavedDraftGuardContext.Provider>
 );
}
