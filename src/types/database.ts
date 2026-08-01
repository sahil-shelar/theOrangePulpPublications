export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      authors: {
        Row: {
          id: string
          name: string
          slug: string | null
          avatar_url: string | null
          bio: string | null
          social_links: Json | null
          created_at: string
          updated_at: string
          username: string | null
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          avatar_url?: string | null
          bio?: string | null
          social_links?: Json | null
          created_at?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          avatar_url?: string | null
          bio?: string | null
          social_links?: Json | null
          created_at?: string
          updated_at?: string
          username?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      movies: {
        Row: {
          id: string
          title: string
          slug: string | null
          tmdb_id: number | null
          release_year: number | null
          release_date: string | null
          director: string | null
          original_title: string | null
          synopsis: string | null
          trailer_url: string | null
          certification: string | null
          poster_url: string | null
          backdrop_url: string | null
          metadata: Json | null
          runtime: number | null
          genres: Json | null
          cast_list: Json | null
          crew_list: Json | null
          streaming_platforms: Json | null
          box_office_gross: number | null
          imdb_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug?: string | null
          tmdb_id?: number | null
          release_year?: number | null
          release_date?: string | null
          director?: string | null
          original_title?: string | null
          synopsis?: string | null
          trailer_url?: string | null
          certification?: string | null
          poster_url?: string | null
          backdrop_url?: string | null
          metadata?: Json | null
          runtime?: number | null
          genres?: Json | null
          cast_list?: Json | null
          crew_list?: Json | null
          streaming_platforms?: Json | null
          box_office_gross?: number | null
          imdb_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string | null
          tmdb_id?: number | null
          release_year?: number | null
          release_date?: string | null
          director?: string | null
          original_title?: string | null
          synopsis?: string | null
          trailer_url?: string | null
          certification?: string | null
          poster_url?: string | null
          backdrop_url?: string | null
          metadata?: Json | null
          runtime?: number | null
          genres?: Json | null
          cast_list?: Json | null
          crew_list?: Json | null
          streaming_platforms?: Json | null
          box_office_gross?: number | null
          imdb_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: string
          file_name: string
          file_url: string
          alt_text: string | null
          mime_type: string | null
          size_bytes: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          file_name: string
          file_url: string
          alt_text?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          file_name?: string
          file_url?: string
          alt_text?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          cover_image_url: string | null
          featured_image_url: string | null
          og_image_url: string | null
          status: 'draft' | 'published' | 'archived'
          type: 'news' | 'review' | 'spotlight' | 'list'
          category_id: string | null
          author_id: string | null
          movie_id: string | null
          rating: number | null
          is_featured: boolean
          views_count: number
          reading_time: number | null
          seo_title: string | null
          seo_description: string | null
          shares: number | null
          revenue_generated: number | null
          last_indexed_at: string | null
          published_at: string | null
          created_at: string
          updated_at: string
          workflow_status: string | null
          assignee_id: string | null
          reviewer_id: string | null
          due_date: string | null
          priority: string | null
          seo_score: number | null
          subheadline: string | null
          source_name: string | null
          source_url: string | null
          imdb_score: number | null
          rt_score: number | null
          verdict: string | null
          subject_name: string | null
          subject_role: string | null
          subject_photo_url: string | null
          pull_quote: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          cover_image_url?: string | null
          featured_image_url?: string | null
          og_image_url?: string | null
          status?: 'draft' | 'published' | 'archived'
          type?: 'news' | 'review' | 'spotlight' | 'list'
          category_id?: string | null
          author_id?: string | null
          movie_id?: string | null
          rating?: number | null
          is_featured?: boolean
          views_count?: number
          reading_time?: number | null
          seo_title?: string | null
          seo_description?: string | null
          shares?: number | null
          revenue_generated?: number | null
          last_indexed_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
          workflow_status?: string | null
          assignee_id?: string | null
          reviewer_id?: string | null
          due_date?: string | null
          priority?: string | null
          seo_score?: number | null
          subheadline?: string | null
          source_name?: string | null
          source_url?: string | null
          imdb_score?: number | null
          rt_score?: number | null
          verdict?: string | null
          subject_name?: string | null
          subject_role?: string | null
          subject_photo_url?: string | null
          pull_quote?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          cover_image_url?: string | null
          featured_image_url?: string | null
          og_image_url?: string | null
          status?: 'draft' | 'published' | 'archived'
          type?: 'news' | 'review' | 'spotlight' | 'list'
          category_id?: string | null
          author_id?: string | null
          movie_id?: string | null
          rating?: number | null
          is_featured?: boolean
          views_count?: number
          reading_time?: number | null
          seo_title?: string | null
          seo_description?: string | null
          shares?: number | null
          revenue_generated?: number | null
          last_indexed_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
          workflow_status?: string | null
          assignee_id?: string | null
          reviewer_id?: string | null
          due_date?: string | null
          priority?: string | null
          seo_score?: number | null
          subheadline?: string | null
          source_name?: string | null
          source_url?: string | null
          imdb_score?: number | null
          rt_score?: number | null
          verdict?: string | null
          subject_name?: string | null
          subject_role?: string | null
          subject_photo_url?: string | null
          pull_quote?: string | null
        }
      }
      list_items: {
        Row: {
          id: string
          article_id: string
          rank: number
          movie_id: string | null
          custom_title: string | null
          blurb: string | null
          item_rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          article_id: string
          rank: number
          movie_id?: string | null
          custom_title?: string | null
          blurb?: string | null
          item_rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          rank?: number
          movie_id?: string | null
          custom_title?: string | null
          blurb?: string | null
          item_rating?: number | null
          created_at?: string
        }
      }
      spotlight_works: {
        Row: {
          id: string
          article_id: string
          rank: number
          movie_id: string | null
          custom_title: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          article_id: string
          rank: number
          movie_id?: string | null
          custom_title?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          rank?: number
          movie_id?: string | null
          custom_title?: string | null
          note?: string | null
          created_at?: string
        }
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
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          id?: string
          email: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          id?: string
          email?: string
          is_active?: boolean
          subscribed_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: Json
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          job_type: string
          payload: Json | null
          status: string
          priority: number | null
          attempts: number | null
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          failed_reason: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_type: string
          payload?: Json | null
          status?: string
          priority?: number | null
          attempts?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          failed_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_type?: string
          payload?: Json | null
          status?: string
          priority?: number | null
          attempts?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          failed_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          article_id: string
          user_id: string | null
          parent_id: string | null
          content: string
          status: string
          upvotes: number
          downvotes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          article_id: string
          user_id?: string | null
          parent_id?: string | null
          content: string
          status?: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          user_id?: string | null
          parent_id?: string | null
          content?: string
          status?: string
          upvotes?: number
          downvotes?: number
          created_at?: string
          updated_at?: string
        }
      }
      page_views: {
        Row: {
          id: string
          path: string
          article_id: string | null
          visitor_id: string | null
          referrer: string | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          path: string
          article_id?: string | null
          visitor_id?: string | null
          referrer?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          path?: string
          article_id?: string | null
          visitor_id?: string | null
          referrer?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
      }
      newsletter_campaigns: {
        Row: {
          id: string
          subject: string
          content: string
          status: string
          scheduled_at: string | null
          sent_at: string | null
          open_rate: number | null
          click_rate: number | null
          created_at: string
        }
        Insert: {
          id?: string
          subject: string
          content: string
          status?: string
          scheduled_at?: string | null
          sent_at?: string | null
          open_rate?: number | null
          click_rate?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          subject?: string
          content?: string
          status?: string
          scheduled_at?: string | null
          sent_at?: string | null
          open_rate?: number | null
          click_rate?: number | null
          created_at?: string
        }
      }
      ad_slots: {
        Row: {
          id: string
          name: string
          slot_key: string
          ad_type: string | null
          content: string | null
          is_active: boolean | null
          device_targeting: string | null
          impressions: number | null
          clicks: number | null
          revenue_generated: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slot_key: string
          ad_type?: string | null
          content?: string | null
          is_active?: boolean | null
          device_targeting?: string | null
          impressions?: number | null
          clicks?: number | null
          revenue_generated?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slot_key?: string
          ad_type?: string | null
          content?: string | null
          is_active?: boolean | null
          device_targeting?: string | null
          impressions?: number | null
          clicks?: number | null
          revenue_generated?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_bookmarks: {
        Row: {
          user_id: string
          article_id: string
          created_at: string | null
        }
        Insert: {
          user_id: string
          article_id: string
          created_at?: string | null
        }
        Update: {
          user_id?: string
          article_id?: string
          created_at?: string | null
        }
      }
    }
    Enums: {
      article_status: 'draft' | 'published' | 'archived'
      article_type: 'news' | 'review' | 'spotlight' | 'list'
    }
  }
}
