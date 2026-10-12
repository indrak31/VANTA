import { useState, useEffect } from 'react'
import {
  ArrowRight,
  Play,
  CheckCircle2,
  Shield,
  Layers,
  Database,
  Terminal,
  Activity,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react'
import { SignalConvergenceVisual } from './SignalConvergenceVisual'
import { ProductPreviewSection } from './ProductPreviewSection'
import { PrioritizationSimulatorSection } from './PrioritizationSimulatorSection'
import { StorytellingSection } from './StorytellingSection'
import { DemoModal } from './DemoModal'
import './landing.css'

export function LandingPage({ onLaunchApp }: { onLaunchApp: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [demoModalOpen, setDemoModalOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="landing-container">
      {/* Background visual atmosphere */}
      <div className="landing-bg-grid" />
      <div className="landing-bg-glow" />

      {/* Navigation */}
      <header className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
        <a href="#top" className="landing-brand">
          <img src="/vanta-brand.png" alt="VANTA" className="landing-brand-logo" />
          <span className="landing-brand-tag">INTELLIGENCE</span>
        </a>

        <nav className="landing-nav-links">
          <a href="#product" className="landing-nav-link">Product</a>
          <a href="#how-it-works" className="landing-nav-link">How it works</a>
          <a href="#use-cases" className="landing-nav-link">Use cases</a>
          <a href="#adaption" className="landing-nav-link">Adaption</a>
        </nav>

        <div className="landing-nav-actions">
          <button
            className="vanta-btn-secondary"
            onClick={() => setDemoModalOpen(true)}
          >
            <Play size={13} fill="currentColor" /> Watch demo
          </button>
          <button
            className="vanta-btn-primary"
            onClick={onLaunchApp}
          >
            Explore Vanta <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="top">
        {/* Left Column */}
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            CUSTOMER INTELLIGENCE, REDEFINED
          </div>

          <h1 className="hero-headline">
            Every signal.
            <br />
            <span className="hero-headline-accent">One clear direction.</span>
          </h1>

          <p className="hero-copy">
            Vanta transforms scattered customer feedback into clear insights, prioritized issues, and actionable decisions.
          </p>

          <div className="hero-ctas">
            <button className="vanta-btn-primary" onClick={onLaunchApp}>
              Explore Vanta <ArrowRight size={15} />
            </button>
            <button
              className="vanta-btn-secondary"
              onClick={() => setDemoModalOpen(true)}
            >
              <Play size={14} fill="currentColor" /> Watch demo
            </button>
          </div>

          {/* Verifiable Capability Strip */}
          <div className="hero-proof-strip">
            <div className="proof-item">
              <Zap size={18} className="proof-item-icon" />
              <div className="proof-item-text">
                <span className="proof-item-label">4 Ingestion Channels</span>
                <span className="proof-item-sub">Zendesk, App Store, Discord, Intercom</span>
              </div>
            </div>

            <div className="proof-item">
              <SlidersHorizontal size={18} className="proof-item-icon" />
              <div className="proof-item-text">
                <span className="proof-item-label">Deterministic Priority</span>
                <span className="proof-item-sub">Formula-driven 0-100 scoring</span>
              </div>
            </div>

            <div className="proof-item">
              <Database size={18} className="proof-item-icon" />
              <div className="proof-item-text">
                <span className="proof-item-label">Adaption Pipeline</span>
                <span className="proof-item-sub">Domain semantic fine-tuning</span>
              </div>
            </div>

            <div className="proof-item">
              <Shield size={18} className="proof-item-icon" />
              <div className="proof-item-text">
                <span className="proof-item-label">100% Traceable Citations</span>
                <span className="proof-item-sub">Direct verbatim customer evidence</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Signature Animated Signal Convergence Visual */}
        <div className="hero-visual">
          <SignalConvergenceVisual />
        </div>
      </section>

      {/* Product Preview Section with Live Recharts & Filters */}
      <ProductPreviewSection onExploreApp={onLaunchApp} />

      {/* Interactive Issue Prioritization Simulator */}
      <PrioritizationSimulatorSection />

      {/* Product Storytelling Narrative */}
      <StorytellingSection />

      {/* Final Cinematic CTA Section */}
      <section className="final-cta-section">
        <div className="final-cta-box">
          <span className="hero-eyebrow">READY FOR ENTERPRISE DEPLOYMENT</span>
          <h2 className="final-cta-title">Turn feedback into forward momentum.</h2>
          <p className="final-cta-copy">
            Bring customer signals together. Find the issues that matter. Make better-informed decisions.
          </p>
          <div className="final-cta-actions">
            <button className="vanta-btn-primary" onClick={onLaunchApp}>
              Explore Vanta <ArrowRight size={15} />
            </button>
            <button
              className="vanta-btn-secondary"
              onClick={() => setDemoModalOpen(true)}
            >
              <Play size={14} fill="currentColor" /> Watch demo
            </button>
          </div>

          <div className="final-cta-badges">
            <div className="final-badge-item">
              <CheckCircle2 size={15} color="#34D399" />
              <span>Zero Hallucination Scoring</span>
            </div>
            <div className="final-badge-item">
              <CheckCircle2 size={15} color="#38BDF8" />
              <span>Sub-Second Deterministic Rankings</span>
            </div>
            <div className="final-badge-item">
              <CheckCircle2 size={15} color="#A78BFA" />
              <span>SOC2 Type II Aligned</span>
            </div>
          </div>
        </div>
      </section>

      {/* Minimalist Enterprise Footer */}
      <footer className="landing-footer">
        <div className="footer-left">
          <img src="/vanta-brand.png" alt="VANTA" style={{ height: 20 }} />
          <span className="footer-copy">
            © 2026 Vanta Systems Inc. Every signal. One clear direction.
          </span>
        </div>

        <div className="footer-links">
          <a href="#product" className="footer-link">Product</a>
          <a href="#how-it-works" className="footer-link">Simulator</a>
          <a href="#adaption" className="footer-link">Adaption</a>
          <span
            className="footer-link"
            onClick={onLaunchApp}
            role="button"
            tabIndex={0}
          >
            Launch OS
          </span>
        </div>

        <div className="footer-status-indicator">
          <span className="status-dot-active" />
          <span>All Systems Operational · Gateway Active</span>
        </div>
      </footer>

      {/* Interactive Video / Product Walkthrough Demo Modal */}
      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onLaunchApp={onLaunchApp}
      />
    </div>
  )
}
