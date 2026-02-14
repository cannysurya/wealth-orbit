import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-white selection:bg-teal-500/30">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-blue-600">
              <span className="text-lg font-bold text-white">W</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Wealth Orbit</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-white text-black hover:bg-zinc-200">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[120px]" />

          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-teal-300 shadow-xl backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-teal-400" />
              <span>v1.0 is now live</span>
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
              Master Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500">
                Financial Gravity
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
              Stop guessing where your money goes. Track assets, manage liabilities,
              and project your net worth with precision. The ultimate dashboard for your personal wealth.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button size="lg" className="h-12 min-w-[160px] rounded-full bg-gradient-to-r from-teal-500 to-blue-600 px-8 text-base font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all hover:scale-105">
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-12 min-w-[160px] rounded-full border-white/10 bg-transparent text-base hover:bg-white/5 hover:text-white">
                  Live Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="mt-32 grid max-w-5xl gap-6 px-4 sm:grid-cols-3">
            <FeatureCard
              icon={<Wallet className="h-6 w-6 text-teal-400" />}
              title="Asset Tracking"
              description="Monitor stocks, real estate, crypto, and cash in one unified view."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6 text-purple-400" />}
              title="Liability Management"
              description="Keep loans and debts under control. Visualize your path to debt-free living."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-blue-400" />}
              title="Wealth Projections"
              description="Forecast your future net worth based on current growth rates and life events."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-zinc-500">
        <p>© 2026 Wealth Orbit. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-left transition-all hover:border-white/10 hover:bg-white/[0.04]">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  );
}
