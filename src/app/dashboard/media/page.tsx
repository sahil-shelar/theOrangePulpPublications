import { getMediaFiles } from '@/lib/api/media'
import MediaLibraryManager from '@/components/dashboard/MediaLibraryManager'

// Opt out of caching for media library so uploads show immediately
export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  const files = await getMediaFiles(100)
  
  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-4xl font-black uppercase text-foreground">Media Library</h1>
      </div>
      <MediaLibraryManager initialFiles={files} />
    </div>
  )
}
