"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { ReaderContentState } from "../model/reader.schemas";
import {
 ReaderStoreContext,
 ReaderCommandsContext,
 ReaderServicesContext,
 ReaderRegistryContext,
 ReaderDisplayContext,
} from "./reader-context";
import { createReaderPlayback } from "./reader-playback";
import { createReaderRegistry } from "./reader-registry";
import { createReaderStore } from "./reader-store";
import type { ReaderServices } from "./reader-services";
import {
 defaultReaderDisplay,
 type ReaderDisplay,
 type ReaderDisplayAdapter,
} from "../model/reader-display";

const defaultServices: ReaderServices = {};

export function ReaderProvider({
 content,
 services = defaultServices,
 display = defaultReaderDisplay,
 onDisplayChange,
 children,
}: {
 content: ReaderContentState;
 services?: ReaderServices;
 display?: ReaderDisplay;
 onDisplayChange?: ReaderDisplayAdapter["onChange"];
 children: ReactNode;
}) {
 const [store] = useState(() => createReaderStore(content));
 const [registry] = useState(createReaderRegistry);
 const commands = useMemo(
  () => createReaderPlayback(store, services.speech),
  [store, services.speech],
 );
 const displayContext = useMemo(
  () => ({ value: display, onChange: onDisplayChange }),
  [display, onDisplayChange],
 );

 // Bridge authoritative cooked props into the instance-local external store.
 useEffect(() => {
  commands.replaceContent(content);
 }, [commands, content]);
 useEffect(() => () => commands.dispose(), [commands]);

 return (
  <ReaderStoreContext.Provider value={store}>
   <ReaderCommandsContext.Provider value={commands}>
    <ReaderServicesContext.Provider value={services}>
     <ReaderRegistryContext.Provider value={registry}>
      <ReaderDisplayContext.Provider value={displayContext}>
       {children}
      </ReaderDisplayContext.Provider>
     </ReaderRegistryContext.Provider>
    </ReaderServicesContext.Provider>
   </ReaderCommandsContext.Provider>
  </ReaderStoreContext.Provider>
 );
}
