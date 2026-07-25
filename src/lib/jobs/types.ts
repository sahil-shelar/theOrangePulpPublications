export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retrying'
export type JobPriority = 'low' | 'normal' | 'high' | 'critical'

export type JobType = 
  | 'publish_article' 
  | 'archive_article' 
  | 'recalculate_trending' 
  | 'rebuild_cache' 
  | 'generate_sitemap' 
  | 'regenerate_og_images'
  | 'refresh_search_index'
  | 'optimize_image' 
  | 'newsletter_queue' 
  | 'tmdb_sync' 
  | 'box_office_sync' 
  | 'analytics_aggregation' 
  | 'rss_import'

export interface Job {
  id: string
  job_type: JobType
  payload: Record<string, any>
  status: JobStatus
  priority: JobPriority
  attempts: number
  scheduled_at: string
  started_at?: string
  completed_at?: string
  failed_reason?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface JobLog {
  id: string
  job_id: string
  level: 'info' | 'warning' | 'error'
  message: string
  metadata?: Record<string, any>
  created_at: string
}
