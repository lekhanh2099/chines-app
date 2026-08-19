"use client";

import { useSyncExternalStore } from "react";

type AiConversationClientStreamState = {
 active: boolean;
 content: string;
 stop: (() => void) | null;
};

const idleState: AiConversationClientStreamState = {
 active: false,
 content: "",
 stop: null,
};

let state = idleState;
const listeners = new Set<() => void>();

function emit(next: AiConversationClientStreamState) {
 state = next;
 for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
 listeners.add(listener);
 return () => listeners.delete(listener);
}

function getSnapshot() {
 return state;
}

export function beginAiConversationClientStream(stop: () => void) {
 emit({ active: true, content: "", stop });
}

export function appendAiConversationClientStreamDelta(text: string) {
 if (!state.active || text.length === 0) return;
 emit({ ...state, content: `${state.content}${text}` });
}

export function endAiConversationClientStream() {
 if (state === idleState) return;
 emit(idleState);
}

export function useAiConversationClientStream() {
 return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
