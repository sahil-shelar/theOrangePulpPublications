"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

type Props = {
  userEmail?: string;
  userRole?: string;
};

export default function DashboardMobileHeader({ userEmail, userRole }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b-[3px] border-foreground bg-muted fixed top-16 left-0 right-0 z-40">
        <span className="font-heading text-sm font-black uppercase tracking-widest text-foreground">
          Dashboard
        </span>
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 border-[2px] border-foreground hover:bg-background transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>


      {/* Slide-over overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 max-w-[85vw] bg-muted border-r-[3px] border-foreground h-full overflow-y-auto">
            <div className="flex items-center justify-end p-3 border-b-[2px] border-foreground/20">
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 border-[2px] border-foreground hover:bg-background transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            <DashboardSidebar
              userEmail={userEmail}
              userRole={userRole}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
