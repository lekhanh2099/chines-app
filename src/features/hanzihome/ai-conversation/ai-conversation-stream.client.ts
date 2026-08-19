"use client";

import { createStore, useSelector } from "@tanstack/react-store";

type AiConversationClientStreamState = {
 active: boolean;
 content: string;
 stop: (() => void) | null;
};

type AiConversationClientStreamActions = {
 begin: (stop: () => void) => void;
 append: (text: string) => void;
 end: () => void;
};

const idleState: AiConversationClientStreamState = {
 active: false,
 content: "",
 stop: null,
};

const streamStore = createStore<
 AiConversationClientStreamState,
 AiConversationClientStreamActions
>(idleState, ({ setState }) => ({
 begin: (stop) => setState({ active: true, content: "", stop }),
 append: (text) =>
  setState((state) =>
   !state.active || text.length === 0
    ? state
    : { ...state, content: `${state.content}${text}` },
  ),
 end: () => setState(idleState),
}));

export function beginAiConversationClientStream(stop: () => void) {
 streamStore.actions.begin(stop);
}

export function appendAiConversationClientStreamDelta(text: string) {
 streamStore.actions.append(text);
}

export function endAiConversationClientStream() {
 streamStore.actions.end();
}

export function useAiConversationClientStream() {
 return useSelector(streamStore, (state) => state);
}
