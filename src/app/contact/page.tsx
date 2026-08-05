import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact | The Orange Pulp",
  description: "Get in touch with The Orange Pulp team.",
};

export default function ContactPage() {
  return (
    <div className="w-full bg-background min-h-screen">

      {/* Header */}
      <div className="border-b-[4px] border-foreground bg-secondary">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
          <p className="text-label font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Reach Out</p>
          <h1 className="font-heading text-6xl md:text-8xl font-black uppercase text-foreground leading-none">
            Contact
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">

        {/* Contact info */}
        <div className="md:col-span-4 space-y-0">
          <h2 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Get In Touch</h2>
          {[
            { label: "General Enquiries", value: "hello@theorangepulp.com" },
            { label: "Editorial", value: "editorial@theorangepulp.com" },
            { label: "Press & PR", value: "press@theorangepulp.com" },
            { label: "Advertising", value: "ads@theorangepulp.com" },
          ].map(({ label, value }) => (
            <div key={label} className="border-[3px] border-foreground border-b-0 last:border-b-[3px] px-6 py-5">
              <p className="text-label font-black uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</p>
              <p className="text-sm font-bold text-foreground">{value}</p>
            </div>
          ))}

          <div className="pt-8">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
              We aim to respond within 2 business days. For urgent press inquiries, mark your subject line URGENT.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-8">
          <h2 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Send A Message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
