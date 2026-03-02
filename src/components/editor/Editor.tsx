import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Ruby } from "./extensions/ruby";
import { SlashCommand } from "./extensions/slash-command";
import { suggestion } from "./extensions/suggestion";
import { pinyin } from "pinyin-pro";
import { toast } from "sonner";
import {
 Bot,
 Languages,
 Save,
 Bold,
 Italic,
 Strikethrough,
 Code,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EditorProps {
 initialContent?: any;
 onChange?: (json: any) => void;
 readOnly?: boolean;
}

export function Editor({
 initialContent,
 onChange,
 readOnly = false,
}: EditorProps) {
 const [isProcessing, setIsProcessing] = useState(false);
 const supabase = createClient();

 const editor = useEditor({
  immediatelyRender: false,
  extensions: [
   StarterKit,
   Placeholder.configure({
    placeholder: "Nhấn '/' để mở menu công cụ, hoặc bắt đầu nhập nội dung...",
   }),
   Ruby,
   SlashCommand.configure({
    suggestion,
   }),
  ],
  content: initialContent || "",
  editable: !readOnly,
  onUpdate: ({ editor }) => {
   onChange?.(editor.getJSON());
  },
  editorProps: {
   attributes: {
    class:
     "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[500px] leading-relaxed",
   },
  },
 });

 if (!editor) {
  return null;
 }

 const handleAddPinyin = () => {
  if (editor.state.selection.empty) return;

  const selectedText = editor.state.doc.textBetween(
   editor.state.selection.from,
   editor.state.selection.to,
   " ",
  );

  if (!selectedText.trim()) return;

  // Get pinyin
  const pinyinText = pinyin(selectedText); // Adjust toneType as needed

  // Replace selection with Ruby node
  editor
   .chain()
   .focus()
   .deleteSelection()
   .setRuby({ char: selectedText, pinyin: pinyinText })
   .run();
 };

 const handleSaveToVocab = async () => {
  if (editor.state.selection.empty) return;

  const selectedText = editor.state.doc
   .textBetween(editor.state.selection.from, editor.state.selection.to, " ")
   .trim();

  if (!selectedText) return;

  setIsProcessing(true);

  try {
   const {
    data: { user },
   } = await supabase.auth.getUser();
   if (!user) throw new Error("Chưa đăng nhập");

   // 1. Upsert into global vocabularies (if missing)
   const pinyinText = pinyin(selectedText);
   const { data: vocab, error: vocabError } = await supabase
    .from("vocabularies")
    .upsert(
     { hanzi: selectedText, pinyin: pinyinText, meaning: "" },
     { onConflict: "hanzi" },
    )
    .select("id")
    .single();

   if (vocabError) throw vocabError;

   if (vocab?.id) {
    // 2. Add to user progress
    const { error: userVocabError } = await supabase
     .from("user_vocab_progress")
     .upsert(
      { user_id: user.id, vocab_id: vocab.id, is_favorited: true },
      { onConflict: "user_id,vocab_id" },
     );

    if (userVocabError) throw userVocabError;

    toast.success(`Đã lưu "${selectedText}" vào Kho từ vựng!`, {
     icon: <Bot className="w-4 h-4 text-emerald-500" />,
    });
   }
  } catch (error: any) {
   console.error("Save to vocab failed:", error);
   toast.error(`Lỗi: ${error.message || "Không thể lưu từ vựng"}`);
  } finally {
   setIsProcessing(false);
  }
 };

 return (
  <div className="relative w-full h-full">
   {editor && (
    <BubbleMenu
     editor={editor}
     className="flex items-center gap-1 bg-bg-card z-50 border border-border-default shadow-theme-lg rounded-xl p-1"
    >
     <button
      onClick={() => editor.chain().focus().toggleBold().run()}
      className={`p-1.5 rounded-md hover:bg-bg-card-hover transition-colors ${editor.isActive("bold") ? "text-text-primary bg-bg-card-hover" : "text-text-muted"}`}
     >
      <Bold className="w-4 h-4" />
     </button>
     <button
      onClick={() => editor.chain().focus().toggleItalic().run()}
      className={`p-1.5 rounded-md hover:bg-bg-card-hover transition-colors ${editor.isActive("italic") ? "text-text-primary bg-bg-card-hover" : "text-text-muted"}`}
     >
      <Italic className="w-4 h-4" />
     </button>
     <button
      onClick={() => editor.chain().focus().toggleStrike().run()}
      className={`p-1.5 rounded-md hover:bg-bg-card-hover transition-colors ${editor.isActive("strike") ? "text-text-primary bg-bg-card-hover" : "text-text-muted"}`}
     >
      <Strikethrough className="w-4 h-4" />
     </button>
     <button
      onClick={() => editor.chain().focus().toggleCode().run()}
      className={`p-1.5 rounded-md hover:bg-bg-card-hover transition-colors ${editor.isActive("code") ? "text-text-primary bg-bg-card-hover" : "text-text-muted"}`}
     >
      <Code className="w-4 h-4" />
     </button>

     <div className="w-[1px] h-4 bg-border-default mx-1" />

     <button
      onClick={handleAddPinyin}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-text-primary hover:bg-accent/10 hover:text-accent rounded-md transition-colors"
     >
      <Languages className="w-4 h-4" />
      Thêm Pinyin
     </button>
     <div className="w-[1px] h-4 bg-border-default mx-1" />
     <button
      onClick={handleSaveToVocab}
      disabled={isProcessing}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-text-primary hover:bg-emerald-500/10 hover:text-emerald-500 rounded-md transition-colors disabled:opacity-50"
     >
      <Save className="w-4 h-4" />
      {isProcessing ? "Đang lưu..." : "Lưu kho từ"}
     </button>
    </BubbleMenu>
   )}

   {/* Editor Content Area */}
   <EditorContent editor={editor} className="outline-none" />
  </div>
 );
}
