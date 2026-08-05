import type { Metadata } from "next";
import SubscribeForm from "./SubscribeForm";

export const metadata: Metadata = {
  title: "Subscribe | The Orange Pulp",
  description: "Subscribe to The Orange Pulp newsletter for weekly film takes.",
};

export default function SubscribePage() {
  return (
    <div className="w-full bg-secondary min-h-screen py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-xl w-full brutal-card p-8 sm:p-12 text-center">

        <span className="bg-primary text-foreground border-[3px] border-foreground px-4 py-1.5 text-label font-black uppercase tracking-widest inline-block mb-6">
          Newsletter
        </span>

        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black uppercase text-foreground mb-4 leading-tight">
          The Orange Pulp Letter
        </h1>
        <p className="text-base font-medium text-foreground/70 mb-8 leading-relaxed">
          Exclusive editorial pieces, early reviews, and industry insights — delivered every Friday.
        </p>

        <SubscribeForm />

        <p className="text-label font-bold uppercase tracking-widest text-muted-foreground mt-5">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
