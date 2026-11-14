export function createReaderRegistry() {
 const elements = new Map<string, HTMLElement>();
 const outline: { trigger?: HTMLElement } = {};
 return {
  setOutlineTrigger: (element: HTMLElement) => {
   outline.trigger = element;
  },
  focusOutlineTrigger: () => outline.trigger?.focus(),
  set: (id: string, element: HTMLElement | null) => {
   if (element) elements.set(id, element);
   else elements.delete(id);
  },
  get: (id: string) => elements.get(id),
  clear: () => elements.clear(),
 };
}
