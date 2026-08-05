import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | The Orange Pulp",
};

const LAST_UPDATED = "July 2025";

export default function TermsPage() {
  return (
    <div className="w-full bg-background min-h-screen">

      {/* Header */}
      <div className="border-b-[4px] border-foreground bg-muted">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
          <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Legal</p>
          <h1 className="font-heading text-5xl md:text-7xl font-black uppercase text-foreground leading-none">
            Terms of Use
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-3">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-16 space-y-12">

        {[
          {
            title: "1. Acceptance of Terms",
            body: `By accessing or using theorangepulp.com ("the Site"), you agree to be bound by these Terms of Use. If you do not agree, do not use the Site. We reserve the right to modify these terms at any time; continued use of the Site constitutes acceptance of any changes.`,
          },
          {
            title: "2. Content Ownership",
            body: `All editorial content — reviews, articles, essays, rankings, and original photography — is owned by The Orange Pulp or its contributing authors. You may not reproduce, republish, or redistribute content without prior written permission. Brief quotation with attribution for editorial commentary purposes is permitted under fair use.`,
          },
          {
            title: "3. User Conduct",
            body: `You agree not to use the Site to post or transmit content that is unlawful, harassing, defamatory, or infringing. You may not attempt to gain unauthorised access to any portion of the Site or its underlying infrastructure. Automated scraping of content without permission is prohibited.`,
          },
          {
            title: "4. Disclaimer of Warranties",
            body: `The Site is provided "as is" without warranties of any kind, express or implied. We do not guarantee that the Site will be uninterrupted, error-free, or free of viruses. Film ratings and reviews represent editorial opinion only and are not guarantees of quality.`,
          },
          {
            title: "5. Limitation of Liability",
            body: `To the fullest extent permitted by law, The Orange Pulp and its operators will not be liable for any indirect, incidental, or consequential damages arising from your use of the Site, including but not limited to loss of data or revenue.`,
          },
          {
            title: "6. Third-Party Links",
            body: `The Site may contain links to third-party websites. We are not responsible for the content or privacy practices of those sites. Links do not constitute endorsement.`,
          },
          {
            title: "7. Governing Law",
            body: `These terms are governed by the laws of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.`,
          },
          {
            title: "8. Contact",
            body: `Legal queries: legal@theorangepulp.com`,
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
