"use client";

import { useSelector } from "@tanstack/react-store";
import { createContext, useContext } from "react";

import type { ReaderStore } from "./reader-store";
import type { ReaderCommands } from "./reader-playback";
import type { ReaderServices } from "./reader-services";
import {
 defaultReaderDisplay,
 type ReaderDisplay,
 type ReaderDisplayAdapter,
} from "../model/reader-display";
import type { createReaderRegistry } from "./reader-registry";
import type { ReaderState } from "../model/reader.schemas";
import {
 selectSegment,
 selectSegmentIsActive,
 selectPlaybackStatus,
 selectPlaybackProgress,
 selectPlaybackStartOffset,
} from "./reader-selectors";

export const ReaderStoreContext = createContext<ReaderStore | null>(null);
export const ReaderCommandsContext = createContext<ReaderCommands | null>(null);
export const ReaderServicesContext = createContext<ReaderServices>({});
export const ReaderRegistryContext = createContext<ReturnType<typeof createReaderRegistry> | null>(
 null,
);
export const ReaderDisplayContext = createContext<{
 value: ReaderDisplay;
 onChange?: ReaderDisplayAdapter["onChange"];
}>({ value: defaultReaderDisplay });

export function useReaderStore() {
 const store = useContext(ReaderStoreContext);
 if (!store) throw new Error("Reader hooks require ReaderProvider");
 return store;
}
export function useReaderCommands() {
 const commands = useContext(ReaderCommandsContext);
 if (!commands) throw new Error("Reader commands require ReaderProvider");
 return commands;
}
export function useReaderRegistry() {
 const registry = useContext(ReaderRegistryContext);
 if (!registry) throw new Error("Reader registry requires ReaderProvider");
 return registry;
}
export function useReaderServices() {
 return useContext(ReaderServicesContext);
}
export function useReaderDisplay() {
 return useContext(ReaderDisplayContext);
}
export function useReaderSelector<T>(selector: (state: ReaderState) => T): T {
 return useSelector(useReaderStore(), selector);
}
export function useReaderSegment(id: string) {
 return useReaderSelector(selectSegment(id));
}
export function useReaderSegmentIsActive(id: string) {
 return useReaderSelector(selectSegmentIsActive(id));
}
export function useReaderPlaybackStatus(id: string) {
 return useReaderSelector(selectPlaybackStatus(id));
}
export function useReaderPlaybackProgress(id: string) {
 return useReaderSelector(selectPlaybackProgress(id));
}
export function useReaderPlaybackStartOffset(id: string) {
 return useReaderSelector(selectPlaybackStartOffset(id));
}
export function useReaderActiveIndex() {
 return useReaderSelector((state) => state.navigation.activeIndex);
}
export function useReaderOutlineOpen() {
 return useReaderSelector((state) => state.ui.outlineOpen);
}
export function useReaderSegmentIds() {
 return useReaderSelector((state) => state.content.segmentIds);
}
export function useReaderSectionIds() {
 return useReaderSelector((state) => state.content.sectionIds);
}
