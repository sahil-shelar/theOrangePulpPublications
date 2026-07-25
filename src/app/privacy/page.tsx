import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | The Orange Pulp",
};

const LAST_UPDATED = "July 2025";

export default function PrivacyPage() {
  return (
    <div className="w-full bg-background min-h-screen">

      {/* Header */}
      <div className="border-b-[4px] border-foreground bg-muted">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50 mb-3">Legal</p>
          <h1 className="font-heading text-5xl md:text-7xl font-black uppercase text-foreground leading-none">
            Privacy Policy
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mt-3">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-16 space-y-12">

        {[
          {
            title: "1. Information We Collect",
            body: `We collect information you provide directly — such as your email address when subscribing to our newsletter or submitting a contact form. We also collect usage data automatically, including pages visited, time on site, and referring URLs via standard analytics tools. We do not sell your personal data.`,
          },
          {
            title: "2. How We Use Your Information",
            body: `We use your email address solely to send newsletters you opted into and transactional emails related to your account (if you have one). Analytics data is used in aggregate to understand readership and improve content. We never share your personal information with third-party advertisers.`,
          },
          {
            title: "3. Cookies",
            body: `We use essential cookies to maintain session state and functional cookies for preferences. We use third-party analytics cookies (e.g. Google Analytics) in anonymised form. You can disable cookies in your browser settings; some site features may degrade as a result.`,
          },
          {
            title: "4. Third-Party Services",
            body: `We use Supabase for data storage, Vercel for hosting, and Google Analytics for traffic measurement. Each of these services operates under their own privacy policies. We use Google AdSense for advertising, which may serve interest-based ads.`,
          },
          {
            title: "5. Data Retention",
            body: `Newsletter subscriber data is retained until you unsubscribe. Contact form submissions are retained for up to 12 months. Analytics data is retained per Google's standard retention periods (26 months by default).`,
          },
          {
            title: "6. Your Rights",
            body: `You may request access to, correction of, or deletion of your personal data at any time by emailing privacy@theorangepulp.com. We will respond within 30 days. You may also unsubscribe from the newsletter at any time via the link in any newsletter email.`,
          },
          {
            title: "7. Changes To This Policy",
            body: `We may update this policy from time to time. Material changes will be noted at the top of this page with a revised date. Continued use of the site after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: "8. Contact",
            body: `Privacy-related queries: privacy@theorangepulp.com`,
          },
        ].map(({ title, body }) => (
          <section key={title}>
            <h2 className="font-heading text-lg font-black uppercase text-foreground border-b-[3px] border-foreground pb-3 mb-4">
              {title}
            </h2>
            <p className="text-sm text-foreground/70 leading-loose">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
