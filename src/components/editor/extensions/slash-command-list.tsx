import React, {
 forwardRef,
 useEffect,
 useImperativeHandle,
 useState,
} from "react";
import { Heading1, Heading2, List, ListOrdered, Quote } from "lucide-react";

interface CommandItemProps {
 title: string;
 description: string;
 icon: React.ReactNode;
 command: (props: { editor: any; range: any }) => void;
}

export const getSuggestionItems = ({ query }: { query: string }) => {
 return [
  {
   title: "Heading 1",
   description: "Tiêu đề lớn.",
   icon: <Heading1 size={18} />,
   command: ({ editor, range }: any) => {
    editor
     .chain()
     .focus()
     .deleteRange(range)
     .setNode("heading", { level: 1 })
     .run();
   },
  },
  {
   title: "Heading 2",
   description: "Tiêu đề vừa.",
   icon: <Heading2 size={18} />,
   command: ({ editor, range }: any) => {
    editor
     .chain()
     .focus()
     .deleteRange(range)
     .setNode("heading", { level: 2 })
     .run();
   },
  },
  {
   title: "Bullet List",
   description: "Danh sách không thứ tự.",
   icon: <List size={18} />,
   command: ({ editor, range }: any) => {
    editor.chain().focus().deleteRange(range).toggleBulletList().run();
   },
  },
  {
   title: "Numbered List",
   description: "Danh sách có thứ tự.",
   icon: <ListOrdered size={18} />,
   command: ({ editor, range }: any) => {
    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
   },
  },
  {
   title: "Quote",
   description: "Trích dẫn.",
   icon: <Quote size={18} />,
   command: ({ editor, range }: any) => {
    editor.chain().focus().deleteRange(range).toggleBlockquote().run();
   },
  },
 ].filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()));
};

export const CommandList = forwardRef((props: any, ref) => {
 const [selectedIndex, setSelectedIndex] = useState(0);

 const selectItem = (index: number) => {
  const item = props.items[index];
  if (item) {
   props.command(item);
  }
 };

 useEffect(() => {
  setSelectedIndex(0);
 }, [props.items]);

 useImperativeHandle(ref, () => ({
  onKeyDown: ({ event }: { event: KeyboardEvent }) => {
   if (event.key === "ArrowUp") {
    setSelectedIndex(
     (selectedIndex + props.items.length - 1) % props.items.length,
    );
    return true;
   }

   if (event.key === "ArrowDown") {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
    return true;
   }

   if (event.key === "Enter") {
    selectItem(selectedIndex);
    return true;
   }

   return false;
  },
 }));

 if (props.items.length === 0) {
  return null;
 }

 return (
  <div className="z-50 w-72 bg-bg-elevated rounded-xl shadow-theme-lg border border-border-default overflow-hidden p-2">
   <div className="text-xs font-semibold text-text-muted mb-2 px-2 pt-1 uppercase tracking-wider">
    Basic Blocks
   </div>
   {props.items.map((item: CommandItemProps, index: number) => (
    <button
     className={`flex items-center gap-3 w-full text-left px-2 py-2 rounded-md transition-colors ${
      index === selectedIndex
       ? "bg-accent/10 text-accent"
       : "hover:bg-bg-card-hover text-text-primary"
     }`}
     key={index}
     onClick={() => selectItem(index)}
    >
     <div
      className={`flex items-center justify-center p-2 rounded-md ${
       index === selectedIndex
        ? "bg-accent/20"
        : "bg-bg-card border border-border-default"
      }`}
     >
      {item.icon}
     </div>
     <div>
      <div className="font-medium text-sm">{item.title}</div>
      <div className="text-xs text-text-muted opacity-80">
       {item.description}
      </div>
     </div>
    </button>
   ))}
  </div>
 );
});

CommandList.displayName = "CommandList";
