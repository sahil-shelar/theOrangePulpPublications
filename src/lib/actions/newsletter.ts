'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'

function buildEmailHtml(subject: string, content: string, siteUrl: string, subscriberId: string): string {
  const unsubscribeUrl = `${siteUrl}/api/unsubscribe?id=${subscriberId}`
  const escapedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n').join('<br>')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 24px;">

    <div style="text-align:center;border-bottom:3px solid #1A1A1A;padding-bottom:24px;margin-bottom:40px;">
      <a href="${siteUrl}" style="font-family:Arial,sans-serif;font-size:20px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#1A1A1A;text-decoration:none;">
        THE ORANGE PULP
      </a>
    </div>

    <h1 style="font-family:Arial,sans-serif;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;color:#1A1A1A;margin:0 0 28px 0;line-height:1.1;">
      ${subject}
    </h1>

    <div style="font-size:16px;line-height:1.75;color:#1A1A1A;">
      ${escapedContent}
    </div>

    <div style="margin:48px 0;background:#E2BFCA;border:3px solid #1A1A1A;padding:32px;text-align:center;">
      <a href="${siteUrl}" style="font-family:Arial,sans-serif;display:inline-block;background:#1A1A1A;color:#FAF7F2;padding:14px 32px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;text-decoration:none;font-size:11px;">
        READ MORE AT THE ORANGE PULP &rarr;
      </a>
    </div>

    <div style="border-top:3px solid #1A1A1A;padding-top:24px;text-align:center;">
      <p style="font-family:Arial,sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin:0 0 8px 0;">
        You're receiving this because you subscribed to The Orange Pulp newsletter.
      </p>
      <a href="${unsubscribeUrl}" style="font-family:Arial,sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#888;">
        Unsubscribe
      </a>
    </div>

  </div>
</body>
</html>`
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') throw new Error('Forbidden: Admin only')
  return user
}

export async function createCampaign(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from('newsletter_campaigns').insert({
    subject: formData.get('subject') as string,
    content: formData.get('content') as string,
    status: 'draft',
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/newsletter')
  redirect('/dashboard/newsletter')
}

export async function sendCampaign(formData: FormData) {
  await requireAdmin()

  const campaignId = formData.get('campaignId') as string
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: campaign } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) throw new Error('Campaign not found')
  if (campaign.status === 'sent') throw new Error('Campaign already sent')

  const { data: subscribers } = await adminClient
    .from('newsletter_subscribers')
    .select('id, email')
    .eq('is_active', true)

  if (!subscribers || subscribers.length === 0) throw new Error('No active subscribers')

  const resend = new Resend(process.env.RESEND_API_KEY)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const content = campaign.content || ''

  const BATCH = 100
  for (let i = 0; i < subscribers.length; i += BATCH) {
    const batch = subscribers.slice(i, i + BATCH)
    await resend.batch.send(
      batch.map((sub) => ({
        from: 'The Orange Pulp <noreply@theorangepulp.blog>',
        to: sub.email,
        subject: campaign.subject,
        html: buildEmailHtml(campaign.subject, content, siteUrl, sub.id),
      }))
    )
  }

  await supabase
    .from('newsletter_campaigns')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', campaignId)

  revalidatePath('/dashboard/newsletter')
  redirect('/dashboard/newsletter')
}
