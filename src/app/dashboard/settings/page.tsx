// @ts-nocheck
import { getSiteSettings } from '@/lib/api/settings'
import { updateSiteSettings } from '@/lib/actions/settings'
import { Save } from 'lucide-react'

export default async function SettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Admin</p>
        <h1 className="font-heading text-4xl font-black uppercase text-foreground">Settings</h1>
      </div>

      <form action={updateSiteSettings} className="space-y-8">
        
        <div className="brutal-card p-8">
          <h2 className="font-heading text-2xl font-black uppercase text-foreground mb-6 border-b-[3px] border-foreground pb-2">General</h2>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-foreground">Site Name</label>
              <input type="text" name="site_name" defaultValue={settings.site_name} className="w-full bg-background border-[3px] border-foreground p-3 font-bold" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-foreground">Site Description</label>
              <textarea name="site_description" defaultValue={settings.site_description} rows={3} className="w-full bg-background border-[3px] border-foreground p-3 font-bold" />
            </div>
            
            <div className="flex items-center gap-4 border-[3px] border-foreground p-4 bg-secondary">
              <input type="checkbox" name="maintenance_mode" id="maintenance" defaultChecked={settings.maintenance_mode} className="w-6 h-6 cursor-pointer accent-foreground" />
              <label htmlFor="maintenance" className="font-black uppercase tracking-widest text-sm cursor-pointer select-none text-foreground">Enable Maintenance Mode</label>
            </div>
          </div>
        </div>

        <div className="brutal-card p-8 opacity-50 cursor-not-allowed">
          <h2 className="font-heading text-2xl font-black uppercase text-foreground mb-6 border-b-[3px] border-foreground pb-2">Advertisements (Coming Soon)</h2>
          <p className="font-bold text-sm text-foreground/80 mb-4">Ad slots and DFP network IDs will be configured here.</p>
        </div>

        <button type="submit" className="brutal-button py-4 px-8 flex items-center justify-center gap-2">
          <Save size={16} /> Save Settings
        </button>

      </form>
    </div>
  )
}
