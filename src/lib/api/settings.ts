import { createClient } from '@/lib/supabase/server'

export async function getSiteSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle()
  
  if (error || !data) {
    return {
      site_name: 'The Orange Pulp',
      site_description: 'The definitive source for film criticism and industry news.',
      maintenance_mode: false,
      social_links: { twitter: '', facebook: '', instagram: '' },
      feature_flags: {}
    }
  }
  return data
}
