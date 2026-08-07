// Generated from the live schema — do not hand-edit.
// Regenerate with: npx supabase gen types typescript --linked > src/types/database.ts
//
// The previous hand-maintained version had drifted: six editorial-workflow
// columns added in July never reached it, and the files that consume these
// types had @ts-nocheck so nothing complained.
//
// `supabase gen types` overwrites this file wholesale, so this header has to be
// re-applied after every regeneration — it was lost once already.

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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ad_slots: {
        Row: {
          ad_type: string | null
          clicks: number | null
          content: string | null
          created_at: string | null
          device_targeting: string | null
          id: string
          impressions: number | null
          is_active: boolean | null
          name: string
          revenue_generated: number | null
          slot_key: string
          updated_at: string | null
        }
        Insert: {
          ad_type?: string | null
          clicks?: number | null
          content?: string | null
          created_at?: string | null
          device_targeting?: string | null
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          name: string
          revenue_generated?: number | null
          slot_key: string
          updated_at?: string | null
        }
        Update: {
          ad_type?: string | null
          clicks?: number | null
          content?: string | null
          created_at?: string | null
          device_targeting?: string | null
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          name?: string
          revenue_generated?: number | null
          slot_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          article_id: string | null
          clicks: number | null
          conversions: number | null
          created_at: string | null
          id: string
          movie_id: string | null
          partner: string
          revenue: number | null
          url: string
        }
        Insert: {
          article_id?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          movie_id?: string | null
          partner: string
          revenue?: number | null
          url: string
        }
        Update: {
          article_id?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          movie_id?: string | null
          partner?: string
          revenue?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          suggestion_type: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          suggestion_type: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          suggestion_type?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          assignee_id: string | null
          author_id: string | null
          category_id: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          due_date: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          imdb_score: number | null
          is_featured: boolean
          last_indexed_at: string | null
          movie_id: string | null
          og_image_url: string | null
          priority: string | null
          published_at: string | null
          pull_quote: string | null
          query_signature: string | null
          rating: number | null
          reading_time: number | null
          revenue_generated: number | null
          reviewer_id: string | null
          rt_score: number | null
          search_vector: unknown
          seo_description: string | null
          seo_score: number | null
          seo_title: string | null
          shares: number | null
          slug: string
          source_name: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["article_status"]
          subheadline: string | null
          subject_birthday: string | null
          subject_birthplace: string | null
          subject_name: string | null
          subject_photo_url: string | null
          subject_role: string | null
          title: string
          type: Database["public"]["Enums"]["article_type"]
          updated_at: string
          verdict: string | null
          views_count: number
          workflow_status: string | null
        }
        Insert: {
          assignee_id?: string | null
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          due_date?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          imdb_score?: number | null
          is_featured?: boolean
          last_indexed_at?: string | null
          movie_id?: string | null
          og_image_url?: string | null
          priority?: string | null
          published_at?: string | null
          pull_quote?: string | null
          query_signature?: string | null
          rating?: number | null
          reading_time?: number | null
          revenue_generated?: number | null
          reviewer_id?: string | null
          rt_score?: number | null
          search_vector?: unknown
          seo_description?: string | null
          seo_score?: number | null
          seo_title?: string | null
          shares?: number | null
          slug: string
          source_name?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          subheadline?: string | null
          subject_birthday?: string | null
          subject_birthplace?: string | null
          subject_name?: string | null
          subject_photo_url?: string | null
          subject_role?: string | null
          title: string
          type?: Database["public"]["Enums"]["article_type"]
          updated_at?: string
          verdict?: string | null
          views_count?: number
          workflow_status?: string | null
        }
        Update: {
          assignee_id?: string | null
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          due_date?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          imdb_score?: number | null
          is_featured?: boolean
          last_indexed_at?: string | null
          movie_id?: string | null
          og_image_url?: string | null
          priority?: string | null
          published_at?: string | null
          pull_quote?: string | null
          query_signature?: string | null
          rating?: number | null
          reading_time?: number | null
          revenue_generated?: number | null
          reviewer_id?: string | null
          rt_score?: number | null
          search_vector?: unknown
          seo_description?: string | null
          seo_score?: number | null
          seo_title?: string | null
          shares?: number | null
          slug?: string
          source_name?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          subheadline?: string | null
          subject_birthday?: string | null
          subject_birthplace?: string | null
          subject_name?: string | null
          subject_photo_url?: string | null
          subject_role?: string | null
          title?: string
          type?: Database["public"]["Enums"]["article_type"]
          updated_at?: string
          verdict?: string | null
          views_count?: number
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          slug: string | null
          social_links: Json | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          social_links?: Json | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
          social_links?: Json | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          article_id: string | null
          content: string
          created_at: string | null
          downvotes: number | null
          guest_name: string | null
          id: string
          parent_id: string | null
          status: string | null
          updated_at: string | null
          upvotes: number | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          content: string
          created_at?: string | null
          downvotes?: number | null
          guest_name?: string | null
          id?: string
          parent_id?: string | null
          status?: string | null
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          content?: string
          created_at?: string | null
          downvotes?: number | null
          guest_name?: string | null
          id?: string
          parent_id?: string | null
          status?: string | null
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      job_logs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          level: string
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          level?: string
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          level?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_reason: string | null
          id: string
          job_type: string
          payload: Json | null
          priority: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_reason?: string | null
          id?: string
          job_type: string
          payload?: Json | null
          priority?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_reason?: string | null
          id?: string
          job_type?: string
          payload?: Json | null
          priority?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      list_items: {
        Row: {
          article_id: string
          blurb: string | null
          created_at: string
          custom_title: string | null
          id: string
          item_rating: number | null
          movie_id: string | null
          rank: number
        }
        Insert: {
          article_id: string
          blurb?: string | null
          created_at?: string
          custom_title?: string | null
          id?: string
          item_rating?: number | null
          movie_id?: string | null
          rank: number
        }
        Update: {
          article_id?: string
          blurb?: string | null
          created_at?: string
          custom_title?: string | null
          id?: string
          item_rating?: number | null
          movie_id?: string | null
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "list_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_url: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_coverage_plans: {
        Row: {
          ai_priority_score: number | null
          created_at: string | null
          has_box_office: boolean | null
          has_cast_guide: boolean | null
          has_ending_explained: boolean | null
          has_post_credits: boolean | null
          has_ranking: boolean | null
          has_review: boolean | null
          has_streaming_guide: boolean | null
          has_timeline: boolean | null
          has_trailer_article: boolean | null
          has_where_to_watch: boolean | null
          movie_id: string
          updated_at: string | null
        }
        Insert: {
          ai_priority_score?: number | null
          created_at?: string | null
          has_box_office?: boolean | null
          has_cast_guide?: boolean | null
          has_ending_explained?: boolean | null
          has_post_credits?: boolean | null
          has_ranking?: boolean | null
          has_review?: boolean | null
          has_streaming_guide?: boolean | null
          has_timeline?: boolean | null
          has_trailer_article?: boolean | null
          has_where_to_watch?: boolean | null
          movie_id: string
          updated_at?: string | null
        }
        Update: {
          ai_priority_score?: number | null
          created_at?: string | null
          has_box_office?: boolean | null
          has_cast_guide?: boolean | null
          has_ending_explained?: boolean | null
          has_post_credits?: boolean | null
          has_ranking?: boolean | null
          has_review?: boolean | null
          has_streaming_guide?: boolean | null
          has_timeline?: boolean | null
          has_trailer_article?: boolean | null
          has_where_to_watch?: boolean | null
          movie_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movie_coverage_plans_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: true
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_ratings: {
        Row: {
          created_at: string | null
          movie_id: string
          rating: number | null
          review: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          movie_id: string
          rating?: number | null
          review?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          movie_id?: string
          rating?: number | null
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_ratings_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          backdrop_url: string | null
          box_office_gross: number | null
          cast_list: Json | null
          certification: string | null
          created_at: string
          crew_list: Json | null
          director: string | null
          genres: Json | null
          id: string
          imdb_id: string | null
          metadata: Json | null
          original_title: string | null
          poster_url: string | null
          release_date: string | null
          release_year: number | null
          runtime: number | null
          slug: string | null
          streaming_platforms: Json | null
          synopsis: string | null
          title: string
          tmdb_id: number | null
          trailer_url: string | null
          updated_at: string
        }
        Insert: {
          backdrop_url?: string | null
          box_office_gross?: number | null
          cast_list?: Json | null
          certification?: string | null
          created_at?: string
          crew_list?: Json | null
          director?: string | null
          genres?: Json | null
          id?: string
          imdb_id?: string | null
          metadata?: Json | null
          original_title?: string | null
          poster_url?: string | null
          release_date?: string | null
          release_year?: number | null
          runtime?: number | null
          slug?: string | null
          streaming_platforms?: Json | null
          synopsis?: string | null
          title: string
          tmdb_id?: number | null
          trailer_url?: string | null
          updated_at?: string
        }
        Update: {
          backdrop_url?: string | null
          box_office_gross?: number | null
          cast_list?: Json | null
          certification?: string | null
          created_at?: string
          crew_list?: Json | null
          director?: string | null
          genres?: Json | null
          id?: string
          imdb_id?: string | null
          metadata?: Json | null
          original_title?: string | null
          poster_url?: string | null
          release_date?: string | null
          release_year?: number | null
          runtime?: number | null
          slug?: string | null
          streaming_platforms?: Json | null
          synopsis?: string | null
          title?: string
          tmdb_id?: number | null
          trailer_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          click_rate: number | null
          content: string
          created_at: string | null
          id: string
          open_rate: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          click_rate?: number | null
          content: string
          created_at?: string | null
          id?: string
          open_rate?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          click_rate?: number | null
          content?: string
          created_at?: string | null
          id?: string
          open_rate?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          article_id: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          path: string
          referrer: string | null
          visitor_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          path: string
          referrer?: string | null
          visitor_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          path?: string
          referrer?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_audits: {
        Row: {
          article_id: string | null
          id: string
          last_audited_at: string | null
          missing_elements: Json | null
          overall_score: number | null
          suggestions: Json | null
        }
        Insert: {
          article_id?: string | null
          id?: string
          last_audited_at?: string | null
          missing_elements?: Json | null
          overall_score?: number | null
          suggestions?: Json | null
        }
        Update: {
          article_id?: string | null
          id?: string
          last_audited_at?: string | null
          missing_elements?: Json | null
          overall_score?: number | null
          suggestions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_audits_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      spotlight_works: {
        Row: {
          article_id: string
          created_at: string
          custom_title: string | null
          id: string
          movie_id: string | null
          note: string | null
          rank: number
        }
        Insert: {
          article_id: string
          created_at?: string
          custom_title?: string | null
          id?: string
          movie_id?: string | null
          note?: string | null
          rank: number
        }
        Update: {
          article_id?: string
          created_at?: string
          custom_title?: string | null
          id?: string
          movie_id?: string | null
          note?: string | null
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_works_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotlight_works_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      trend_opportunities: {
        Row: {
          created_at: string | null
          id: string
          opportunity_score: number | null
          source: string
          status: string | null
          suggested_angles: Json | null
          topic: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          opportunity_score?: number | null
          source: string
          status?: string | null
          suggested_angles?: Json | null
          topic: string
        }
        Update: {
          created_at?: string | null
          id?: string
          opportunity_score?: number | null
          source?: string
          status?: string | null
          suggested_angles?: Json | null
          topic?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          article_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reading_history: {
        Row: {
          article_id: string | null
          id: string
          last_read_at: string | null
          progress: number | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          id?: string
          last_read_at?: string | null
          progress?: number | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          id?: string
          last_read_at?: string | null
          progress?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_view_count: { Args: { article_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      article_status: "draft" | "published" | "archived"
      article_type: "news" | "review" | "spotlight" | "list"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      article_status: ["draft", "published", "archived"],
      article_type: ["news", "review", "spotlight", "list"],
    },
  },
} as const
