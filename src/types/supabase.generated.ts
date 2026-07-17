export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
 // Allows to automatically instantiate createClient with right options
 // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
 __InternalSupabase: {
  PostgrestVersion: "14.4";
 };
 public: {
  Tables: {
   dictionary_core: {
    Row: {
     created_at: string;
     data: Json;
     headword: string;
     id: string;
     lookup_count: number;
     lookup_key: string;
     pinyin: string | null;
     sino_vietnamese: string | null;
    };
    Insert: {
     created_at?: string;
     data?: Json;
     headword: string;
     id?: string;
     lookup_count?: number;
     lookup_key: string;
     pinyin?: string | null;
     sino_vietnamese?: string | null;
    };
    Update: {
     created_at?: string;
     data?: Json;
     headword?: string;
     id?: string;
     lookup_count?: number;
     lookup_key?: string;
     pinyin?: string | null;
     sino_vietnamese?: string | null;
    };
    Relationships: [];
   };
   hanzihome_content_audit_log: {
    Row: {
     actor_id: string;
     after_data: Json | null;
     before_data: Json | null;
     created_at: string;
     entity_id: string;
     entity_type: string;
     id: string;
     operation: string;
     parent_entity_id: string | null;
     parent_entity_type: string | null;
     reason: string;
    };
    Insert: {
     actor_id: string;
     after_data?: Json | null;
     before_data?: Json | null;
     created_at?: string;
     entity_id: string;
     entity_type: string;
     id?: string;
     operation: string;
     parent_entity_id?: string | null;
     parent_entity_type?: string | null;
     reason: string;
    };
    Update: {
     actor_id?: string;
     after_data?: Json | null;
     before_data?: Json | null;
     created_at?: string;
     entity_id?: string;
     entity_type?: string;
     id?: string;
     operation?: string;
     parent_entity_id?: string | null;
     parent_entity_type?: string | null;
     reason?: string;
    };
    Relationships: [];
   };
   hanzihome_content_editors: {
    Row: {
     created_at: string;
     user_id: string;
    };
    Insert: {
     created_at?: string;
     user_id: string;
    };
    Update: {
     created_at?: string;
     user_id?: string;
    };
    Relationships: [];
   };
   hanzihome_content_roles: {
    Row: {
     created_at: string;
     role: string;
     updated_at: string;
     user_id: string;
    };
    Insert: {
     created_at?: string;
     role: string;
     updated_at?: string;
     user_id: string;
    };
    Update: {
     created_at?: string;
     role?: string;
     updated_at?: string;
     user_id?: string;
    };
    Relationships: [];
   };
   hanzihome_course_books: {
    Row: {
     book_order: number;
     course_id: string;
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     id: string;
     imported_at: string | null;
     short_title: string | null;
     source: string;
     title: string;
     updated_at: string;
     user_id: string | null;
    };
    Insert: {
     book_order?: number;
     course_id: string;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id?: string;
     imported_at?: string | null;
     short_title?: string | null;
     source?: string;
     title: string;
     updated_at?: string;
     user_id?: string | null;
    };
    Update: {
     book_order?: number;
     course_id?: string;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id?: string;
     imported_at?: string | null;
     short_title?: string | null;
     source?: string;
     title?: string;
     updated_at?: string;
     user_id?: string | null;
    };
    Relationships: [];
   };
   hanzihome_courses: {
    Row: {
     course_order: number;
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     id: string;
     imported_at: string | null;
     slug: string;
     source: string;
     subtitle: string | null;
     title: string;
     type: string;
     updated_at: string;
     user_id: string | null;
    };
    Insert: {
     course_order?: number;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id?: string;
     imported_at?: string | null;
     slug: string;
     source?: string;
     subtitle?: string | null;
     title: string;
     type?: string;
     updated_at?: string;
     user_id?: string | null;
    };
    Update: {
     course_order?: number;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id?: string;
     imported_at?: string | null;
     slug?: string;
     source?: string;
     subtitle?: string | null;
     title?: string;
     type?: string;
     updated_at?: string;
     user_id?: string | null;
    };
    Relationships: [];
   };
   hanzihome_grammar_detail_sections: {
    Row: {
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     grammar_point_id: string;
     id: string;
     imported_at: string | null;
     lesson_id: string;
     lines: string[];
     owner_id: string | null;
     section_key: string;
     section_order: number;
     source: string;
     title: string;
     updated_at: string;
    };
    Insert: {
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     grammar_point_id: string;
     id: string;
     imported_at?: string | null;
     lesson_id: string;
     lines?: string[];
     owner_id?: string | null;
     section_key: string;
     section_order: number;
     source?: string;
     title: string;
     updated_at?: string;
    };
    Update: {
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     grammar_point_id?: string;
     id?: string;
     imported_at?: string | null;
     lesson_id?: string;
     lines?: string[];
     owner_id?: string | null;
     section_key?: string;
     section_order?: number;
     source?: string;
     title?: string;
     updated_at?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_grammar_detail_sections_grammar_point_id_fkey";
      columns: ["grammar_point_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_grammar_points";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_grammar_detail_sections_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lessons";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_grammar_examples: {
    Row: {
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     example_order: number;
     grammar_point_id: string;
     id: string;
     imported_at: string | null;
     lesson_id: string;
     note: string | null;
     owner_id: string | null;
     pinyin: string | null;
     source: string;
     updated_at: string;
     vi: string | null;
     zh: string;
    };
    Insert: {
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     example_order: number;
     grammar_point_id: string;
     id: string;
     imported_at?: string | null;
     lesson_id: string;
     note?: string | null;
     owner_id?: string | null;
     pinyin?: string | null;
     source?: string;
     updated_at?: string;
     vi?: string | null;
     zh: string;
    };
    Update: {
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     example_order?: number;
     grammar_point_id?: string;
     id?: string;
     imported_at?: string | null;
     lesson_id?: string;
     note?: string | null;
     owner_id?: string | null;
     pinyin?: string | null;
     source?: string;
     updated_at?: string;
     vi?: string | null;
     zh?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_grammar_examples_grammar_point_id_fkey";
      columns: ["grammar_point_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_grammar_points";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_grammar_examples_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lessons";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_grammar_points: {
    Row: {
     book_id: string;
     clean_title: string;
     content_md: string | null;
     core: string;
     course_id: string;
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     id: string;
     imported_at: string | null;
     lesson_id: string;
     level: string | null;
     notes: string[];
     owner_id: string | null;
     point_order: number;
     source: string;
     structures_view: string[];
     tags: string[];
     title: string;
     title_vi: string | null;
     updated_at: string;
    };
    Insert: {
     book_id: string;
     clean_title: string;
     content_md?: string | null;
     core?: string;
     course_id: string;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id: string;
     imported_at?: string | null;
     lesson_id: string;
     level?: string | null;
     notes?: string[];
     owner_id?: string | null;
     point_order: number;
     source?: string;
     structures_view?: string[];
     tags?: string[];
     title: string;
     title_vi?: string | null;
     updated_at?: string;
    };
    Update: {
     book_id?: string;
     clean_title?: string;
     content_md?: string | null;
     core?: string;
     course_id?: string;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id?: string;
     imported_at?: string | null;
     lesson_id?: string;
     level?: string | null;
     notes?: string[];
     owner_id?: string | null;
     point_order?: number;
     source?: string;
     structures_view?: string[];
     tags?: string[];
     title?: string;
     title_vi?: string | null;
     updated_at?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_grammar_points_book_id_fkey";
      columns: ["book_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_course_books";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_grammar_points_course_id_fkey";
      columns: ["course_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_courses";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_grammar_points_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lessons";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_html_artifact_folders: {
    Row: {
     color: string;
     created_at: string;
     id: string;
     name: string;
     owner_id: string;
     parent_folder_id: string | null;
     position: number;
     updated_at: string;
    };
    Insert: {
     color?: string;
     created_at?: string;
     id?: string;
     name: string;
     owner_id: string;
     parent_folder_id?: string | null;
     position?: number;
     updated_at?: string;
    };
    Update: {
     color?: string;
     created_at?: string;
     id?: string;
     name?: string;
     owner_id?: string;
     parent_folder_id?: string | null;
     position?: number;
     updated_at?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_html_artifact_folders_owner_parent_fk";
      columns: ["owner_id", "parent_folder_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_html_artifact_folders";
      referencedColumns: ["owner_id", "id"];
     },
     {
      foreignKeyName: "hanzihome_html_artifact_folders_parent_folder_id_fkey";
      columns: ["parent_folder_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_html_artifact_folders";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_html_artifact_runtime_states: {
    Row: {
     artifact_id: string;
     created_at: string;
     id: string;
     owner_id: string;
     state: Json;
     updated_at: string;
    };
    Insert: {
     artifact_id: string;
     created_at?: string;
     id?: string;
     owner_id: string;
     state?: Json;
     updated_at?: string;
    };
    Update: {
     artifact_id?: string;
     created_at?: string;
     id?: string;
     owner_id?: string;
     state?: Json;
     updated_at?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_html_artifact_runtime_states_artifact_id_fkey";
      columns: ["artifact_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_html_artifacts";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_html_artifact_runtime_states_owner_artifact_fk";
      columns: ["owner_id", "artifact_id"];
      isOneToOne: true;
      referencedRelation: "hanzihome_html_artifacts";
      referencedColumns: ["owner_id", "id"];
     },
    ];
   };
   hanzihome_html_artifacts: {
    Row: {
     artifact_type: string;
     created_at: string;
     folder_id: string | null;
     html: string;
     id: string;
     owner_id: string;
     tags: string[];
     title: string;
     updated_at: string;
    };
    Insert: {
     artifact_type?: string;
     created_at?: string;
     folder_id?: string | null;
     html: string;
     id?: string;
     owner_id: string;
     tags?: string[];
     title: string;
     updated_at?: string;
    };
    Update: {
     artifact_type?: string;
     created_at?: string;
     folder_id?: string | null;
     html?: string;
     id?: string;
     owner_id?: string;
     tags?: string[];
     title?: string;
     updated_at?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_html_artifacts_folder_id_fkey";
      columns: ["folder_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_html_artifact_folders";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_import_chunks: {
    Row: {
     created_at: string;
     import_key: string;
     part: number;
     payload: string;
     total_parts: number;
    };
    Insert: {
     created_at?: string;
     import_key: string;
     part: number;
     payload: string;
     total_parts: number;
    };
    Update: {
     created_at?: string;
     import_key?: string;
     part?: number;
     payload?: string;
     total_parts?: number;
    };
    Relationships: [];
   };
   hanzihome_lesson_drafts: {
    Row: {
     content: Json;
     created_at: string;
     id: string;
     lesson_key: string;
     lesson_number: number | null;
     status: string;
     title_vi: string | null;
     title_zh: string;
     updated_at: string;
     user_id: string;
    };
    Insert: {
     content?: Json;
     created_at?: string;
     id?: string;
     lesson_key: string;
     lesson_number?: number | null;
     status?: string;
     title_vi?: string | null;
     title_zh: string;
     updated_at?: string;
     user_id: string;
    };
    Update: {
     content?: Json;
     created_at?: string;
     id?: string;
     lesson_key?: string;
     lesson_number?: number | null;
     status?: string;
     title_vi?: string | null;
     title_zh?: string;
     updated_at?: string;
     user_id?: string;
    };
    Relationships: [];
   };
   hanzihome_lesson_sections: {
    Row: {
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     id: string;
     imported_at: string | null;
     lesson_id: string;
     owner_id: string | null;
     payload: Json;
     section_key: string;
     section_order: number;
     section_type: string;
     source: string;
     source_file: string | null;
     source_section_id: string;
     title: string;
     title_vi: string;
     updated_at: string;
    };
    Insert: {
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id: string;
     imported_at?: string | null;
     lesson_id: string;
     owner_id?: string | null;
     payload: Json;
     section_key: string;
     section_order: number;
     section_type: string;
     source?: string;
     source_file?: string | null;
     source_section_id: string;
     title?: string;
     title_vi?: string;
     updated_at?: string;
    };
    Update: {
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id?: string;
     imported_at?: string | null;
     lesson_id?: string;
     owner_id?: string | null;
     payload?: Json;
     section_key?: string;
     section_order?: number;
     section_type?: string;
     source?: string;
     source_file?: string | null;
     source_section_id?: string;
     title?: string;
     title_vi?: string;
     updated_at?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_lesson_sections_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lessons";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_lesson_texts: {
    Row: {
     content: string;
     content_format: string;
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     id: string;
     imported_at: string | null;
     lesson_id: string;
     owner_id: string | null;
     source: string;
     text_key: string;
     title: string | null;
     updated_at: string;
    };
    Insert: {
     content?: string;
     content_format?: string;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id: string;
     imported_at?: string | null;
     lesson_id: string;
     owner_id?: string | null;
     source?: string;
     text_key?: string;
     title?: string | null;
     updated_at?: string;
    };
    Update: {
     content?: string;
     content_format?: string;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id?: string;
     imported_at?: string | null;
     lesson_id?: string;
     owner_id?: string | null;
     source?: string;
     text_key?: string;
     title?: string | null;
     updated_at?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_lesson_texts_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lessons";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_lessons: {
    Row: {
     book_id: string;
     course_id: string;
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     id: string;
     imported_at: string | null;
     lesson_number: number;
     lesson_order: number;
     owner_id: string | null;
     source: string;
     source_file: string | null;
     tags: string[];
     title_en: string | null;
     title_pinyin: string | null;
     title_vi: string | null;
     title_zh: string;
     updated_at: string;
    };
    Insert: {
     book_id: string;
     course_id: string;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id: string;
     imported_at?: string | null;
     lesson_number: number;
     lesson_order: number;
     owner_id?: string | null;
     source?: string;
     source_file?: string | null;
     tags?: string[];
     title_en?: string | null;
     title_pinyin?: string | null;
     title_vi?: string | null;
     title_zh: string;
     updated_at?: string;
    };
    Update: {
     book_id?: string;
     course_id?: string;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id?: string;
     imported_at?: string | null;
     lesson_number?: number;
     lesson_order?: number;
     owner_id?: string | null;
     source?: string;
     source_file?: string | null;
     tags?: string[];
     title_en?: string | null;
     title_pinyin?: string | null;
     title_vi?: string | null;
     title_zh?: string;
     updated_at?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_lessons_book_id_fkey";
      columns: ["book_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_course_books";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_lessons_course_id_fkey";
      columns: ["course_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_courses";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_listening_attempts: {
    Row: {
     answer: Json | null;
     created_at: string;
     id: string;
     is_correct: boolean | null;
     item_id: string;
     listened_count: number;
     response_ms: number | null;
     score: number | null;
     user_id: string;
    };
    Insert: {
     answer?: Json | null;
     created_at?: string;
     id?: string;
     is_correct?: boolean | null;
     item_id: string;
     listened_count?: number;
     response_ms?: number | null;
     score?: number | null;
     user_id: string;
    };
    Update: {
     answer?: Json | null;
     created_at?: string;
     id?: string;
     is_correct?: boolean | null;
     item_id?: string;
     listened_count?: number;
     response_ms?: number | null;
     score?: number | null;
     user_id?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_listening_attempts_item_id_fkey";
      columns: ["item_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_listening_items";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_listening_audio: {
    Row: {
     audio_role: string;
     created_at: string;
     deleted_at: string | null;
     duration_ms: number | null;
     external_url: string | null;
     id: string;
     item_id: string | null;
     lesson_id: string;
     metadata: Json;
     mime_type: string | null;
     owner_id: string | null;
     publication_status: string;
     section_id: string | null;
     source: string;
     speaker: string | null;
     storage_bucket: string | null;
     storage_path: string | null;
     transcript_zh: string | null;
     updated_at: string;
     variant: string | null;
    };
    Insert: {
     audio_role?: string;
     created_at?: string;
     deleted_at?: string | null;
     duration_ms?: number | null;
     external_url?: string | null;
     id?: string;
     item_id?: string | null;
     lesson_id: string;
     metadata?: Json;
     mime_type?: string | null;
     owner_id?: string | null;
     publication_status?: string;
     section_id?: string | null;
     source?: string;
     speaker?: string | null;
     storage_bucket?: string | null;
     storage_path?: string | null;
     transcript_zh?: string | null;
     updated_at?: string;
     variant?: string | null;
    };
    Update: {
     audio_role?: string;
     created_at?: string;
     deleted_at?: string | null;
     duration_ms?: number | null;
     external_url?: string | null;
     id?: string;
     item_id?: string | null;
     lesson_id?: string;
     metadata?: Json;
     mime_type?: string | null;
     owner_id?: string | null;
     publication_status?: string;
     section_id?: string | null;
     source?: string;
     speaker?: string | null;
     storage_bucket?: string | null;
     storage_path?: string | null;
     transcript_zh?: string | null;
     updated_at?: string;
     variant?: string | null;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_listening_audio_item_id_fkey";
      columns: ["item_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_listening_items";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_listening_audio_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lessons";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_listening_audio_section_id_fkey";
      columns: ["section_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lesson_sections";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_listening_item_progress: {
    Row: {
     attempt_count: number;
     bookmarked: boolean;
     correct_count: number;
     created_at: string;
     item_id: string;
     last_answer: Json | null;
     last_attempt_at: string | null;
     last_is_correct: boolean | null;
     last_position_ms: number;
     mastery_score: number;
     personal_note: string | null;
     status: string;
     updated_at: string;
     user_id: string;
    };
    Insert: {
     attempt_count?: number;
     bookmarked?: boolean;
     correct_count?: number;
     created_at?: string;
     item_id: string;
     last_answer?: Json | null;
     last_attempt_at?: string | null;
     last_is_correct?: boolean | null;
     last_position_ms?: number;
     mastery_score?: number;
     personal_note?: string | null;
     status?: string;
     updated_at?: string;
     user_id: string;
    };
    Update: {
     attempt_count?: number;
     bookmarked?: boolean;
     correct_count?: number;
     created_at?: string;
     item_id?: string;
     last_answer?: Json | null;
     last_attempt_at?: string | null;
     last_is_correct?: boolean | null;
     last_position_ms?: number;
     mastery_score?: number;
     personal_note?: string | null;
     status?: string;
     updated_at?: string;
     user_id?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_listening_item_progress_item_id_fkey";
      columns: ["item_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_listening_items";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_listening_items: {
    Row: {
     answer: Json | null;
     category: string;
     check_needed: boolean;
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     explanation_vi: string | null;
     id: string;
     imported_at: string | null;
     item_order: number;
     item_type: string;
     lesson_id: string;
     metadata: Json;
     options: Json;
     owner_id: string | null;
     prompt_zh: string | null;
     publication_status: string;
     quality_issues: string[];
     quality_status: string;
     section_id: string | null;
     section_title: string | null;
     source: string;
     source_file: string | null;
     source_item_key: string;
     tags: string[];
     transcript: Json | null;
     transcript_zh: string | null;
     translation_vi: string | null;
     updated_at: string;
    };
    Insert: {
     answer?: Json | null;
     category: string;
     check_needed?: boolean;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     explanation_vi?: string | null;
     id: string;
     imported_at?: string | null;
     item_order: number;
     item_type: string;
     lesson_id: string;
     metadata?: Json;
     options?: Json;
     owner_id?: string | null;
     prompt_zh?: string | null;
     publication_status?: string;
     quality_issues?: string[];
     quality_status?: string;
     section_id?: string | null;
     section_title?: string | null;
     source?: string;
     source_file?: string | null;
     source_item_key: string;
     tags?: string[];
     transcript?: Json | null;
     transcript_zh?: string | null;
     translation_vi?: string | null;
     updated_at?: string;
    };
    Update: {
     answer?: Json | null;
     category?: string;
     check_needed?: boolean;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     explanation_vi?: string | null;
     id?: string;
     imported_at?: string | null;
     item_order?: number;
     item_type?: string;
     lesson_id?: string;
     metadata?: Json;
     options?: Json;
     owner_id?: string | null;
     prompt_zh?: string | null;
     publication_status?: string;
     quality_issues?: string[];
     quality_status?: string;
     section_id?: string | null;
     section_title?: string | null;
     source?: string;
     source_file?: string | null;
     source_item_key?: string;
     tags?: string[];
     transcript?: Json | null;
     transcript_zh?: string | null;
     translation_vi?: string | null;
     updated_at?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_listening_items_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lessons";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_listening_items_section_id_fkey";
      columns: ["section_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lesson_sections";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_memory_tips: {
    Row: {
     body: string;
     created_at: string;
     example_pinyin: string | null;
     example_vi: string | null;
     example_zh: string | null;
     formula: string | null;
     id: string;
     is_archived: boolean;
     is_pinned: boolean;
     owner_id: string | null;
     scope: string;
     source_item_id: string | null;
     source_label: string | null;
     source_lesson_id: string | null;
     source_type: string;
     tags: string[];
     tip_type: string;
     title: string;
     updated_at: string;
     weight: number;
    };
    Insert: {
     body: string;
     created_at?: string;
     example_pinyin?: string | null;
     example_vi?: string | null;
     example_zh?: string | null;
     formula?: string | null;
     id?: string;
     is_archived?: boolean;
     is_pinned?: boolean;
     owner_id?: string | null;
     scope?: string;
     source_item_id?: string | null;
     source_label?: string | null;
     source_lesson_id?: string | null;
     source_type?: string;
     tags?: string[];
     tip_type?: string;
     title: string;
     updated_at?: string;
     weight?: number;
    };
    Update: {
     body?: string;
     created_at?: string;
     example_pinyin?: string | null;
     example_vi?: string | null;
     example_zh?: string | null;
     formula?: string | null;
     id?: string;
     is_archived?: boolean;
     is_pinned?: boolean;
     owner_id?: string | null;
     scope?: string;
     source_item_id?: string | null;
     source_label?: string | null;
     source_lesson_id?: string | null;
     source_type?: string;
     tags?: string[];
     tip_type?: string;
     title?: string;
     updated_at?: string;
     weight?: number;
    };
    Relationships: [];
   };
   hanzihome_radicals: {
    Row: {
     core_meaning: Json;
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     distinguish: string[];
     groups: Json;
     id: string;
     imported_at: string | null;
     name_vi: string | null;
     owner_id: string | null;
     radical: string;
     radical_index: number;
     recognition: string | null;
     related_components: Json;
     source: string;
     strokes: number | null;
     updated_at: string;
     variants: Json;
    };
    Insert: {
     core_meaning?: Json;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     distinguish?: string[];
     groups?: Json;
     id: string;
     imported_at?: string | null;
     name_vi?: string | null;
     owner_id?: string | null;
     radical: string;
     radical_index: number;
     recognition?: string | null;
     related_components?: Json;
     source?: string;
     strokes?: number | null;
     updated_at?: string;
     variants?: Json;
    };
    Update: {
     core_meaning?: Json;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     distinguish?: string[];
     groups?: Json;
     id?: string;
     imported_at?: string | null;
     name_vi?: string | null;
     owner_id?: string | null;
     radical?: string;
     radical_index?: number;
     recognition?: string | null;
     related_components?: Json;
     source?: string;
     strokes?: number | null;
     updated_at?: string;
     variants?: Json;
    };
    Relationships: [];
   };
   hanzihome_vocab_detail_sections: {
    Row: {
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     id: string;
     imported_at: string | null;
     lesson_id: string;
     lines: string[];
     owner_id: string | null;
     section_key: string;
     section_order: number;
     source: string;
     title: string;
     updated_at: string;
     vocab_item_id: string;
    };
    Insert: {
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id: string;
     imported_at?: string | null;
     lesson_id: string;
     lines?: string[];
     owner_id?: string | null;
     section_key: string;
     section_order: number;
     source?: string;
     title: string;
     updated_at?: string;
     vocab_item_id: string;
    };
    Update: {
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     id?: string;
     imported_at?: string | null;
     lesson_id?: string;
     lines?: string[];
     owner_id?: string | null;
     section_key?: string;
     section_order?: number;
     source?: string;
     title?: string;
     updated_at?: string;
     vocab_item_id?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_vocab_detail_sections_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lessons";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_vocab_detail_sections_vocab_item_id_fkey";
      columns: ["vocab_item_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_vocab_items";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_vocab_examples: {
    Row: {
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     example_order: number;
     id: string;
     imported_at: string | null;
     lesson_id: string;
     note: string | null;
     owner_id: string | null;
     pinyin: string | null;
     source: string;
     updated_at: string;
     vi: string | null;
     vocab_item_id: string;
     zh: string;
    };
    Insert: {
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     example_order: number;
     id: string;
     imported_at?: string | null;
     lesson_id: string;
     note?: string | null;
     owner_id?: string | null;
     pinyin?: string | null;
     source?: string;
     updated_at?: string;
     vi?: string | null;
     vocab_item_id: string;
     zh: string;
    };
    Update: {
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     example_order?: number;
     id?: string;
     imported_at?: string | null;
     lesson_id?: string;
     note?: string | null;
     owner_id?: string | null;
     pinyin?: string | null;
     source?: string;
     updated_at?: string;
     vi?: string | null;
     vocab_item_id?: string;
     zh?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_vocab_examples_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lessons";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_vocab_examples_vocab_item_id_fkey";
      columns: ["vocab_item_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_vocab_items";
      referencedColumns: ["id"];
     },
    ];
   };
   hanzihome_vocab_items: {
    Row: {
     book_id: string;
     category: string;
     course_id: string;
     created_at: string;
     deleted_at: string | null;
     deleted_by: string | null;
     han_viet: string;
     id: string;
     imported_at: string | null;
     item_order: number;
     lesson_id: string;
     level: string | null;
     meaning: string;
     meaning_en: string | null;
     owner_id: string | null;
     pinyin: string;
     pos_vi: string | null;
     pos_zh: string | null;
     source: string;
     source_file: string | null;
     tags: string[];
     tone: string | null;
     updated_at: string;
     word: string;
    };
    Insert: {
     book_id: string;
     category?: string;
     course_id: string;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     han_viet: string;
     id: string;
     imported_at?: string | null;
     item_order: number;
     lesson_id: string;
     level?: string | null;
     meaning: string;
     meaning_en?: string | null;
     owner_id?: string | null;
     pinyin: string;
     pos_vi?: string | null;
     pos_zh?: string | null;
     source?: string;
     source_file?: string | null;
     tags?: string[];
     tone?: string | null;
     updated_at?: string;
     word: string;
    };
    Update: {
     book_id?: string;
     category?: string;
     course_id?: string;
     created_at?: string;
     deleted_at?: string | null;
     deleted_by?: string | null;
     han_viet?: string;
     id?: string;
     imported_at?: string | null;
     item_order?: number;
     lesson_id?: string;
     level?: string | null;
     meaning?: string;
     meaning_en?: string | null;
     owner_id?: string | null;
     pinyin?: string;
     pos_vi?: string | null;
     pos_zh?: string | null;
     source?: string;
     source_file?: string | null;
     tags?: string[];
     tone?: string | null;
     updated_at?: string;
     word?: string;
    };
    Relationships: [
     {
      foreignKeyName: "hanzihome_vocab_items_book_id_fkey";
      columns: ["book_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_course_books";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_vocab_items_course_id_fkey";
      columns: ["course_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_courses";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "hanzihome_vocab_items_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lessons";
      referencedColumns: ["id"];
     },
    ];
   };
   lesson_note_links: {
    Row: {
     created_at: string;
     id: string;
     note_id: string;
     relation_type: string;
     target_key: string;
     target_type: string;
     updated_at: string;
     user_id: string;
    };
    Insert: {
     created_at?: string;
     id?: string;
     note_id: string;
     relation_type?: string;
     target_key: string;
     target_type: string;
     updated_at?: string;
     user_id: string;
    };
    Update: {
     created_at?: string;
     id?: string;
     note_id?: string;
     relation_type?: string;
     target_key?: string;
     target_type?: string;
     updated_at?: string;
     user_id?: string;
    };
    Relationships: [
     {
      foreignKeyName: "lesson_note_links_note_id_fkey";
      columns: ["note_id"];
      isOneToOne: false;
      referencedRelation: "notes";
      referencedColumns: ["id"];
     },
    ];
   };
   lesson_text_annotations: {
    Row: {
     created_at: string;
     end_offset: number;
     id: string;
     lesson_id: string;
     node_id: string;
     node_type: string;
     note_id: string | null;
     prefix_text: string;
     selected_text: string;
     start_offset: number;
     suffix_text: string;
     tone: string;
     updated_at: string;
     user_id: string;
    };
    Insert: {
     created_at?: string;
     end_offset: number;
     id?: string;
     lesson_id: string;
     node_id: string;
     node_type: string;
     note_id?: string | null;
     prefix_text?: string;
     selected_text: string;
     start_offset: number;
     suffix_text?: string;
     tone?: string;
     updated_at?: string;
     user_id: string;
    };
    Update: {
     created_at?: string;
     end_offset?: number;
     id?: string;
     lesson_id?: string;
     node_id?: string;
     node_type?: string;
     note_id?: string | null;
     prefix_text?: string;
     selected_text?: string;
     start_offset?: number;
     suffix_text?: string;
     tone?: string;
     updated_at?: string;
     user_id?: string;
    };
    Relationships: [
     {
      foreignKeyName: "lesson_text_annotations_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "hanzihome_lessons";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "lesson_text_annotations_note_id_fkey";
      columns: ["note_id"];
      isOneToOne: true;
      referencedRelation: "notes";
      referencedColumns: ["id"];
     },
    ];
   };
   notes: {
    Row: {
     category: string | null;
     content: Json | null;
     created_at: string | null;
     id: string;
     is_published: boolean | null;
     linked_lesson_id: string | null;
     reading_content: Json | null;
     short_id: string | null;
     split_view_enabled: boolean | null;
     status: string | null;
     tags: string[] | null;
     title: string | null;
     updated_at: string | null;
     user_id: string | null;
    };
    Insert: {
     category?: string | null;
     content?: Json | null;
     created_at?: string | null;
     id?: string;
     is_published?: boolean | null;
     linked_lesson_id?: string | null;
     reading_content?: Json | null;
     short_id?: string | null;
     split_view_enabled?: boolean | null;
     status?: string | null;
     tags?: string[] | null;
     title?: string | null;
     updated_at?: string | null;
     user_id?: string | null;
    };
    Update: {
     category?: string | null;
     content?: Json | null;
     created_at?: string | null;
     id?: string;
     is_published?: boolean | null;
     linked_lesson_id?: string | null;
     reading_content?: Json | null;
     short_id?: string | null;
     split_view_enabled?: boolean | null;
     status?: string | null;
     tags?: string[] | null;
     title?: string | null;
     updated_at?: string | null;
     user_id?: string | null;
    };
    Relationships: [
     {
      foreignKeyName: "notes_user_id_fkey";
      columns: ["user_id"];
      isOneToOne: false;
      referencedRelation: "users";
      referencedColumns: ["id"];
     },
    ];
   };
   user_ai_prompt_settings: {
    Row: {
     created_at: string;
     deepseek_api_key_encrypted: string | null;
     deepseek_enabled: boolean;
     gemini_model: string;
     sentence_lookup_prompt: string;
     updated_at: string;
     user_id: string;
     word_lookup_prompt: string;
    };
    Insert: {
     created_at?: string;
     deepseek_api_key_encrypted?: string | null;
     deepseek_enabled?: boolean;
     gemini_model?: string;
     sentence_lookup_prompt: string;
     updated_at?: string;
     user_id: string;
     word_lookup_prompt: string;
    };
    Update: {
     created_at?: string;
     deepseek_api_key_encrypted?: string | null;
     deepseek_enabled?: boolean;
     gemini_model?: string;
     sentence_lookup_prompt?: string;
     updated_at?: string;
     user_id?: string;
     word_lookup_prompt?: string;
    };
    Relationships: [
     {
      foreignKeyName: "user_ai_prompt_settings_user_id_fkey";
      columns: ["user_id"];
      isOneToOne: true;
      referencedRelation: "users";
      referencedColumns: ["id"];
     },
    ];
   };
   user_api_keys: {
    Row: {
     created_at: string;
     default_model: string | null;
     encrypted_key: string;
     id: string;
     is_active: boolean;
     label: string;
     last_validated_at: string | null;
     masked_key: string;
     priority: number;
     provider: string;
     updated_at: string;
     user_id: string;
    };
    Insert: {
     created_at?: string;
     default_model?: string | null;
     encrypted_key: string;
     id?: string;
     is_active?: boolean;
     label: string;
     last_validated_at?: string | null;
     masked_key: string;
     priority?: number;
     provider: string;
     updated_at?: string;
     user_id: string;
    };
    Update: {
     created_at?: string;
     default_model?: string | null;
     encrypted_key?: string;
     id?: string;
     is_active?: boolean;
     label?: string;
     last_validated_at?: string | null;
     masked_key?: string;
     priority?: number;
     provider?: string;
     updated_at?: string;
     user_id?: string;
    };
    Relationships: [];
   };
   user_learning_state: {
    Row: {
     bookmarks: Json;
     progress: Json;
     review_history: Json;
     settings: Json;
     updated_at: string | null;
     user_id: string;
    };
    Insert: {
     bookmarks?: Json;
     progress?: Json;
     review_history?: Json;
     settings?: Json;
     updated_at?: string | null;
     user_id: string;
    };
    Update: {
     bookmarks?: Json;
     progress?: Json;
     review_history?: Json;
     settings?: Json;
     updated_at?: string | null;
     user_id?: string;
    };
    Relationships: [];
   };
   user_vocab_progress: {
    Row: {
     context_sentence: string | null;
     context_translation: string | null;
     dictionary_id: string | null;
     is_favorited: boolean | null;
     next_review_at: string | null;
     personal_note: string | null;
     personal_note_mode: string | null;
     proficiency_level: number | null;
     user_id: string;
     vocab_id: string;
    };
    Insert: {
     context_sentence?: string | null;
     context_translation?: string | null;
     dictionary_id?: string | null;
     is_favorited?: boolean | null;
     next_review_at?: string | null;
     personal_note?: string | null;
     personal_note_mode?: string | null;
     proficiency_level?: number | null;
     user_id: string;
     vocab_id: string;
    };
    Update: {
     context_sentence?: string | null;
     context_translation?: string | null;
     dictionary_id?: string | null;
     is_favorited?: boolean | null;
     next_review_at?: string | null;
     personal_note?: string | null;
     personal_note_mode?: string | null;
     proficiency_level?: number | null;
     user_id?: string;
     vocab_id?: string;
    };
    Relationships: [
     {
      foreignKeyName: "user_vocab_progress_dictionary_id_fkey";
      columns: ["dictionary_id"];
      isOneToOne: false;
      referencedRelation: "dictionary_core";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "user_vocab_progress_user_id_fkey";
      columns: ["user_id"];
      isOneToOne: false;
      referencedRelation: "users";
      referencedColumns: ["id"];
     },
     {
      foreignKeyName: "user_vocab_progress_vocab_id_fkey";
      columns: ["vocab_id"];
      isOneToOne: false;
      referencedRelation: "vocabularies";
      referencedColumns: ["id"];
     },
    ];
   };
   user_vocabularies: {
    Row: {
     created_at: string;
     dictionary_id: string;
     user_id: string;
    };
    Insert: {
     created_at?: string;
     dictionary_id: string;
     user_id: string;
    };
    Update: {
     created_at?: string;
     dictionary_id?: string;
     user_id?: string;
    };
    Relationships: [
     {
      foreignKeyName: "user_vocabularies_dictionary_id_fkey";
      columns: ["dictionary_id"];
      isOneToOne: false;
      referencedRelation: "dictionary_core";
      referencedColumns: ["id"];
     },
    ];
   };
   users: {
    Row: {
     ai_credits: number | null;
     avatar_url: string | null;
     created_at: string | null;
     display_name: string | null;
     id: string;
     role: string | null;
     subscription_tier: string | null;
    };
    Insert: {
     ai_credits?: number | null;
     avatar_url?: string | null;
     created_at?: string | null;
     display_name?: string | null;
     id: string;
     role?: string | null;
     subscription_tier?: string | null;
    };
    Update: {
     ai_credits?: number | null;
     avatar_url?: string | null;
     created_at?: string | null;
     display_name?: string | null;
     id?: string;
     role?: string | null;
     subscription_tier?: string | null;
    };
    Relationships: [];
   };
   vocabularies: {
    Row: {
     ai_analysis: Json | null;
     analysis: Json;
     created_at: string | null;
     hanzi: string;
     id: string;
     meaning: string | null;
     pinyin: string | null;
     sino_vietnamese: string | null;
    };
    Insert: {
     ai_analysis?: Json | null;
     analysis?: Json;
     created_at?: string | null;
     hanzi: string;
     id?: string;
     meaning?: string | null;
     pinyin?: string | null;
     sino_vietnamese?: string | null;
    };
    Update: {
     ai_analysis?: Json | null;
     analysis?: Json;
     created_at?: string | null;
     hanzi?: string;
     id?: string;
     meaning?: string | null;
     pinyin?: string | null;
     sino_vietnamese?: string | null;
    };
    Relationships: [];
   };
  };
  Views: {
   [_ in never]: never;
  };
  Functions: {
   can_edit_hanzihome_content: { Args: never; Returns: boolean };
   create_lesson_text_annotation: {
    Args: {
     p_end_offset: number;
     p_lesson_id: string;
     p_node_id: string;
     p_node_type: string;
     p_note_text?: string;
     p_prefix_text?: string;
     p_selected_text: string;
     p_start_offset: number;
     p_suffix_text?: string;
    };
    Returns: string;
   };
   delete_lesson_text_annotation: {
    Args: { p_annotation_id: string };
    Returns: boolean;
   };
   generate_note_short_id: { Args: never; Returns: string };
   get_hanzihome_aggregate_grammar: {
    Args: {
     p_book_id?: string;
     p_course_id?: string;
     p_lesson_id?: string;
     p_limit?: number;
     p_q?: string;
    };
    Returns: {
     book_id: string;
     clean_title: string;
     core: string;
     course_id: string;
     id: string;
     lesson_id: string;
     lesson_number: number;
     lesson_order: number;
     lesson_title: string;
     title: string;
    }[];
   };
   get_hanzihome_aggregate_vocab: {
    Args: {
     p_book_id?: string;
     p_course_id?: string;
     p_lesson_id?: string;
     p_limit?: number;
     p_q?: string;
    };
    Returns: {
     book_id: string;
     category: string;
     course_id: string;
     han_viet: string;
     id: string;
     lesson_id: string;
     lesson_number: number;
     lesson_order: number;
     lesson_title: string;
     level: string;
     meaning: string;
     pinyin: string;
     pos_vi: string;
     pos_zh: string;
     word: string;
    }[];
   };
   hanzihome_apply_external_seed_patches: {
    Args: { p_patches: Json };
    Returns: Json;
   };
   hanzihome_import_external_seed_package: {
    Args: { p_seed: Json };
    Returns: Json;
   };
   hanzihome_mutate_content: {
    Args: {
     p_actor_id: string;
     p_audit_entity_id?: string;
     p_audit_entity_type?: string;
     p_audit_operation?: string;
     p_audit_parent_entity_id?: string;
     p_audit_parent_entity_type?: string;
     p_changes?: Json;
     p_entity_id?: string;
     p_entity_type: string;
     p_expected_updated_at?: string;
     p_operation: string;
     p_reason?: string;
    };
    Returns: Json;
   };
   hanzihome_mutate_content_as_user: {
    Args: {
     p_audit_entity_id?: string;
     p_audit_entity_type?: string;
     p_audit_operation?: string;
     p_audit_parent_entity_id?: string;
     p_audit_parent_entity_type?: string;
     p_changes?: Json;
     p_entity_id?: string;
     p_entity_type: string;
     p_expected_updated_at?: string;
     p_operation: string;
     p_reason?: string;
    };
    Returns: Json;
   };
   hanzihome_refresh_external_seed_package: {
    Args: { p_seed: Json };
    Returns: Json;
   };
   hanzihome_update_listening_item_as_user: {
    Args: {
     p_changes: Json;
     p_entity_id: string;
     p_expected_updated_at: string;
     p_reason: string;
    };
    Returns: Json;
   };
   hanzihome_update_radical_as_user: {
    Args: {
     p_changes?: Json;
     p_entity_id: string;
     p_expected_updated_at: string;
     p_reason?: string;
    };
    Returns: Json;
   };
   is_hanzihome_content_editor: { Args: never; Returns: boolean };
   update_lesson_text_annotation_note: {
    Args: { p_annotation_id: string; p_note_text: string };
    Returns: string;
   };
   upsert_legacy_vocabulary_cache: {
    Args: {
     p_analysis?: Json;
     p_hanzi: string;
     p_meaning?: string;
     p_pinyin?: string;
     p_sino_vietnamese?: string;
    };
    Returns: string;
   };
  };
  Enums: {
   [_ in never]: never;
  };
  CompositeTypes: {
   [_ in never]: never;
  };
 };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
 DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
 TableName extends (DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
 }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
     DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals;
}
 ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
    Row: infer R;
   }
   ? R
   : never
 : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
   ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
     }
     ? R
     : never
   : never;

export type TablesInsert<
 DefaultSchemaTableNameOrOptions extends
  keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
 TableName extends (DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
 }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals;
}
 ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
   }
   ? I
   : never
 : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
   ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
     }
     ? I
     : never
   : never;

export type TablesUpdate<
 DefaultSchemaTableNameOrOptions extends
  keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
 TableName extends (DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
 }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals;
}
 ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
   }
   ? U
   : never
 : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
   ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
     }
     ? U
     : never
   : never;

export type Enums<
 DefaultSchemaEnumNameOrOptions extends
  keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
 EnumName extends (DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
 }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals;
}
 ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
 : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
   ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
   : never;

export type CompositeTypes<
 PublicCompositeTypeNameOrOptions extends
  keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
 CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
 }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals;
}
 ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
 : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
   ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
   : never;

export const Constants = {
 public: {
  Enums: {},
 },
} as const;
