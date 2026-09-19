import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const nav = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/drivers", label: "Drive" },
  { to: "/safety", label: "Safety" },
  { to: "/blog", label: "Blog" },
  { to: "/faq", label: "FAQ" },
  { to: "/share", label: "Share" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isAdmin } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container-app flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {isAdmin && (
            <Button asChild variant="ghost" size="sm" className="text-gold">
              <Link to="/admin/dashboard"><ShieldCheck className="mr-1 size-4" /> Admin</Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-gold text-primary-foreground hover:bg-gold/90">
            <Link to="/signup">Get started</Link>
          </Button>
        </div>
        <button
          className="md:hidden text-foreground"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="container-app flex flex-col gap-1 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>
              </Button>
              <Button asChild size="sm" className="flex-1 bg-gold text-primary-foreground hover:bg-gold/90">
                <Link to="/signup" onClick={() => setOpen(false)}>Get started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
