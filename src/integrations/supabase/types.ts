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
      analytics_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_name: string
          id: string
          properties: Json
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_name: string
          id?: string
          properties?: Json
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_name?: string
          id?: string
          properties?: Json
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          attended: boolean | null
          booking_id: string
          created_at: string
          id: string
          notes: string | null
          recorded_at: string | null
          student_id: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          attended?: boolean | null
          booking_id: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string | null
          student_id: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          attended?: boolean | null
          booking_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string | null
          student_id?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          admin_notes: string | null
          available_days: string[]
          available_times: string | null
          bio_completed: boolean
          bio_details: Json
          created_at: string
          currency: string
          duration_minutes: number
          id: string
          meeting_url: string | null
          preferred_start: string
          price_amount: number
          programme: string | null
          ref_code: string | null
          session_type: string
          status: Database["public"]["Enums"]["booking_status"]
          student_email: string | null
          student_id: string
          student_name: string | null
          student_notes: string | null
          student_phone: string | null
          subject_id: string
          topic_id: string | null
          tutor_id: string
          updated_at: string
          whatsapp_sent: boolean
        }
        Insert: {
          admin_notes?: string | null
          available_days?: string[]
          available_times?: string | null
          bio_completed?: boolean
          bio_details?: Json
          created_at?: string
          currency?: string
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          preferred_start: string
          price_amount: number
          programme?: string | null
          ref_code?: string | null
          session_type: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_email?: string | null
          student_id: string
          student_name?: string | null
          student_notes?: string | null
          student_phone?: string | null
          subject_id: string
          topic_id?: string | null
          tutor_id: string
          updated_at?: string
          whatsapp_sent?: boolean
        }
        Update: {
          admin_notes?: string | null
          available_days?: string[]
          available_times?: string | null
          bio_completed?: boolean
          bio_details?: Json
          created_at?: string
          currency?: string
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          preferred_start?: string
          price_amount?: number
          programme?: string | null
          ref_code?: string | null
          session_type?: string
          status?: Database["public"]["Enums"]["booking_status"]
          student_email?: string | null
          student_id?: string
          student_name?: string | null
          student_notes?: string | null
          student_phone?: string | null
          subject_id?: string
          topic_id?: string | null
          tutor_id?: string
          updated_at?: string
          whatsapp_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bookings_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      founder_profile: {
        Row: {
          achievements: Json
          biography: string
          created_at: string
          id: string
          is_published: boolean
          journey: Json
          mission: string
          name: string
          philosophy: string
          photo_url: string | null
          title: string
          updated_at: string
          vision: string
        }
        Insert: {
          achievements?: Json
          biography: string
          created_at?: string
          id?: string
          is_published?: boolean
          journey?: Json
          mission: string
          name: string
          philosophy: string
          photo_url?: string | null
          title: string
          updated_at?: string
          vision: string
        }
        Update: {
          achievements?: Json
          biography?: string
          created_at?: string
          id?: string
          is_published?: boolean
          journey?: Json
          mission?: string
          name?: string
          philosophy?: string
          photo_url?: string | null
          title?: string
          updated_at?: string
          vision?: string
        }
        Relationships: []
      }
      learning_activity: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          last_viewed_at: string
          progress: number
          resource_id: string | null
          topic_id: string | null
          updated_at: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          last_viewed_at?: string
          progress?: number
          resource_id?: string | null
          topic_id?: string | null
          updated_at?: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          last_viewed_at?: string
          progress?: number
          resource_id?: string | null
          topic_id?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_activity_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_activity_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_activity_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          metadata: Json
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      past_papers: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at: string
          doc_type: string
          file_name: string | null
          file_size_kb: number | null
          file_url: string
          id: string
          is_published: boolean
          paper_number: string
          session: string
          subject_key: string
          title: string | null
          updated_at: string
          year: number
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          doc_type: string
          file_name?: string | null
          file_size_kb?: number | null
          file_url: string
          id?: string
          is_published?: boolean
          paper_number: string
          session: string
          subject_key: string
          title?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          doc_type?: string
          file_name?: string | null
          file_size_kb?: number | null
          file_url?: string
          id?: string
          is_published?: boolean
          paper_number?: string
          session?: string
          subject_key?: string
          title?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json
          provider: string
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency: string
          id?: string
          metadata?: Json
          provider: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          provider?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "premium_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_subscriptions: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          plan_id: string
          provider: string | null
          provider_reference: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          plan_id: string
          provider?: string | null
          provider_reference?: string | null
          starts_at: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          plan_id?: string
          provider?: string | null
          provider_reference?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          accent: string
          created_at: string
          description: string
          id: string
          is_published: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          accent?: string
          created_at?: string
          description: string
          id?: string
          is_published?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          accent?: string
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          created_at: string
          exam_type: string | null
          filters: Json
          id: string
          score: number
          subject_key: string | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          exam_type?: string | null
          filters?: Json
          id?: string
          score?: number
          subject_key?: string | null
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          exam_type?: string | null
          filters?: Json
          id?: string
          score?: number
          subject_key?: string | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          correct_index: number
          created_at: string
          difficulty: string
          exam_type: string
          explanation: string | null
          id: string
          image_url: string | null
          is_published: boolean
          options: Json
          paper_number: string | null
          question_text: string
          session: string | null
          subject_key: string
          topic: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          correct_index?: number
          created_at?: string
          difficulty?: string
          exam_type: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          options?: Json
          paper_number?: string | null
          question_text: string
          session?: string | null
          subject_key: string
          topic?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          correct_index?: number
          created_at?: string
          difficulty?: string
          exam_type?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          options?: Json
          paper_number?: string | null
          question_text?: string
          session?: string | null
          subject_key?: string
          topic?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at: string
          description: string
          download_count: number
          file_path: string
          id: string
          is_published: boolean
          preview_url: string | null
          program_id: string
          resource_type: string
          subject_id: string
          title: string
          topic_id: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          description?: string
          download_count?: number
          file_path: string
          id?: string
          is_published?: boolean
          preview_url?: string | null
          program_id: string
          resource_type: string
          subject_id: string
          title: string
          topic_id?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          description?: string
          download_count?: number
          file_path?: string
          id?: string
          is_published?: boolean
          preview_url?: string | null
          program_id?: string
          resource_type?: string
          subject_id?: string
          title?: string
          topic_id?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_resources: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          description: string
          id: string
          is_published: boolean
          name: string
          program_id: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_published?: boolean
          name: string
          program_id: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          name?: string
          program_id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at: string
          features: Json
          id: string
          interval: string
          is_active: boolean
          name: string
          price_ngn: number
          price_usd: number | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at?: string
          features?: Json
          id?: string
          interval: string
          is_active?: boolean
          name: string
          price_ngn: number
          price_usd?: number | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name?: string
          price_ngn?: number
          price_usd?: number | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      summer_student_registrations: {
        Row: {
          age: number
          commit_character: boolean
          commit_excellence: boolean
          commit_proximity: boolean
          created_at: string
          current_class: string
          department: string | null
          email: string
          full_name: string
          gender: string
          home_address: string
          id: string
          parent_name: string
          phone: string
          status: string
          target_exams: string[]
        }
        Insert: {
          age: number
          commit_character?: boolean
          commit_excellence?: boolean
          commit_proximity?: boolean
          created_at?: string
          current_class: string
          department?: string | null
          email: string
          full_name: string
          gender: string
          home_address: string
          id?: string
          parent_name: string
          phone: string
          status?: string
          target_exams?: string[]
        }
        Update: {
          age?: number
          commit_character?: boolean
          commit_excellence?: boolean
          commit_proximity?: boolean
          created_at?: string
          current_class?: string
          department?: string | null
          email?: string
          full_name?: string
          gender?: string
          home_address?: string
          id?: string
          parent_name?: string
          phone?: string
          status?: string
          target_exams?: string[]
        }
        Relationships: []
      }
      summer_tutor_volunteers: {
        Row: {
          availability: string
          commit_impact: boolean
          commit_integrity: boolean
          commit_reliability: boolean
          created_at: string
          email: string
          experience_years: number | null
          full_name: string
          gender: string | null
          id: string
          motivation: string | null
          phone: string
          qualification: string
          status: string
          subjects: string[]
        }
        Insert: {
          availability: string
          commit_impact?: boolean
          commit_integrity?: boolean
          commit_reliability?: boolean
          created_at?: string
          email: string
          experience_years?: number | null
          full_name: string
          gender?: string | null
          id?: string
          motivation?: string | null
          phone: string
          qualification: string
          status?: string
          subjects?: string[]
        }
        Update: {
          availability?: string
          commit_impact?: boolean
          commit_integrity?: boolean
          commit_reliability?: boolean
          created_at?: string
          email?: string
          experience_years?: number | null
          full_name?: string
          gender?: string | null
          id?: string
          motivation?: string | null
          phone?: string
          qualification?: string
          status?: string
          subjects?: string[]
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          photo_url: string | null
          program_name: string
          quote: string
          rating: number
          sort_order: number
          student_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          photo_url?: string | null
          program_name: string
          quote: string
          rating: number
          sort_order?: number
          student_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          photo_url?: string | null
          program_name?: string
          quote?: string
          rating?: number
          sort_order?: number
          student_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      topic_questions: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at: string
          id: string
          is_published: boolean
          ms_url: string | null
          paper_key: string
          paper_label: string
          questions_url: string | null
          sort_order: number
          subject_key: string
          topic: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          id?: string
          is_published?: boolean
          ms_url?: string | null
          paper_key: string
          paper_label: string
          questions_url?: string | null
          sort_order?: number
          subject_key: string
          topic: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          id?: string
          is_published?: boolean
          ms_url?: string | null
          paper_key?: string
          paper_label?: string
          questions_url?: string | null
          sort_order?: number
          subject_key?: string
          topic?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string
          description: string
          id: string
          is_published: boolean
          name: string
          slug: string
          sort_order: number
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          name: string
          slug: string
          sort_order?: number
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          name?: string
          slug?: string
          sort_order?: number
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_applications: {
        Row: {
          admin_feedback: string | null
          availability: string[]
          biography: string
          created_at: string
          curricula: string[]
          cv_path: string | null
          email: string
          experience_band: string | null
          field_of_study: string | null
          full_name: string
          has_equipment: boolean
          highest_qualification: string | null
          hours_per_week: string | null
          id: string
          intro_video_url: string | null
          location: string | null
          occupation: string | null
          phone: string
          photo_path: string | null
          pricing: Json
          qualifications: string
          sample_video_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          subjects: string[]
          teaching_philosophy: string | null
          tools: string[]
          topics: string[]
          updated_at: string
          user_id: string
          video_experience: string | null
          years_experience: number
        }
        Insert: {
          admin_feedback?: string | null
          availability?: string[]
          biography?: string
          created_at?: string
          curricula?: string[]
          cv_path?: string | null
          email: string
          experience_band?: string | null
          field_of_study?: string | null
          full_name: string
          has_equipment?: boolean
          highest_qualification?: string | null
          hours_per_week?: string | null
          id?: string
          intro_video_url?: string | null
          location?: string | null
          occupation?: string | null
          phone: string
          photo_path?: string | null
          pricing?: Json
          qualifications?: string
          sample_video_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          subjects?: string[]
          teaching_philosophy?: string | null
          tools?: string[]
          topics?: string[]
          updated_at?: string
          user_id: string
          video_experience?: string | null
          years_experience?: number
        }
        Update: {
          admin_feedback?: string | null
          availability?: string[]
          biography?: string
          created_at?: string
          curricula?: string[]
          cv_path?: string | null
          email?: string
          experience_band?: string | null
          field_of_study?: string | null
          full_name?: string
          has_equipment?: boolean
          highest_qualification?: string | null
          hours_per_week?: string | null
          id?: string
          intro_video_url?: string | null
          location?: string | null
          occupation?: string | null
          phone?: string
          photo_path?: string | null
          pricing?: Json
          qualifications?: string
          sample_video_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          subjects?: string[]
          teaching_philosophy?: string | null
          tools?: string[]
          topics?: string[]
          updated_at?: string
          user_id?: string
          video_experience?: string | null
          years_experience?: number
        }
        Relationships: []
      }
      tutor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          timezone: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          timezone?: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          timezone?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_availability_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_profiles: {
        Row: {
          application_id: string | null
          bio: string
          created_at: string
          display_name: string
          exam_track: string
          highest_qualification: string | null
          id: string
          is_approved: boolean
          is_visible: boolean
          photo_url: string | null
          pricing: Json
          qualifications: string[]
          rating: number
          ref_code: string | null
          review_count: number
          subjects: string[]
          topics: string[]
          updated_at: string
          user_id: string
          years_experience: number
        }
        Insert: {
          application_id?: string | null
          bio: string
          created_at?: string
          display_name: string
          exam_track?: string
          highest_qualification?: string | null
          id?: string
          is_approved?: boolean
          is_visible?: boolean
          photo_url?: string | null
          pricing?: Json
          qualifications?: string[]
          rating?: number
          ref_code?: string | null
          review_count?: number
          subjects?: string[]
          topics?: string[]
          updated_at?: string
          user_id: string
          years_experience?: number
        }
        Update: {
          application_id?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          exam_track?: string
          highest_qualification?: string | null
          id?: string
          is_approved?: boolean
          is_visible?: boolean
          photo_url?: string | null
          pricing?: Json
          qualifications?: string[]
          rating?: number
          ref_code?: string | null
          review_count?: number
          subjects?: string[]
          topics?: string[]
          updated_at?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "tutor_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "tutor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at: string
          description: string
          duration_seconds: number | null
          id: string
          is_published: boolean
          program_id: string
          provider: string
          provider_id: string
          provider_url: string | null
          subject_id: string
          thumbnail_url: string | null
          title: string
          topic_id: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          description?: string
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          program_id: string
          provider: string
          provider_id: string
          provider_url?: string | null
          subject_id: string
          thumbnail_url?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string
          description?: string
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          program_id?: string
          provider?: string
          provider_id?: string
          provider_url?: string | null
          subject_id?: string
          thumbnail_url?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      access_level: "free" | "premium"
      app_role: "admin" | "tutor" | "student"
      application_status:
        | "pending"
        | "approved"
        | "rejected"
        | "changes_requested"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      payment_status: "pending" | "paid" | "failed" | "refunded"
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
    Enums: {
      access_level: ["free", "premium"],
      app_role: ["admin", "tutor", "student"],
      application_status: [
        "pending",
        "approved",
        "rejected",
        "changes_requested",
      ],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      payment_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const
