import { Database } from '@/types/database'

export type ArticleRow = Database['public']['Tables']['articles']['Row']
export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type AuthorRow = Database['public']['Tables']['authors']['Row']
export type MovieRow = Database['public']['Tables']['movies']['Row']
export type ListItemRow = Database['public']['Tables']['list_items']['Row']
export type SpotlightWorkRow = Database['public']['Tables']['spotlight_works']['Row']

export type ListItemWithMovie = ListItemRow & { movies?: MovieRow | null }
export type SpotlightWorkWithMovie = SpotlightWorkRow & { movies?: MovieRow | null }

export type ArticleWithRelations = ArticleRow & {
  categories?: CategoryRow | null
  authors?: AuthorRow | null
  movies?: MovieRow | null
  list_items?: ListItemWithMovie[]
  spotlight_works?: SpotlightWorkWithMovie[]
}
