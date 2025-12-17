import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, WelcomeHero, Footer } from "@/components/welcome";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main content area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
        {/* Logo */}
        <Logo size="lg" />

        {/* Store name and description */}
        <div className="text-center space-y-3 max-w-xs">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            Seashore Books
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Discover your next great read. Curated collections, personalized
            recommendations, and a community of book lovers.
          </p>
        </div>

        {/* Hero illustration */}
        <WelcomeHero />

        {/* CTA Button */}
        <Button
          size="lg"
          className="w-full max-w-xs rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-900/10"
        >
          Get Started
          <ArrowRight size={18} className="ml-1" />
        </Button>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
