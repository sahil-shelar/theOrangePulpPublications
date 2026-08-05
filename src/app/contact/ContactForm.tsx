"use client";

import { useState, useTransition } from "react";
import { submitContact } from "@/lib/actions/contact";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await submitContact(fd);
        setSent(true);
      } catch (err: any) {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    });
  }

  if (sent) {
    return (
      <div className="border-[3px] border-foreground bg-muted px-8 py-12 text-center">
        <p className="font-heading text-2xl font-black uppercase text-foreground">Message Sent</p>
        <p className="text-sm font-bold text-muted-foreground mt-2 uppercase tracking-widest">We'll get back to you within 2 business days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {error && (
        <div className="border-[3px] border-foreground bg-red-500 text-white px-5 py-4 font-bold text-sm mb-0">
          {error}
        </div>
      )}
      {[
        { id: "name",    label: "Full Name",     type: "text",  required: true },
        { id: "email",   label: "Email Address", type: "email", required: true },
        { id: "subject", label: "Subject",       type: "text",  required: true },
      ].map(({ id, label, type, required }) => (
        <div key={id} className="border-[3px] border-foreground border-b-0">
          <label htmlFor={id} className="block text-label font-black uppercase tracking-[0.2em] text-muted-foreground px-5 pt-4 pb-1">
            {label}
          </label>
          <input
            id={id}
            name={id}
            type={type}
            required={required}
            className="w-full bg-transparent px-5 pb-4 text-sm font-bold text-foreground placeholder:text-muted-foreground"
            placeholder={`Enter your ${label.toLowerCase()}`}
          />
        </div>
      ))}

      <div className="border-[3px] border-foreground border-b-0">
        <label htmlFor="message" className="block text-label font-black uppercase tracking-[0.2em] text-muted-foreground px-5 pt-4 pb-1">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          className="w-full bg-transparent px-5 pb-4 text-sm font-bold text-foreground placeholder:text-muted-foreground resize-none"
          placeholder="Write your message here..."
        />
      </div>

      <div className="border-[3px] border-foreground p-5">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-foreground text-background border-[3px] border-foreground px-6 py-4 text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
        >
          {isPending ? 'Sending…' : 'Send Message'}
        </button>
      </div>
    </form>
  );
}
