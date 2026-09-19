import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

const cols = [
  {
    title: "Platform",
    links: [
      { to: "/how-it-works", label: "How it works" },
      { to: "/pricing", label: "Pricing" },
      { to: "/safety", label: "Safety & insurance" },
      { to: "/blog", label: "Blog" },
      { to: "/about", label: "About" },
    ],
  },
  {
    title: "For drivers",
    links: [
      { to: "/drivers", label: "Become a Runner" },
      { to: "/signup", search: { intent: "driver" }, label: "Driver application" },
      { to: "/faq", label: "Driver FAQ" },
    ],
  },
  {
    title: "Support",
    links: [
      { to: "/contact", label: "Contact us" },
      { to: "/faq", label: "Help center" },
      { to: "/app/report", label: "Report an issue" },
      { to: "/refund-policy", label: "Refunds" },
      { to: "/share", label: "Share / QR code" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms of service" },
      { to: "/privacy", label: "Privacy policy" },
      { to: "/cookies", label: "Cookie policy" },
      { to: "/community-guidelines", label: "Community guidelines" },
      { to: "/accessibility", label: "Accessibility" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="container-app py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_3fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Anything. Anytime. Anywhere. On‑demand local delivery for the things
              you can't go get yourself.
            </p>
            <p className="mt-6 text-xs text-muted-foreground">
              support@myrunner.shop
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {cols.map((c) => (
              <div key={c.title}>
                <h4 className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {c.title}
                </h4>
                <ul className="mt-4 space-y-2">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        {...("search" in l && l.search ? { search: l.search } : {})}
                        className="text-sm text-foreground/80 transition-colors hover:text-gold"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} MyRunner Inc. All rights reserved.</p>
          <p className="font-serif italic">Anything · Anytime · Anywhere</p>
        </div>
      </div>
    </footer>
  );
}
