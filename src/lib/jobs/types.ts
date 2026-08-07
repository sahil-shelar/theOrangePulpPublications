export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retrying'
export type JobPriority = 'low' | 'normal' | 'high' | 'critical'

// jobs.priority is an INTEGER column, ordered DESC by the runner and by
// idx_jobs_status_priority, so a higher number is more urgent. Callers use the
// names above; this is the only place that knows the numeric encoding.
export const JOB_PRIORITY: Record<JobPriority, number> = {
  low: 1,
  normal: 5,
  high: 10,
  critical: 20,
}

export type JobType =
  | 'publish_article'
  | 'archive_article'
  | 'recalculate_trending'
  | 'recalculate_recommendations'
  | 'rebuild_cache'
  | 'contact_form'
  | 'generate_sitemap' 
  | 'regenerate_og_images'
  | 'refresh_search_index'
  | 'optimize_image' 
  | 'newsletter_queue' 
  | 'tmdb_sync' 
  | 'box_office_sync'
  | 'analytics_aggregation'
  | 'rss_import'
  | 'generate_ranking'
  | 'generate_spotlight'

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
