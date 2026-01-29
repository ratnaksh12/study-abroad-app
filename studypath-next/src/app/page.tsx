import Link from 'next/link';
import { ArrowRight, GraduationCap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 relative z-10 glass rounded-b-xl mx-4 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary to-secondary rounded-lg flex items-center justify-center text-white shadow-lg">
            <GraduationCap size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">StudyPath</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth?mode=login" className="text-sm font-medium hover:text-primary transition-colors">
            Login
          </Link>
          <Link href="/auth?mode=signup" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg shadow-lg hover:bg-primary/90 transition-transform active:scale-95">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 mt-10 md:mt-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-indigo-100 text-xs font-medium text-primary mb-6 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          AI-Powered Guidance
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight">
          Plan your <span className="text-gradient">study-abroad journey</span> with a personal AI counsellor.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Get personalized university recommendations, step-by-step application guidance, and AI-powered insights to make your dream of studying abroad a reality.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/auth?mode=signup" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
            Start Your Journey
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/auth?mode=login" className="w-full sm:w-auto px-8 py-4 bg-white text-foreground font-semibold rounded-xl shadow-md hover:bg-gray-50 border border-slate-100 transition-all flex items-center justify-center">
            Resume Application
          </Link>
        </div>

        {/* Floating Elements (Visual Juice) */}
        <div className="absolute top-1/2 left-10 p-4 glass rounded-2xl shadow-xl transform -rotate-6 hidden lg:block animate-float">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <span className="font-bold">95%</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Match Chance</p>
              <p className="font-semibold text-sm">Design Master's</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-20 right-10 p-4 glass rounded-2xl shadow-xl transform rotate-3 hidden lg:block animate-float animation-delay-1000">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <i className="fas fa-university"></i>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target University</p>
              <p className="font-semibold text-sm">Shortlisted</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground relative z-10">
        © 2026 StudyPath. AI-Driven Future.
      </footer>
    </div>
  );
}
