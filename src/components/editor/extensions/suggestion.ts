import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { CommandList, getSuggestionItems } from "./slash-command-list";

export const suggestion = {
 items: getSuggestionItems,

 render: () => {
  let component: ReactRenderer;
  let popup: any;

  return {
   onStart: (props: any) => {
    component = new ReactRenderer(CommandList, {
     props,
     editor: props.editor,
    });

    if (!props.clientRect) {
     return;
    }

    popup = tippy("body", {
     getReferenceClientRect: props.clientRect,
     appendTo: () => document.body,
     content: component.element,
     showOnCreate: true,
     interactive: true,
     trigger: "manual",
     placement: "bottom-start",
    });
   },

   onUpdate(props: any) {
    component.updateProps(props);

    if (!props.clientRect) {
     return;
    }

    popup[0].setProps({
     getReferenceClientRect: props.clientRect,
    });
   },

   onKeyDown(props: any) {
    if (props.event.key === "Escape") {
     popup[0].hide();
     return true;
    }

    return (component.ref as any)?.onKeyDown(props);
   },

   onExit() {
    popup[0].destroy();
    component.destroy();
   },
  };
 },
};
