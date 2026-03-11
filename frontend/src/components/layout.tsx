import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import logo from "/generated_images/golden_hermetic_caduceus_symbol.png";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Teachings", path: "/modules" },
    { label: "Guide", path: "/guide" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src={logo} 
              alt="Hermetic Seal" 
              className="h-10 w-10 object-contain transition-transform group-hover:rotate-180 duration-700"
            />
            <span className="font-serif text-xl font-semibold tracking-wider text-primary">
              THE HERMETIC WAY
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path} 
                className={cn(
                  "text-sm font-medium tracking-wide transition-colors hover:text-primary",
                  location === item.path ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/modules">
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all">
                Begin Journey
              </Button>
            </Link>
          </div>

          {/* Mobile Nav Toggle */}
          <button 
            className="md:hidden text-muted-foreground hover:text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/10 bg-background p-4 animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={cn(
                    "text-base font-medium transition-colors hover:text-primary block py-2",
                    location === item.path ? "text-primary" : "text-muted-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-black/20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Logo" className="h-12 w-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500" />
          </div>
          <p className="font-serif text-muted-foreground mb-4">
            "The greatest evil in man is the not knowing God."
          </p>
          <div className="text-sm text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Hermetic Teachings. Honoring the lineage of Hermes Trismegistus.
          </div>
        </div>
      </footer>
    </div>
  );
}
