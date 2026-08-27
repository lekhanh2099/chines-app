export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ai_characters: {
        Row: {
          age: number | null
          archived_at: string | null
          background: string
          city: string
          created_at: string
          display_name: string
          id: string
          identity_notes: string
          interests: string[]
          personality: string
          speaking_style: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          archived_at?: string | null
          background?: string
          city?: string
          created_at?: string
          display_name: string
          id?: string
          identity_notes?: string
          interests?: string[]
          personality?: string
          speaking_style?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          archived_at?: string | null
          background?: string
          city?: string
          created_at?: string
          display_name?: string
          id?: string
          identity_notes?: string
          interests?: string[]
          personality?: string
          speaking_style?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversation_preferences: {
        Row: {
          created_at: string
          default_character_id: string | null
          default_correction_style: string
          default_mode: string
          default_reply_mode: string
          learner_level: string
          memory_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_character_id?: string | null
          default_correction_style?: string
          default_mode?: string
          default_reply_mode?: string
          learner_level?: string
          memory_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_character_id?: string | null
          default_correction_style?: string
          default_mode?: string
          default_reply_mode?: string
          learner_level?: string
          memory_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_preferences_default_character_fk"
            columns: ["default_character_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_characters"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          archived_at: string | null
          character_id: string
          correction_style: string
          created_at: string
          id: string
          last_message_at: string | null
          last_message_seq: number
          memory_policy: string
          mode: string
          reply_mode: string
          summary: string
          summary_until_seq: number
          summary_version: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          character_id: string
          correction_style: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_seq?: number
          memory_policy?: string
          mode: string
          reply_mode: string
          summary?: string
          summary_until_seq?: number
          summary_version?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          character_id?: string
          correction_style?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_seq?: number
          memory_policy?: string
          mode?: string
          reply_mode?: string
          summary?: string
          summary_until_seq?: number
          summary_version?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_character_fk"
            columns: ["character_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_characters"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ai_memories: {
        Row: {
          character_id: string | null
          confidence: number
          content: string
          created_at: string
          embedding: string | null
          embedding_model: string | null
          embedding_version: number | null
          id: string
          importance: number
          kind: string
          last_recalled_at: string | null
          last_reinforced_at: string
          memory_key: string | null
          reinforcement_count: number
          status: string
          superseded_by_id: string | null
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          character_id?: string | null
          confidence: number
          content: string
          created_at?: string
          embedding?: string | null
          embedding_model?: string | null
          embedding_version?: number | null
          id?: string
          importance: number
          kind: string
          last_recalled_at?: string | null
          last_reinforced_at?: string
          memory_key?: string | null
          reinforcement_count?: number
          status?: string
          superseded_by_id?: string | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          character_id?: string | null
          confidence?: number
          content?: string
          created_at?: string
          embedding?: string | null
          embedding_model?: string | null
          embedding_version?: number | null
          id?: string
          importance?: number
          kind?: string
          last_recalled_at?: string | null
          last_reinforced_at?: string
          memory_key?: string | null
          reinforcement_count?: number
          status?: string
          superseded_by_id?: string | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_memories_character_fk"
            columns: ["character_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_characters"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "ai_memories_superseded_by_fk"
            columns: ["superseded_by_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_memories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ai_memory_evidence: {
        Row: {
          action: string
          created_at: string
          memory_id: string
          message_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          memory_id: string
          message_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          memory_id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_memory_evidence_memory_fk"
            columns: ["memory_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_memories"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "ai_memory_evidence_message_fk"
            columns: ["message_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          client_message_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          reply_to_message_id: string | null
          role: string
          seq: number
          user_id: string
        }
        Insert: {
          client_message_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          reply_to_message_id?: string | null
          role: string
          seq: number
          user_id: string
        }
        Update: {
          client_message_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          reply_to_message_id?: string | null
          role?: string
          seq?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_fk"
            columns: ["conversation_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "ai_messages_reply_to_fk"
            columns: ["reply_to_message_id", "conversation_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id", "conversation_id", "user_id"]
          },
        ]
      }
      ai_post_turn_jobs: {
        Row: {
          assistant_message_id: string
          attempt_count: number
          available_at: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          id: string
          kind: string
          last_error: string | null
          locked_at: string | null
          memory_applied_at: string | null
          relationship_applied_at: string | null
          status: string
          summary_applied_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_message_id: string
          attempt_count?: number
          available_at?: string
          completed_at?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          locked_at?: string | null
          memory_applied_at?: string | null
          relationship_applied_at?: string | null
          status?: string
          summary_applied_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_message_id?: string
          attempt_count?: number
          available_at?: string
          completed_at?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          locked_at?: string | null
          memory_applied_at?: string | null
          relationship_applied_at?: string | null
          status?: string
          summary_applied_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_post_turn_jobs_assistant_message_fk"
            columns: ["assistant_message_id", "conversation_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id", "conversation_id", "user_id"]
          },
          {
            foreignKeyName: "ai_post_turn_jobs_conversation_fk"
            columns: ["conversation_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ai_relationship_states: {
        Row: {
          character_id: string
          created_at: string
          familiarity_score: number
          nickname: string
          revision: number
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          familiarity_score?: number
          nickname?: string
          revision?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          familiarity_score?: number
          nickname?: string
          revision?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_relationship_states_character_fk"
            columns: ["character_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_characters"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      dictionary_core: {
        Row: {
          created_at: string
          data: Json
          headword: string
          id: string
          lookup_count: number
          lookup_key: string
          pinyin: string | null
          sino_vietnamese: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          headword: string
          id?: string
          lookup_count?: number
          lookup_key: string
          pinyin?: string | null
          sino_vietnamese?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          headword?: string
          id?: string
          lookup_count?: number
          lookup_key?: string
          pinyin?: string | null
          sino_vietnamese?: string | null
        }
        Relationships: []
      }
      hanzihome_content_audit_log: {
        Row: {
          actor_id: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          operation: string
          parent_entity_id: string | null
          parent_entity_type: string | null
          reason: string
        }
        Insert: {
          actor_id: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          operation: string
          parent_entity_id?: string | null
          parent_entity_type?: string | null
          reason: string
        }
        Update: {
          actor_id?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          operation?: string
          parent_entity_id?: string | null
          parent_entity_type?: string | null
          reason?: string
        }
        Relationships: []
      }
      hanzihome_content_editors: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hanzihome_content_roles: {
        Row: {
          created_at: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hanzihome_course_books: {
        Row: {
          book_order: number
          course_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          imported_at: string | null
          short_title: string | null
          source: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          book_order?: number
          course_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          imported_at?: string | null
          short_title?: string | null
          source?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          book_order?: number
          course_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          imported_at?: string | null
          short_title?: string | null
          source?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      hanzihome_courses: {
        Row: {
          course_order: number
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          imported_at: string | null
          slug: string
          source: string
          subtitle: string | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          course_order?: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          imported_at?: string | null
          slug: string
          source?: string
          subtitle?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          course_order?: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          imported_at?: string | null
          slug?: string
          source?: string
          subtitle?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      hanzihome_daily_reading_state: {
        Row: {
          created_at: string
          published_date: string
          revision: number
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          published_date: string
          revision?: number
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          published_date?: string
          revision?: number
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hanzihome_grammar_detail_sections: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          grammar_point_id: string
          id: string
          imported_at: string | null
          lesson_id: string
          lines: string[]
          owner_id: string | null
          section_key: string
          section_order: number
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          grammar_point_id: string
          id: string
          imported_at?: string | null
          lesson_id: string
          lines?: string[]
          owner_id?: string | null
          section_key: string
          section_order: number
          source?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          grammar_point_id?: string
          id?: string
          imported_at?: string | null
          lesson_id?: string
          lines?: string[]
          owner_id?: string | null
          section_key?: string
          section_order?: number
          source?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_grammar_detail_sections_grammar_point_id_fkey"
            columns: ["grammar_point_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_grammar_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_grammar_detail_sections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_grammar_examples: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          example_order: number
          grammar_point_id: string
          id: string
          imported_at: string | null
          lesson_id: string
          note: string | null
          owner_id: string | null
          pinyin: string | null
          source: string
          updated_at: string
          vi: string | null
          zh: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          example_order: number
          grammar_point_id: string
          id: string
          imported_at?: string | null
          lesson_id: string
          note?: string | null
          owner_id?: string | null
          pinyin?: string | null
          source?: string
          updated_at?: string
          vi?: string | null
          zh: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          example_order?: number
          grammar_point_id?: string
          id?: string
          imported_at?: string | null
          lesson_id?: string
          note?: string | null
          owner_id?: string | null
          pinyin?: string | null
          source?: string
          updated_at?: string
          vi?: string | null
          zh?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_grammar_examples_grammar_point_id_fkey"
            columns: ["grammar_point_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_grammar_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_grammar_examples_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_grammar_points: {
        Row: {
          book_id: string
          clean_title: string
          content_md: string | null
          core: string
          course_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          imported_at: string | null
          lesson_id: string
          level: string | null
          notes: string[]
          owner_id: string | null
          point_order: number
          source: string
          structures_view: string[]
          tags: string[]
          title: string
          title_vi: string | null
          updated_at: string
        }
        Insert: {
          book_id: string
          clean_title: string
          content_md?: string | null
          core?: string
          course_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id: string
          imported_at?: string | null
          lesson_id: string
          level?: string | null
          notes?: string[]
          owner_id?: string | null
          point_order: number
          source?: string
          structures_view?: string[]
          tags?: string[]
          title: string
          title_vi?: string | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          clean_title?: string
          content_md?: string | null
          core?: string
          course_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          imported_at?: string | null
          lesson_id?: string
          level?: string | null
          notes?: string[]
          owner_id?: string | null
          point_order?: number
          source?: string
          structures_view?: string[]
          tags?: string[]
          title?: string
          title_vi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_grammar_points_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_course_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_grammar_points_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_grammar_points_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_html_artifact_folders: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          owner_id: string
          parent_folder_id: string | null
          position: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          owner_id: string
          parent_folder_id?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          parent_folder_id?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_html_artifact_folders_owner_parent_fk"
            columns: ["owner_id", "parent_folder_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_html_artifact_folders"
            referencedColumns: ["owner_id", "id"]
          },
          {
            foreignKeyName: "hanzihome_html_artifact_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_html_artifact_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_html_artifact_runtime_states: {
        Row: {
          artifact_id: string
          created_at: string
          id: string
          owner_id: string
          state: Json
          updated_at: string
        }
        Insert: {
          artifact_id: string
          created_at?: string
          id?: string
          owner_id: string
          state?: Json
          updated_at?: string
        }
        Update: {
          artifact_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          state?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_html_artifact_runtime_states_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_html_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_html_artifact_runtime_states_owner_artifact_fk"
            columns: ["owner_id", "artifact_id"]
            isOneToOne: true
            referencedRelation: "hanzihome_html_artifacts"
            referencedColumns: ["owner_id", "id"]
          },
        ]
      }
      hanzihome_html_artifacts: {
        Row: {
          artifact_type: string
          created_at: string
          folder_id: string | null
          html: string
          id: string
          owner_id: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          artifact_type?: string
          created_at?: string
          folder_id?: string | null
          html: string
          id?: string
          owner_id: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          artifact_type?: string
          created_at?: string
          folder_id?: string | null
          html?: string
          id?: string
          owner_id?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_html_artifacts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_html_artifact_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_learning_loop_items: {
        Row: {
          correct_streak: number
          created_at: string
          due_at: string
          error_key: string
          id: string
          interval_days: number
          kind: string
          lapse_count: number
          meaning_vi: string
          pinyin: string
          prompt_zh: string
          revision: number
          source_href: string
          source_id: string
          stable_key: string
          state: string
          title_vi: string
          title_zh: string
          updated_at: string
          user_answer: string
          user_id: string
        }
        Insert: {
          correct_streak?: number
          created_at?: string
          due_at: string
          error_key?: string
          id: string
          interval_days?: number
          kind: string
          lapse_count?: number
          meaning_vi?: string
          pinyin?: string
          prompt_zh: string
          revision?: number
          source_href: string
          source_id: string
          stable_key: string
          state: string
          title_vi?: string
          title_zh?: string
          updated_at?: string
          user_answer?: string
          user_id: string
        }
        Update: {
          correct_streak?: number
          created_at?: string
          due_at?: string
          error_key?: string
          id?: string
          interval_days?: number
          kind?: string
          lapse_count?: number
          meaning_vi?: string
          pinyin?: string
          prompt_zh?: string
          revision?: number
          source_href?: string
          source_id?: string
          stable_key?: string
          state?: string
          title_vi?: string
          title_zh?: string
          updated_at?: string
          user_answer?: string
          user_id?: string
        }
        Relationships: []
      }
      hanzihome_lesson_sections: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          imported_at: string | null
          lesson_id: string
          owner_id: string | null
          payload: Json
          section_key: string
          section_order: number
          section_type: string
          source: string
          source_file: string | null
          source_section_id: string
          title: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id: string
          imported_at?: string | null
          lesson_id: string
          owner_id?: string | null
          payload: Json
          section_key: string
          section_order: number
          section_type: string
          source?: string
          source_file?: string | null
          source_section_id: string
          title?: string
          title_vi?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          imported_at?: string | null
          lesson_id?: string
          owner_id?: string | null
          payload?: Json
          section_key?: string
          section_order?: number
          section_type?: string
          source?: string
          source_file?: string | null
          source_section_id?: string
          title?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_lesson_sections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_lesson_texts: {
        Row: {
          content: string
          content_format: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          imported_at: string | null
          lesson_id: string
          owner_id: string | null
          source: string
          text_key: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string
          content_format?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id: string
          imported_at?: string | null
          lesson_id: string
          owner_id?: string | null
          source?: string
          text_key?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          content_format?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          imported_at?: string | null
          lesson_id?: string
          owner_id?: string | null
          source?: string
          text_key?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_lesson_texts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_lessons: {
        Row: {
          book_id: string
          course_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          imported_at: string | null
          lesson_number: number
          lesson_order: number
          owner_id: string | null
          source: string
          source_file: string | null
          tags: string[]
          title_en: string | null
          title_pinyin: string | null
          title_vi: string | null
          title_zh: string
          updated_at: string
        }
        Insert: {
          book_id: string
          course_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id: string
          imported_at?: string | null
          lesson_number: number
          lesson_order: number
          owner_id?: string | null
          source?: string
          source_file?: string | null
          tags?: string[]
          title_en?: string | null
          title_pinyin?: string | null
          title_vi?: string | null
          title_zh: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          course_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          imported_at?: string | null
          lesson_number?: number
          lesson_order?: number
          owner_id?: string | null
          source?: string
          source_file?: string | null
          tags?: string[]
          title_en?: string | null
          title_pinyin?: string | null
          title_vi?: string | null
          title_zh?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_lessons_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_course_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_listening_audio: {
        Row: {
          audio_role: string
          created_at: string
          deleted_at: string | null
          duration_ms: number | null
          external_url: string | null
          id: string
          item_id: string | null
          lesson_id: string
          metadata: Json
          mime_type: string | null
          owner_id: string | null
          publication_status: string
          section_id: string | null
          source: string
          speaker: string | null
          storage_bucket: string | null
          storage_path: string | null
          transcript_zh: string | null
          updated_at: string
          variant: string | null
        }
        Insert: {
          audio_role?: string
          created_at?: string
          deleted_at?: string | null
          duration_ms?: number | null
          external_url?: string | null
          id?: string
          item_id?: string | null
          lesson_id: string
          metadata?: Json
          mime_type?: string | null
          owner_id?: string | null
          publication_status?: string
          section_id?: string | null
          source?: string
          speaker?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          transcript_zh?: string | null
          updated_at?: string
          variant?: string | null
        }
        Update: {
          audio_role?: string
          created_at?: string
          deleted_at?: string | null
          duration_ms?: number | null
          external_url?: string | null
          id?: string
          item_id?: string | null
          lesson_id?: string
          metadata?: Json
          mime_type?: string | null
          owner_id?: string | null
          publication_status?: string
          section_id?: string | null
          source?: string
          speaker?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          transcript_zh?: string | null
          updated_at?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_listening_audio_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_listening_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_listening_audio_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_listening_audio_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lesson_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_listening_items: {
        Row: {
          answer: Json | null
          category: string
          check_needed: boolean
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          explanation_vi: string | null
          id: string
          imported_at: string | null
          item_order: number
          item_type: string
          lesson_id: string
          metadata: Json
          options: Json
          owner_id: string | null
          prompt_zh: string | null
          publication_status: string
          quality_issues: string[]
          quality_status: string
          section_id: string | null
          section_title: string | null
          source: string
          source_file: string | null
          source_item_key: string
          tags: string[]
          transcript: Json | null
          transcript_zh: string | null
          translation_vi: string | null
          updated_at: string
        }
        Insert: {
          answer?: Json | null
          category: string
          check_needed?: boolean
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          explanation_vi?: string | null
          id: string
          imported_at?: string | null
          item_order: number
          item_type: string
          lesson_id: string
          metadata?: Json
          options?: Json
          owner_id?: string | null
          prompt_zh?: string | null
          publication_status?: string
          quality_issues?: string[]
          quality_status?: string
          section_id?: string | null
          section_title?: string | null
          source?: string
          source_file?: string | null
          source_item_key: string
          tags?: string[]
          transcript?: Json | null
          transcript_zh?: string | null
          translation_vi?: string | null
          updated_at?: string
        }
        Update: {
          answer?: Json | null
          category?: string
          check_needed?: boolean
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          explanation_vi?: string | null
          id?: string
          imported_at?: string | null
          item_order?: number
          item_type?: string
          lesson_id?: string
          metadata?: Json
          options?: Json
          owner_id?: string | null
          prompt_zh?: string | null
          publication_status?: string
          quality_issues?: string[]
          quality_status?: string
          section_id?: string | null
          section_title?: string | null
          source?: string
          source_file?: string | null
          source_item_key?: string
          tags?: string[]
          transcript?: Json | null
          transcript_zh?: string | null
          translation_vi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_listening_items_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_listening_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lesson_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_memory_tips: {
        Row: {
          body: string
          created_at: string
          example_pinyin: string | null
          example_vi: string | null
          example_zh: string | null
          formula: string | null
          id: string
          is_archived: boolean
          is_pinned: boolean
          owner_id: string | null
          scope: string
          source_item_id: string | null
          source_label: string | null
          source_lesson_id: string | null
          source_type: string
          tags: string[]
          tip_type: string
          title: string
          updated_at: string
          weight: number
        }
        Insert: {
          body: string
          created_at?: string
          example_pinyin?: string | null
          example_vi?: string | null
          example_zh?: string | null
          formula?: string | null
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          owner_id?: string | null
          scope?: string
          source_item_id?: string | null
          source_label?: string | null
          source_lesson_id?: string | null
          source_type?: string
          tags?: string[]
          tip_type?: string
          title: string
          updated_at?: string
          weight?: number
        }
        Update: {
          body?: string
          created_at?: string
          example_pinyin?: string | null
          example_vi?: string | null
          example_zh?: string | null
          formula?: string | null
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          owner_id?: string | null
          scope?: string
          source_item_id?: string | null
          source_label?: string | null
          source_lesson_id?: string | null
          source_type?: string
          tags?: string[]
          tip_type?: string
          title?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      hanzihome_pdf_annotations: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          page_number: number
          payload: Json
          revision: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          page_number: number
          payload?: Json
          revision?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          page_number?: number
          payload?: Json
          revision?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hanzihome_personal_learning_state: {
        Row: {
          created_at: string
          node_id: string
          revision: number
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          node_id: string
          revision?: number
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          node_id?: string
          revision?: number
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hanzihome_practice_attempts: {
        Row: {
          answer: Json
          content_id: string
          created_at: string
          direction: string | null
          id: string
          response_ms: number | null
          score: number | null
          surface: string
          user_id: string
        }
        Insert: {
          answer?: Json
          content_id: string
          created_at?: string
          direction?: string | null
          id?: string
          response_ms?: number | null
          score?: number | null
          surface: string
          user_id: string
        }
        Update: {
          answer?: Json
          content_id?: string
          created_at?: string
          direction?: string | null
          id?: string
          response_ms?: number | null
          score?: number | null
          surface?: string
          user_id?: string
        }
        Relationships: []
      }
      hanzihome_radicals: {
        Row: {
          core_meaning: Json
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          distinguish: string[]
          groups: Json
          id: string
          imported_at: string | null
          name_vi: string | null
          owner_id: string | null
          radical: string
          radical_index: number
          recognition: string | null
          related_components: Json
          source: string
          strokes: number | null
          updated_at: string
          variants: Json
        }
        Insert: {
          core_meaning?: Json
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          distinguish?: string[]
          groups?: Json
          id: string
          imported_at?: string | null
          name_vi?: string | null
          owner_id?: string | null
          radical: string
          radical_index: number
          recognition?: string | null
          related_components?: Json
          source?: string
          strokes?: number | null
          updated_at?: string
          variants?: Json
        }
        Update: {
          core_meaning?: Json
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          distinguish?: string[]
          groups?: Json
          id?: string
          imported_at?: string | null
          name_vi?: string | null
          owner_id?: string | null
          radical?: string
          radical_index?: number
          recognition?: string | null
          related_components?: Json
          source?: string
          strokes?: number | null
          updated_at?: string
          variants?: Json
        }
        Relationships: []
      }
      hanzihome_reader_annotations: {
        Row: {
          annotation_type: string
          asset_id: string | null
          color: string
          created_at: string
          deleted_at: string | null
          document_id: string
          end_offset: number | null
          id: string
          note_text: string
          page_number: number | null
          paragraph_id: string | null
          payload: Json
          revision: number
          selected_text: string
          start_offset: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annotation_type: string
          asset_id?: string | null
          color?: string
          created_at?: string
          deleted_at?: string | null
          document_id: string
          end_offset?: number | null
          id?: string
          note_text?: string
          page_number?: number | null
          paragraph_id?: string | null
          payload?: Json
          revision?: number
          selected_text?: string
          start_offset?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annotation_type?: string
          asset_id?: string | null
          color?: string
          created_at?: string
          deleted_at?: string | null
          document_id?: string
          end_offset?: number | null
          id?: string
          note_text?: string
          page_number?: number | null
          paragraph_id?: string | null
          payload?: Json
          revision?: number
          selected_text?: string
          start_offset?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hanzihome_reader_progress: {
        Row: {
          answers: Json
          completed: boolean
          created_at: string
          document_id: string
          revision: number
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          completed?: boolean
          created_at?: string
          document_id: string
          revision?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          completed?: boolean
          created_at?: string
          document_id?: string
          revision?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hanzihome_reader_pronunciation_overrides: {
        Row: {
          created_at: string
          document_id: string
          end_offset: number | null
          id: string
          paragraph_id: string
          readings: string[]
          revision: number
          scope: string
          sentence_text: string | null
          start_offset: number | null
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          end_offset?: number | null
          id?: string
          paragraph_id: string
          readings: string[]
          revision?: number
          scope: string
          sentence_text?: string | null
          start_offset?: number | null
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          end_offset?: number | null
          id?: string
          paragraph_id?: string
          readings?: string[]
          revision?: number
          scope?: string
          sentence_text?: string | null
          start_offset?: number | null
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hanzihome_tts_clips: {
        Row: {
          cache_key: string
          created_at: string
          folder_id: string | null
          id: string
          rate: number
          revision: number
          text: string
          title: string
          updated_at: string
          user_id: string
          voice: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          folder_id?: string | null
          id?: string
          rate: number
          revision?: number
          text: string
          title?: string
          updated_at?: string
          user_id: string
          voice: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          folder_id?: string | null
          id?: string
          rate?: number
          revision?: number
          text?: string
          title?: string
          updated_at?: string
          user_id?: string
          voice?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_tts_clips_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_tts_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_tts_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          revision: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          revision?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          revision?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hanzihome_vocab_detail_sections: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          imported_at: string | null
          lesson_id: string
          lines: string[]
          owner_id: string | null
          section_key: string
          section_order: number
          source: string
          title: string
          updated_at: string
          vocab_item_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id: string
          imported_at?: string | null
          lesson_id: string
          lines?: string[]
          owner_id?: string | null
          section_key: string
          section_order: number
          source?: string
          title: string
          updated_at?: string
          vocab_item_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          imported_at?: string | null
          lesson_id?: string
          lines?: string[]
          owner_id?: string | null
          section_key?: string
          section_order?: number
          source?: string
          title?: string
          updated_at?: string
          vocab_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_vocab_detail_sections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_vocab_detail_sections_vocab_item_id_fkey"
            columns: ["vocab_item_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_vocab_items"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_vocab_examples: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          example_order: number
          id: string
          imported_at: string | null
          lesson_id: string
          note: string | null
          owner_id: string | null
          pinyin: string | null
          source: string
          updated_at: string
          vi: string | null
          vocab_item_id: string
          zh: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          example_order: number
          id: string
          imported_at?: string | null
          lesson_id: string
          note?: string | null
          owner_id?: string | null
          pinyin?: string | null
          source?: string
          updated_at?: string
          vi?: string | null
          vocab_item_id: string
          zh: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          example_order?: number
          id?: string
          imported_at?: string | null
          lesson_id?: string
          note?: string | null
          owner_id?: string | null
          pinyin?: string | null
          source?: string
          updated_at?: string
          vi?: string | null
          vocab_item_id?: string
          zh?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_vocab_examples_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_vocab_examples_vocab_item_id_fkey"
            columns: ["vocab_item_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_vocab_items"
            referencedColumns: ["id"]
          },
        ]
      }
      hanzihome_vocab_items: {
        Row: {
          book_id: string
          category: string
          course_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          han_viet: string
          id: string
          imported_at: string | null
          item_order: number
          lesson_id: string
          level: string | null
          meaning: string
          meaning_en: string | null
          owner_id: string | null
          pinyin: string
          pos_vi: string | null
          pos_zh: string | null
          source: string
          source_file: string | null
          tags: string[]
          tone: string | null
          updated_at: string
          word: string
        }
        Insert: {
          book_id: string
          category?: string
          course_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          han_viet: string
          id: string
          imported_at?: string | null
          item_order: number
          lesson_id: string
          level?: string | null
          meaning: string
          meaning_en?: string | null
          owner_id?: string | null
          pinyin: string
          pos_vi?: string | null
          pos_zh?: string | null
          source?: string
          source_file?: string | null
          tags?: string[]
          tone?: string | null
          updated_at?: string
          word: string
        }
        Update: {
          book_id?: string
          category?: string
          course_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          han_viet?: string
          id?: string
          imported_at?: string | null
          item_order?: number
          lesson_id?: string
          level?: string | null
          meaning?: string
          meaning_en?: string | null
          owner_id?: string | null
          pinyin?: string
          pos_vi?: string | null
          pos_zh?: string | null
          source?: string
          source_file?: string | null
          tags?: string[]
          tone?: string | null
          updated_at?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "hanzihome_vocab_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_course_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_vocab_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hanzihome_vocab_items_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_note_links: {
        Row: {
          created_at: string
          id: string
          note_id: string
          relation_type: string
          target_key: string
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          relation_type?: string
          target_key: string
          target_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          relation_type?: string
          target_key?: string
          target_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_note_links_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_text_annotations: {
        Row: {
          created_at: string
          end_offset: number
          id: string
          lesson_id: string
          node_id: string
          node_type: string
          note_id: string | null
          prefix_text: string
          selected_text: string
          start_offset: number
          suffix_text: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_offset: number
          id?: string
          lesson_id: string
          node_id: string
          node_type: string
          note_id?: string | null
          prefix_text?: string
          selected_text: string
          start_offset: number
          suffix_text?: string
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_offset?: number
          id?: string
          lesson_id?: string
          node_id?: string
          node_type?: string
          note_id?: string | null
          prefix_text?: string
          selected_text?: string
          start_offset?: number
          suffix_text?: string
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_text_annotations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "hanzihome_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_text_annotations_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_folders: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_folders_user_parent_fk"
            columns: ["user_id", "parent_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      notes: {
        Row: {
          category: string | null
          content: Json | null
          created_at: string | null
          folder_id: string | null
          id: string
          is_published: boolean | null
          linked_lesson_id: string | null
          reading_content: Json | null
          reading_status: string | null
          short_id: string | null
          source_author: string | null
          source_captured_at: string | null
          source_host: string | null
          source_label: string | null
          source_published_at: string | null
          source_url: string | null
          split_view_enabled: boolean | null
          status: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          folder_id?: string | null
          id?: string
          is_published?: boolean | null
          linked_lesson_id?: string | null
          reading_content?: Json | null
          reading_status?: string | null
          short_id?: string | null
          source_author?: string | null
          source_captured_at?: string | null
          source_host?: string | null
          source_label?: string | null
          source_published_at?: string | null
          source_url?: string | null
          split_view_enabled?: boolean | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: Json | null
          created_at?: string | null
          folder_id?: string | null
          id?: string
          is_published?: boolean | null
          linked_lesson_id?: string | null
          reading_content?: Json | null
          reading_status?: string | null
          short_id?: string | null
          source_author?: string | null
          source_captured_at?: string | null
          source_host?: string | null
          source_label?: string | null
          source_published_at?: string | null
          source_url?: string | null
          split_view_enabled?: boolean | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_folder_fk"
            columns: ["user_id", "folder_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_activity_events: {
        Row: {
          api_key_id: string | null
          created_at: string
          error_code: string | null
          id: string
          input_tokens: number | null
          key_label: string | null
          latency_ms: number | null
          model: string | null
          output_tokens: number | null
          provider: string | null
          resolution_source: string | null
          resource_id: string | null
          resource_type: string | null
          status: string
          task_id: string
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          input_tokens?: number | null
          key_label?: string | null
          latency_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          resolution_source?: string | null
          resource_id?: string | null
          resource_type?: string | null
          status: string
          task_id: string
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          input_tokens?: number | null
          key_label?: string | null
          latency_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          resolution_source?: string | null
          resource_id?: string | null
          resource_type?: string | null
          status?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_activity_events_user_api_key_fkey"
            columns: ["user_id", "api_key_id"]
            isOneToOne: false
            referencedRelation: "user_api_keys"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_ai_prompt_settings: {
        Row: {
          created_at: string
          deepseek_api_key_encrypted: string | null
          deepseek_enabled: boolean
          gemini_model: string
          sentence_lookup_prompt: string
          updated_at: string
          user_id: string
          word_lookup_prompt: string
        }
        Insert: {
          created_at?: string
          deepseek_api_key_encrypted?: string | null
          deepseek_enabled?: boolean
          gemini_model?: string
          sentence_lookup_prompt: string
          updated_at?: string
          user_id: string
          word_lookup_prompt: string
        }
        Update: {
          created_at?: string
          deepseek_api_key_encrypted?: string | null
          deepseek_enabled?: boolean
          gemini_model?: string
          sentence_lookup_prompt?: string
          updated_at?: string
          user_id?: string
          word_lookup_prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_prompt_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_task_assignments: {
        Row: {
          api_key_id: string | null
          created_at: string
          mode: string
          model: string | null
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          mode?: string
          model?: string | null
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          mode?: string
          model?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_task_assignments_user_api_key_fkey"
            columns: ["user_id", "api_key_id"]
            isOneToOne: false
            referencedRelation: "user_api_keys"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          created_at: string
          default_model: string | null
          encrypted_key: string
          id: string
          is_active: boolean
          label: string
          last_validated_at: string | null
          masked_key: string
          priority: number
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_model?: string | null
          encrypted_key: string
          id?: string
          is_active?: boolean
          label: string
          last_validated_at?: string | null
          masked_key: string
          priority?: number
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_model?: string | null
          encrypted_key?: string
          id?: string
          is_active?: boolean
          label?: string
          last_validated_at?: string | null
          masked_key?: string
          priority?: number
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_reading_enrichment_jobs: {
        Row: {
          api_key_id: string | null
          article_fingerprint: string
          article_id: string
          completed_at: string | null
          created_at: string
          error_code: string | null
          expires_at: string
          heartbeat_at: string
          id: string
          key_label: string | null
          model: string | null
          module: string
          progress_completed: number
          progress_total: number
          provider: string | null
          resolution_source: string | null
          result: Json | null
          run_id: string
          started_at: string | null
          status: string
          task_id: string
          user_id: string
          workflow_run_id: string | null
        }
        Insert: {
          api_key_id?: string | null
          article_fingerprint: string
          article_id: string
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          expires_at?: string
          heartbeat_at?: string
          id?: string
          key_label?: string | null
          model?: string | null
          module: string
          progress_completed?: number
          progress_total?: number
          provider?: string | null
          resolution_source?: string | null
          result?: Json | null
          run_id: string
          started_at?: string | null
          status?: string
          task_id: string
          user_id: string
          workflow_run_id?: string | null
        }
        Update: {
          api_key_id?: string | null
          article_fingerprint?: string
          article_id?: string
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          expires_at?: string
          heartbeat_at?: string
          id?: string
          key_label?: string | null
          model?: string | null
          module?: string
          progress_completed?: number
          progress_total?: number
          provider?: string | null
          resolution_source?: string | null
          result?: Json | null
          run_id?: string
          started_at?: string | null
          status?: string
          task_id?: string
          user_id?: string
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_reading_enrichment_jobs_user_api_key_fkey"
            columns: ["user_id", "api_key_id"]
            isOneToOne: false
            referencedRelation: "user_api_keys"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_learning_state: {
        Row: {
          bookmarks: Json
          progress: Json
          review_history: Json
          settings: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bookmarks?: Json
          progress?: Json
          review_history?: Json
          settings?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bookmarks?: Json
          progress?: Json
          review_history?: Json
          settings?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_vocab_progress: {
        Row: {
          context_sentence: string | null
          context_translation: string | null
          dictionary_id: string | null
          is_favorited: boolean | null
          next_review_at: string | null
          personal_note: string | null
          personal_note_mode: string | null
          proficiency_level: number | null
          user_id: string
          vocab_id: string
        }
        Insert: {
          context_sentence?: string | null
          context_translation?: string | null
          dictionary_id?: string | null
          is_favorited?: boolean | null
          next_review_at?: string | null
          personal_note?: string | null
          personal_note_mode?: string | null
          proficiency_level?: number | null
          user_id: string
          vocab_id: string
        }
        Update: {
          context_sentence?: string | null
          context_translation?: string | null
          dictionary_id?: string | null
          is_favorited?: boolean | null
          next_review_at?: string | null
          personal_note?: string | null
          personal_note_mode?: string | null
          proficiency_level?: number | null
          user_id?: string
          vocab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vocab_progress_dictionary_id_fkey"
            columns: ["dictionary_id"]
            isOneToOne: false
            referencedRelation: "dictionary_core"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vocab_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vocab_progress_vocab_id_fkey"
            columns: ["vocab_id"]
            isOneToOne: false
            referencedRelation: "vocabularies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vocabularies: {
        Row: {
          created_at: string
          dictionary_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dictionary_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          dictionary_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vocabularies_dictionary_id_fkey"
            columns: ["dictionary_id"]
            isOneToOne: false
            referencedRelation: "dictionary_core"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ai_credits: number | null
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          role: string | null
          subscription_tier: string | null
        }
        Insert: {
          ai_credits?: number | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          role?: string | null
          subscription_tier?: string | null
        }
        Update: {
          ai_credits?: number | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          role?: string | null
          subscription_tier?: string | null
        }
        Relationships: []
      }
      vocabularies: {
        Row: {
          ai_analysis: Json | null
          analysis: Json
          created_at: string | null
          hanzi: string
          id: string
          meaning: string | null
          pinyin: string | null
          sino_vietnamese: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          analysis?: Json
          created_at?: string | null
          hanzi: string
          id?: string
          meaning?: string | null
          pinyin?: string | null
          sino_vietnamese?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          analysis?: Json
          created_at?: string | null
          hanzi?: string
          id?: string
          meaning?: string | null
          pinyin?: string | null
          sino_vietnamese?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_append_message: {
        Args: {
          p_client_message_id?: string
          p_content: string
          p_conversation_id: string
          p_metadata?: Json
          p_reply_to_message_id?: string
          p_role: string
          p_user_id: string
        }
        Returns: {
          client_message_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          reply_to_message_id: string | null
          role: string
          seq: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ai_messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ai_apply_memory_changes: {
        Args: {
          p_changes: Json
          p_job_id: string
          p_user_id: string
          p_user_message_id: string
        }
        Returns: number
      }
      ai_apply_memory_changes_unscoped: {
        Args: {
          p_changes: Json
          p_job_id: string
          p_user_id: string
          p_user_message_id: string
        }
        Returns: number
      }
      ai_apply_summary_for_job: {
        Args: {
          p_expected_summary_version?: number
          p_job_id: string
          p_summary?: string
          p_summary_until_seq?: number
          p_user_id: string
        }
        Returns: boolean
      }
      ai_claim_post_turn_jobs: {
        Args: {
          p_conversation_id?: string
          p_limit?: number
          p_user_id: string
        }
        Returns: {
          assistant_message_id: string
          attempt_count: number
          available_at: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          id: string
          kind: string
          last_error: string | null
          locked_at: string | null
          memory_applied_at: string | null
          relationship_applied_at: string | null
          status: string
          summary_applied_at: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ai_post_turn_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      ai_evolve_relationship_for_job: {
        Args: { p_increment: number; p_job_id: string; p_user_id: string }
        Returns: boolean
      }
      ai_finish_post_turn_job: {
        Args: {
          p_error?: string
          p_job_id: string
          p_succeeded: boolean
          p_user_id: string
        }
        Returns: boolean
      }
      ai_forget_memories: {
        Args: {
          p_conversation_id: string
          p_memory_ids: Json
          p_user_id: string
        }
        Returns: number
      }
      ai_match_memories: {
        Args: {
          p_character_id: string
          p_match_count?: number
          p_min_similarity?: number
          p_query_embedding: string
          p_user_id: string
        }
        Returns: {
          character_id: string
          confidence: number
          content: string
          id: string
          importance: number
          kind: string
          memory_key: string
          reinforcement_count: number
          similarity: number
          updated_at: string
        }[]
      }
      ai_set_memory_embedding: {
        Args: {
          p_embedding: string
          p_embedding_model: string
          p_embedding_version: number
          p_memory_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      can_edit_hanzihome_content: { Args: never; Returns: boolean }
      create_lesson_text_annotation: {
        Args: {
          p_end_offset: number
          p_lesson_id: string
          p_node_id: string
          p_node_type: string
          p_note_text?: string
          p_prefix_text?: string
          p_selected_text: string
          p_start_offset: number
          p_suffix_text?: string
        }
        Returns: string
      }
      delete_lesson_text_annotation: {
        Args: { p_annotation_id: string }
        Returns: boolean
      }
      generate_note_short_id: { Args: never; Returns: string }
      get_hanzihome_aggregate_grammar: {
        Args: {
          p_book_id?: string
          p_course_id?: string
          p_lesson_id?: string
          p_limit?: number
          p_q?: string
        }
        Returns: {
          book_id: string
          clean_title: string
          core: string
          course_id: string
          id: string
          lesson_id: string
          lesson_number: number
          lesson_order: number
          lesson_title: string
          title: string
        }[]
      }
      get_hanzihome_aggregate_vocab: {
        Args: {
          p_book_id?: string
          p_course_id?: string
          p_lesson_id?: string
          p_limit?: number
          p_q?: string
        }
        Returns: {
          book_id: string
          category: string
          course_id: string
          han_viet: string
          id: string
          lesson_id: string
          lesson_number: number
          lesson_order: number
          lesson_title: string
          level: string
          meaning: string
          pinyin: string
          pos_vi: string
          pos_zh: string
          word: string
        }[]
      }
      get_hanzihome_catalog_stats: {
        Args: never
        Returns: {
          book_count: number
          course_id: string
          fallback_lesson_id: string
          grammar_count: number
          last_lesson_id: string
          lesson_count: number
          vocab_count: number
        }[]
      }
      hanzihome_apply_external_seed_patches: {
        Args: { p_patches: Json }
        Returns: Json
      }
      hanzihome_create_lesson_text_annotation_as_server: {
        Args: {
          p_end_offset: number
          p_lesson_id: string
          p_node_id: string
          p_node_type: string
          p_note_text?: string
          p_prefix_text?: string
          p_selected_text: string
          p_start_offset: number
          p_suffix_text?: string
          p_user_id: string
        }
        Returns: string
      }
      hanzihome_delete_lesson_text_annotation_as_server: {
        Args: { p_annotation_id: string; p_user_id: string }
        Returns: boolean
      }
      hanzihome_delete_reader_annotation: {
        Args: { p_annotation_id: string; p_expected_revision: number }
        Returns: boolean
      }
      hanzihome_delete_reader_annotation_as_server: {
        Args: {
          p_annotation_id: string
          p_expected_revision: number
          p_user_id: string
        }
        Returns: boolean
      }
      hanzihome_delete_reader_pronunciation_override: {
        Args: { p_expected_revision: number; p_override_id: string }
        Returns: boolean
      }
      hanzihome_delete_reader_pronunciation_override_as_server: {
        Args: {
          p_expected_revision: number
          p_override_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      hanzihome_import_external_seed_package: {
        Args: { p_seed: Json }
        Returns: Json
      }
      hanzihome_list_vocab_children: {
        Args: {
          p_deleted?: boolean
          p_entity_type: string
          p_page?: number
          p_page_size?: number
          p_query?: string
          p_scope_id: string
          p_scope_type: string
          p_section_keys?: string[]
        }
        Returns: Json
      }
      hanzihome_mutate_content: {
        Args: {
          p_actor_id: string
          p_audit_entity_id?: string
          p_audit_entity_type?: string
          p_audit_operation?: string
          p_audit_parent_entity_id?: string
          p_audit_parent_entity_type?: string
          p_changes?: Json
          p_entity_id?: string
          p_entity_type: string
          p_expected_updated_at?: string
          p_operation: string
          p_reason?: string
        }
        Returns: Json
      }
      hanzihome_mutate_content_as_user: {
        Args: {
          p_audit_entity_id?: string
          p_audit_entity_type?: string
          p_audit_operation?: string
          p_audit_parent_entity_id?: string
          p_audit_parent_entity_type?: string
          p_changes?: Json
          p_entity_id?: string
          p_entity_type: string
          p_expected_updated_at?: string
          p_operation: string
          p_reason?: string
        }
        Returns: Json
      }
      hanzihome_mutate_vocab_child_bulk: {
        Args: {
          p_entity_type: string
          p_expected_count: number
          p_expected_fingerprint: string
          p_ids?: string[]
          p_operation: string
          p_query?: string
          p_reason: string
          p_scope_id: string
          p_scope_type: string
          p_section_keys?: string[]
        }
        Returns: Json
      }
      hanzihome_preview_vocab_child_bulk: {
        Args: {
          p_deleted?: boolean
          p_entity_type: string
          p_ids?: string[]
          p_query?: string
          p_scope_id: string
          p_scope_type: string
          p_section_keys?: string[]
        }
        Returns: Json
      }
      hanzihome_purge_deleted_content_as_user: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_expected_updated_at: string
          p_reason: string
        }
        Returns: Json
      }
      hanzihome_rate_learning_loop_item: {
        Args: {
          p_expected_revision: number
          p_item_id: string
          p_rating: string
        }
        Returns: {
          correct_streak: number
          created_at: string
          due_at: string
          error_key: string
          id: string
          interval_days: number
          kind: string
          lapse_count: number
          meaning_vi: string
          pinyin: string
          prompt_zh: string
          revision: number
          source_href: string
          source_id: string
          stable_key: string
          state: string
          title_vi: string
          title_zh: string
          updated_at: string
          user_answer: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_learning_loop_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_rate_learning_loop_item_as_server: {
        Args: {
          p_expected_revision: number
          p_item_id: string
          p_rating: string
          p_user_id: string
        }
        Returns: {
          correct_streak: number
          created_at: string
          due_at: string
          error_key: string
          id: string
          interval_days: number
          kind: string
          lapse_count: number
          meaning_vi: string
          pinyin: string
          prompt_zh: string
          revision: number
          source_href: string
          source_id: string
          stable_key: string
          state: string
          title_vi: string
          title_zh: string
          updated_at: string
          user_answer: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_learning_loop_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_refresh_external_seed_package: {
        Args: { p_seed: Json }
        Returns: Json
      }
      hanzihome_update_lesson_text_annotation_note_as_server: {
        Args: {
          p_annotation_id: string
          p_note_text: string
          p_user_id: string
        }
        Returns: string
      }
      hanzihome_update_listening_item_as_user: {
        Args: {
          p_changes: Json
          p_entity_id: string
          p_expected_updated_at: string
          p_reason: string
        }
        Returns: Json
      }
      hanzihome_update_radical_as_user: {
        Args: {
          p_changes?: Json
          p_entity_id: string
          p_expected_updated_at: string
          p_reason?: string
        }
        Returns: Json
      }
      hanzihome_update_reader_annotation: {
        Args: {
          p_annotation_id: string
          p_asset_id: string
          p_color: string
          p_end_offset: number
          p_expected_revision: number
          p_note_text: string
          p_page_number: number
          p_paragraph_id: string
          p_payload: Json
          p_selected_text: string
          p_start_offset: number
        }
        Returns: {
          annotation_type: string
          asset_id: string | null
          color: string
          created_at: string
          deleted_at: string | null
          document_id: string
          end_offset: number | null
          id: string
          note_text: string
          page_number: number | null
          paragraph_id: string | null
          payload: Json
          revision: number
          selected_text: string
          start_offset: number | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_reader_annotations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_update_reader_annotation_as_server: {
        Args: {
          p_annotation_id: string
          p_asset_id: string
          p_color: string
          p_end_offset: number
          p_expected_revision: number
          p_note_text: string
          p_page_number: number
          p_paragraph_id: string
          p_payload: Json
          p_selected_text: string
          p_start_offset: number
          p_user_id: string
        }
        Returns: {
          annotation_type: string
          asset_id: string | null
          color: string
          created_at: string
          deleted_at: string | null
          document_id: string
          end_offset: number | null
          id: string
          note_text: string
          page_number: number | null
          paragraph_id: string | null
          payload: Json
          revision: number
          selected_text: string
          start_offset: number | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_reader_annotations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_upsert_daily_reading_state: {
        Args: {
          p_expected_revision: number
          p_published_date: string
          p_state: Json
        }
        Returns: {
          created_at: string
          published_date: string
          revision: number
          state: Json
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_daily_reading_state"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_upsert_daily_reading_state_as_server: {
        Args: {
          p_expected_revision: number
          p_published_date: string
          p_state: Json
          p_user_id: string
        }
        Returns: {
          created_at: string
          published_date: string
          revision: number
          state: Json
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_daily_reading_state"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_upsert_pdf_annotation: {
        Args: {
          p_asset_id: string
          p_expected_revision: number
          p_page_number: number
          p_payload: Json
        }
        Returns: {
          asset_id: string
          created_at: string
          id: string
          page_number: number
          payload: Json
          revision: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_pdf_annotations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_upsert_personal_learning_state: {
        Args: { p_expected_revision: number; p_node_id: string; p_state: Json }
        Returns: {
          created_at: string
          node_id: string
          revision: number
          state: Json
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_personal_learning_state"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_upsert_personal_learning_state_as_server: {
        Args: {
          p_expected_revision: number
          p_node_id: string
          p_state: Json
          p_user_id: string
        }
        Returns: {
          created_at: string
          node_id: string
          revision: number
          state: Json
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_personal_learning_state"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_upsert_reader_progress: {
        Args: {
          p_answers: Json
          p_completed: boolean
          p_document_id: string
          p_expected_revision: number
          p_show_meaning: boolean
          p_show_pinyin: boolean
          p_summary_text: string
        }
        Returns: {
          answers: Json
          completed: boolean
          created_at: string
          document_id: string
          revision: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_reader_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_upsert_reader_pronunciation_override: {
        Args: {
          p_document_id: string
          p_end_offset: number
          p_expected_revision: number
          p_override_id: string
          p_paragraph_id: string
          p_readings: string[]
          p_scope: string
          p_sentence_text: string
          p_start_offset: number
          p_text: string
        }
        Returns: {
          created_at: string
          document_id: string
          end_offset: number | null
          id: string
          paragraph_id: string
          readings: string[]
          revision: number
          scope: string
          sentence_text: string | null
          start_offset: number | null
          text: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_reader_pronunciation_overrides"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_upsert_reader_pronunciation_override_as_server: {
        Args: {
          p_document_id: string
          p_end_offset: number
          p_expected_revision: number
          p_override_id: string
          p_paragraph_id: string
          p_readings: string[]
          p_scope: string
          p_sentence_text: string
          p_start_offset: number
          p_text: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          document_id: string
          end_offset: number | null
          id: string
          paragraph_id: string
          readings: string[]
          revision: number
          scope: string
          sentence_text: string | null
          start_offset: number | null
          text: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "hanzihome_reader_pronunciation_overrides"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hanzihome_vocab_child_candidates: {
        Args: {
          p_deleted?: boolean
          p_entity_type: string
          p_ids?: string[]
          p_query?: string
          p_scope_id: string
          p_scope_type: string
          p_section_keys?: string[]
        }
        Returns: {
          book_id: string
          course_id: string
          deleted_at: string
          id: string
          label: string
          lesson_id: string
          owner_id: string
          section_key: string
          source: string
          updated_at: string
          vocab_item_id: string
          word: string
        }[]
      }
      is_hanzihome_content_editor: { Args: never; Returns: boolean }
      update_lesson_text_annotation_note: {
        Args: { p_annotation_id: string; p_note_text: string }
        Returns: string
      }
      upsert_legacy_vocabulary_cache: {
        Args: {
          p_analysis?: Json
          p_hanzi: string
          p_meaning?: string
          p_pinyin?: string
          p_sino_vietnamese?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
