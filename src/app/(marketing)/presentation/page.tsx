"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Grid, 
  X, 
  Download, 
  ExternalLink,
  BookOpen,
  MapPin,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  Sparkles,
  Layers,
  ArrowRight
} from "lucide-react";

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const totalSlides = 10;

  // Synthesize sound on slide change using Web Audio API
  const playWhoosh = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(340, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio autoplay restrictions or unsupported
    }
  };

  const goToSlide = (idx: number) => {
    const nextIdx = Math.max(0, Math.min(totalSlides - 1, idx));
    setCurrentSlide(nextIdx);
    playWhoosh();
  };

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    } else if (autoplay) {
      goToSlide(0);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showThumbnails) {
        if (e.key === "Escape") setShowThumbnails(false);
        return;
      }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "t" || e.key === "T") {
        setShowThumbnails((prev) => !prev);
      } else if (e.key === "Home") {
        goToSlide(0);
      } else if (e.key === "End") {
        goToSlide(totalSlides - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, showThumbnails, autoplay, soundEnabled]);

  // Autoplay timer
  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [autoplay, currentSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const slideTitles = [
    "Bookyy Hero & Vision",
    "Market Problem: Dormant Shelves",
    "The 4 Foundation Pillars",
    "UI Showcase: Discovery & Maps",
    "UI Showcase: 1-Click Listing",
    "Escrow & Handover State Machine",
    "TrustScore™ & Community Safety",
    "Editorial Aesthetics & Motion",
    "Modern Engineering Architecture",
    "Business Model, Roadmap & CTA",
  ];

  return (
    <div className="relative w-screen h-screen bg-[#0B0F19] text-white overflow-hidden select-none font-sans flex flex-col justify-between">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#FF008C] opacity-15 blur-[130px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] rounded-full bg-[#1CE8ED] opacity-15 blur-[130px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#9982DE] opacity-10 blur-[140px]" />
      </div>

      {/* Top Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-[4px] bg-white/10 z-50">
        <div 
          className="h-full bg-gradient-to-r from-[#1CE8ED] via-[#FFD24A] to-[#FF008C] transition-all duration-300 shadow-[0_0_12px_#FF008C]"
          style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-40 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#161C2C]/80 border border-white/10 backdrop-blur-md hover:border-[#FF008C] transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF008C] shadow-[0_0_8px_#FF008C] animate-ping" />
            <span className="font-extrabold text-sm tracking-wider uppercase text-white">BOOKYY PLATFORM DECK</span>
          </Link>
          <span className="hidden md:inline-block text-xs font-mono text-white/40">
            {slideTitles[currentSlide]}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md flex items-center gap-1.5 transition-all ${
              soundEnabled ? "border-[#1CE8ED]/40 text-[#1CE8ED] bg-[#1CE8ED]/10" : "border-white/10 text-white/50 bg-[#161C2C]"
            }`}
            title="Toggle audio feedback"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? "Sound ON" : "Sound OFF"}</span>
          </button>

          <button 
            onClick={() => setAutoplay(!autoplay)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md flex items-center gap-1.5 transition-all ${
              autoplay ? "border-[#FF008C] text-[#FF008C] bg-[#FF008C]/15" : "border-white/10 text-white/60 bg-[#161C2C]"
            }`}
            title="Toggle Autoplay"
          >
            {autoplay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoplay ? "Pause" : "Autoplay"}</span>
          </button>

          <button 
            onClick={() => setShowThumbnails(true)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/10 text-white/70 bg-[#161C2C] hover:border-white/30 backdrop-blur-md flex items-center gap-1.5 transition-all"
            title="View all slides (T)"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>

          <button 
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/10 text-white/70 bg-[#161C2C] hover:border-white/30 backdrop-blur-md flex items-center gap-1.5 transition-all"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <a 
            href="/Bookyy_Platform_Showcase.pptx" 
            download 
            className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#FFD24A]/40 text-[#FFD24A] bg-[#FFD24A]/10 hover:bg-[#FFD24A]/20 backdrop-blur-md flex items-center gap-1.5 transition-all"
            title="Download PowerPoint File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.PPTX</span>
          </a>

          <Link
            href="/browse"
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FF008C] text-white hover:bg-[#ff1a98] shadow-[0_0_12px_rgba(255,0,140,0.4)] flex items-center gap-1.5 transition-all"
          >
            <span>Live App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Slide Body */}
      <main className="relative z-30 flex-1 px-8 sm:px-14 lg:px-20 py-2 flex flex-col justify-center overflow-y-auto">
        
        {/* SLIDE 0: HERO TITLE */}
        {currentSlide === 0 && (
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF008C]/15 border border-[#FF008C]/40 text-[#FF008C] font-mono text-xs font-bold tracking-widest uppercase mb-5">
              ⚡ THE NEXT-GEN LITERARY MARKETPLACE
            </div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-4 bg-gradient-to-r from-white via-[#FF008C] to-[#1CE8ED] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(255,0,140,0.4)]">
              BOOKYY
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-white mb-3">
              Peer-to-Peer Book Sharing & Community Escrow Engine
            </p>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed mb-8">
              Unlocking millions of brilliant books trapped on dormant home shelves.
              Discover fresh hardcover fiction, lend idle titles to local neighbors, and borrow safely with
              automated deposit escrow and verified TrustScores™.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              <div className="p-4 rounded-2xl bg-[#161C2C]/90 border border-white/10 text-center hover:border-[#1CE8ED] hover:shadow-[0_0_20px_rgba(28,232,237,0.25)] transition-all">
                <div className="text-2xl font-black text-[#1CE8ED] mb-1">5 - 10 km</div>
                <div className="text-xs text-slate-400 font-medium">Hyper-Local Radius</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#161C2C]/90 border border-white/10 text-center hover:border-[#FF008C] hover:shadow-[0_0_20px_rgba(255,0,140,0.25)] transition-all">
                <div className="text-2xl font-black text-[#FF008C] mb-1">100%</div>
                <div className="text-xs text-slate-400 font-medium">Escrow Protection</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#161C2C]/90 border border-white/10 text-center hover:border-[#FFD24A] hover:shadow-[0_0_20px_rgba(255,210,74,0.25)] transition-all">
                <div className="text-2xl font-black text-[#FFD24A] mb-1">1-Click</div>
                <div className="text-xs text-slate-400 font-medium">Google Books Autofill</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#161C2C]/90 border border-white/10 text-center hover:border-[#9982DE] hover:shadow-[0_0_20px_rgba(153,130,222,0.25)] transition-all">
                <div className="text-2xl font-black text-[#9982DE] mb-1">60 FPS</div>
                <div className="text-xs text-slate-400 font-medium">Editorial Smooth Motion</div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: THE PROBLEM */}
        {currentSlide === 1 && (
          <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
            <div className="inline-block px-3 py-1 rounded-full bg-[#FF008C]/15 border border-[#FF008C]/40 text-[#FF008C] font-mono text-xs font-bold mb-2">
              MARKET OPPORTUNITY
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">The Dilemma: Books Trapped On Dormant Shelves</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-6">Physical books are beloved cultural artifacts, but modern consumer friction leaves vast reading potential untapped.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#FF008C] hover:shadow-[0_10px_30px_rgba(255,0,140,0.2)] transition-all">
                <div className="text-3xl mb-3">📚</div>
                <h3 className="text-lg font-bold text-white mb-2">85% Physical Book Dormancy</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Over 85% of purchased books are read exactly once, after which they sit permanently frozen on shelves for years, representing billions in stranded value.</p>
                <div className="mt-4 text-xs font-mono text-[#FF008C] font-semibold">#StrandedInventory</div>
              </div>
              <div className="p-6 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#FFD24A] hover:shadow-[0_10px_30px_rgba(255,210,74,0.2)] transition-all">
                <div className="text-3xl mb-3">💸</div>
                <h3 className="text-lg font-bold text-white mb-2">Skyrocketing Retail Costs</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Hardcover fiction and technical textbooks retail at ₹600 - ₹1500+ ($25 - $40). Continuous purchasing is financially prohibitive for avid readers and students.</p>
                <div className="mt-4 text-xs font-mono text-[#FFD24A] font-semibold">#AffordabilityCrisis</div>
              </div>
              <div className="p-6 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#1CE8ED] hover:shadow-[0_10px_30px_rgba(28,232,237,0.2)] transition-all">
                <div className="text-3xl mb-3">⏳</div>
                <h3 className="text-lg font-bold text-white mb-2">Library Backlogs & Distance</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Public libraries have weeks-long hold queues for popular bestsellers, strict return schedules, and sparse geographical coverage outside metropolitan cores.</p>
                <div className="mt-4 text-xs font-mono text-[#1CE8ED] font-semibold">#AccessibilityBarrier</div>
              </div>
              <div className="p-6 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#9982DE] hover:shadow-[0_10px_30px_rgba(153,130,222,0.2)] transition-all">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="text-lg font-bold text-white mb-2">The "Lost Book" Lending Anxiety</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Lending books to casual acquaintances frequently results in unreturned or damaged copies with zero accountability. Readers hesitate to share without financial assurance.</p>
                <div className="mt-4 text-xs font-mono text-[#9982DE] font-semibold">#SocialFriction</div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: FOUR PILLARS */}
        {currentSlide === 2 && (
          <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
            <div className="inline-block px-3 py-1 rounded-full bg-[#1CE8ED]/15 border border-[#1CE8ED]/40 text-[#1CE8ED] font-mono text-xs font-bold mb-2">
              PLATFORM ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">The Bookyy Solution: Four Core Pillars</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-6">Bookyy transforms any residential neighborhood or college campus into an active, self-sustaining lending library.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#1CE8ED] hover:shadow-[0_10px_30px_rgba(28,232,237,0.2)] transition-all flex flex-col">
                <div className="text-3xl mb-3">📍</div>
                <h3 className="text-base font-bold text-[#1CE8ED] mb-2">1. Hyper-Local Discovery</h3>
                <p className="text-xs text-slate-300 leading-relaxed flex-1">Geospatial radius filtering (1-20 km) with Leaflet maps. Borrow from neighbors down the street without waiting for courier shipments.</p>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">Interactive Map Pins</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#FF008C] hover:shadow-[0_10px_30px_rgba(255,0,140,0.2)] transition-all flex flex-col">
                <div className="text-3xl mb-3">🏷️</div>
                <h3 className="text-base font-bold text-[#FF008C] mb-2">2. Flexible Lending Modes</h3>
                <p className="text-xs text-slate-300 leading-relaxed flex-1">Lenders choose PAID (daily/weekly/monthly rates), FREE community lending, or BOTH. Smart deposit algorithm calculates fair collateral.</p>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">Earn Passive Yield</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#FFD24A] hover:shadow-[0_10px_30px_rgba(255,210,74,0.2)] transition-all flex flex-col">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="text-base font-bold text-[#FFD24A] mb-2">3. Google Books Ingestion</h3>
                <p className="text-xs text-slate-300 leading-relaxed flex-1">Scan ISBN or type title: metadata, official cover artwork, synopsis, and author are fetched in milliseconds with zero manual typing.</p>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">Under 30-Sec Listing</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#69FE6F] hover:shadow-[0_10px_30px_rgba(105,254,111,0.2)] transition-all flex flex-col">
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="text-base font-bold text-[#69FE6F] mb-2">4. Escrow & Safety</h3>
                <p className="text-xs text-slate-300 leading-relaxed flex-1">Refundable security deposits held in escrow, 2-way handover photos, 15-minute payment locks, and dynamic TrustScore™ algorithms.</p>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">Zero Financial Risk</div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: UI SHOWCASE - BROWSE */}
        {currentSlide === 3 && (
          <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
            <div className="inline-block px-3 py-1 rounded-full bg-[#FF008C]/15 border border-[#FF008C]/40 text-[#FF008C] font-mono text-xs font-bold mb-2">
              USER EXPERIENCE SHOWCASE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">Interactive Discovery & Geospatial Search (/browse)</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-6">Explore books in your immediate vicinity with dual-mode grid and interactive map views.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Mockup */}
              <div className="lg:col-span-7 bg-[#0D121F] rounded-2xl border border-white/15 overflow-hidden shadow-2xl">
                <div className="px-4 py-2.5 bg-[#161D2E] border-b border-white/10 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="ml-3 font-mono text-[11px] text-slate-400 bg-[#0C101A] px-3 py-1 rounded">https://bookyy.app/browse</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full bg-[#FF008C] text-white font-bold cursor-pointer">All Books (48)</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white cursor-pointer hover:bg-white/20">Fiction</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white cursor-pointer hover:bg-white/20">Sci-Fi</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white cursor-pointer hover:bg-white/20">Comics</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#161C2C] border border-white/10 flex gap-4 items-center hover:border-[#FF008C] transition-colors">
                    <div className="w-16 h-20 rounded bg-gradient-to-br from-[#FF008C] to-[#9982DE] flex items-center justify-center text-2xl shadow-lg">📖</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white truncate">Tomorrow, and Tomorrow, and Tomorrow</div>
                      <div className="text-xs text-slate-400">by Gabrielle Zevin • 📍 1.4 km away</div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF008C]/20 text-[#FF008C] border border-[#FF008C]/30">₹15/DAY</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1CE8ED]/20 text-[#1CE8ED] border border-[#1CE8ED]/30">₹200 DEPOSIT</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#69FE6F]/20 text-[#69FE6F] border border-[#69FE6F]/30">NEAR MINT</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#161C2C] border border-white/10 flex gap-4 items-center hover:border-[#1CE8ED] transition-colors">
                    <div className="w-16 h-20 rounded bg-gradient-to-br from-[#1CE8ED] to-[#0077B6] flex items-center justify-center text-2xl shadow-lg">🪐</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white truncate">Project Hail Mary</div>
                      <div className="text-xs text-slate-400">by Andy Weir • 📍 2.8 km away</div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#69FE6F]/20 text-[#69FE6F] border border-[#69FE6F]/30">FREE BORROW</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1CE8ED]/20 text-[#1CE8ED] border border-[#1CE8ED]/30">₹150 DEPOSIT</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFD24A]/20 text-[#FFD24A] border border-[#FFD24A]/30">EXCELLENT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Highlights */}
              <div className="lg:col-span-5 space-y-3">
                <div className="p-4 rounded-xl bg-[#161C2C] border border-white/10 hover:border-[#1CE8ED] transition-all">
                  <div className="font-bold text-[#1CE8ED] text-sm mb-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> Real-Time Map Clustering
                  </div>
                  <div className="text-xs text-slate-400">Integrated Leaflet map pinpoints active lenders within your radius with instant distance badges calculated using Haversine math.</div>
                </div>
                <div className="p-4 rounded-xl bg-[#161C2C] border border-white/10 hover:border-[#FFD24A] transition-all">
                  <div className="font-bold text-[#FFD24A] text-sm mb-1 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" /> Lightning MiniSearch Indexing
                  </div>
                  <div className="text-xs text-slate-400">Zero-latency client-side fuzzy searching across titles, authors, descriptions, and ISBNs with zero server roundtrips.</div>
                </div>
                <div className="p-4 rounded-xl bg-[#161C2C] border border-white/10 hover:border-[#FF008C] transition-all">
                  <div className="font-bold text-[#FF008C] text-sm mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> 3D Perspective Tilt Cards
                  </div>
                  <div className="text-xs text-slate-400">Interactive hardware-accelerated CSS 3D perspective creates a tactile bookshelf feel on mouse movement.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: UI SHOWCASE - LIST WIZARD */}
        {currentSlide === 4 && (
          <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
            <div className="inline-block px-3 py-1 rounded-full bg-[#FFD24A]/15 border border-[#FFD24A]/40 text-[#FFD24A] font-mono text-xs font-bold mb-2">
              SELLER EXPERIENCE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">1-Click Book Listing Wizard (/list)</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-6">Listing a book takes under 30 seconds with automatic Google Books metadata ingestion.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#1CE8ED] hover:shadow-[0_10px_30px_rgba(28,232,237,0.2)] transition-all flex flex-col">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#1CE8ED]/20 text-[#1CE8ED] font-mono text-[11px] font-bold w-fit mb-3">STEP 01</span>
                <h3 className="text-base font-bold text-white mb-2">Google Books Search</h3>
                <p className="text-xs text-slate-400 leading-relaxed flex-1">Type 3 letters or scan ISBN: title, author, official high-res cover art, and synopsis fill instantly from the Google Books Volumes API.</p>
                <div className="mt-4 text-[11px] font-mono text-[#1CE8ED]">Zero Manual Typing</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#FFD24A] hover:shadow-[0_10px_30px_rgba(255,210,74,0.2)] transition-all flex flex-col">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FFD24A]/20 text-[#FFD24A] font-mono text-[11px] font-bold w-fit mb-3">STEP 02</span>
                <h3 className="text-base font-bold text-white mb-2">Condition Grading</h3>
                <p className="text-xs text-slate-400 leading-relaxed flex-1">Choose from standardized condition tiers: NEW, GOOD, FAIR, or WORN. Upload actual photo proofs to avoid disputes later.</p>
                <div className="mt-4 text-[11px] font-mono text-[#FFD24A]">Photo Transparency</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#FF008C] hover:shadow-[0_10px_30px_rgba(255,0,140,0.2)] transition-all flex flex-col">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FF008C]/20 text-[#FF008C] font-mono text-[11px] font-bold w-fit mb-3">STEP 03</span>
                <h3 className="text-base font-bold text-white mb-2">Pricing & Collateral</h3>
                <p className="text-xs text-slate-400 leading-relaxed flex-1">Set daily, weekly, and monthly rates. The smart pricing engine automatically suggests the optimal refundable security deposit.</p>
                <div className="mt-4 text-[11px] font-mono text-[#FF008C]">Deposit Suggestion</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#69FE6F] hover:shadow-[0_10px_30px_rgba(105,254,111,0.2)] transition-all flex flex-col">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#69FE6F]/20 text-[#69FE6F] font-mono text-[11px] font-bold w-fit mb-3">STEP 04</span>
                <h3 className="text-base font-bold text-white mb-2">Radius & Publish</h3>
                <p className="text-xs text-slate-400 leading-relaxed flex-1">Set your neighborhood pickup radius (1 to 20 km) with Leaflet pinpointing. Your listing goes live immediately to nearby readers!</p>
                <div className="mt-4 text-[11px] font-mono text-[#69FE6F]">Live In Seconds</div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5: ESCROW STATE MACHINE */}
        {currentSlide === 5 && (
          <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
            <div className="inline-block px-3 py-1 rounded-full bg-[#9982DE]/15 border border-[#9982DE]/40 text-[#9982DE] font-mono text-xs font-bold mb-2">
              TRANSACTION ENGINE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">The Escrow & Handover State Machine</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-6">A bulletproof 5-step lifecycle ensuring peace of mind, timely returns, and fair compensation.</p>
            
            {/* Horizontal timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-[#161C2C] border border-[#9982DE]/50 text-center">
                <div className="w-8 h-8 rounded-full bg-[#9982DE] text-black font-extrabold flex items-center justify-center mx-auto mb-2 text-xs">1</div>
                <div className="text-xs font-bold text-white">1. Request</div>
                <div className="text-[11px] text-slate-400 mt-1">Reader picks dates • 36h expiry</div>
              </div>
              <div className="p-4 rounded-xl bg-[#161C2C] border border-[#1CE8ED]/50 text-center">
                <div className="w-8 h-8 rounded-full bg-[#1CE8ED] text-black font-extrabold flex items-center justify-center mx-auto mb-2 text-xs">2</div>
                <div className="text-xs font-bold text-white">2. Escrow Lock</div>
                <div className="text-[11px] text-slate-400 mt-1">Fee + Deposit locked • 15m window</div>
              </div>
              <div className="p-4 rounded-xl bg-[#161C2C] border border-[#FFD24A]/50 text-center">
                <div className="w-8 h-8 rounded-full bg-[#FFD24A] text-black font-extrabold flex items-center justify-center mx-auto mb-2 text-xs">3</div>
                <div className="text-xs font-bold text-white">3. Handover</div>
                <div className="text-[11px] text-slate-400 mt-1">In-person meetup & photo check</div>
              </div>
              <div className="p-4 rounded-xl bg-[#161C2C] border border-[#FF008C]/50 text-center">
                <div className="w-8 h-8 rounded-full bg-[#FF008C] text-white font-extrabold flex items-center justify-center mx-auto mb-2 text-xs">4</div>
                <div className="text-xs font-bold text-white">4. Reading</div>
                <div className="text-[11px] text-slate-400 mt-1">Due date reminders • Late fee: ₹10/d</div>
              </div>
              <div className="p-4 rounded-xl bg-[#161C2C] border border-[#69FE6F]/50 text-center col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-full bg-[#69FE6F] text-black font-extrabold flex items-center justify-center mx-auto mb-2 text-xs">5</div>
                <div className="text-xs font-bold text-white">5. Settlement</div>
                <div className="text-[11px] text-slate-400 mt-1">Deposit refunded • Payout released</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#161C2C] border border-white/10 hover:border-[#1CE8ED] transition-all">
                <div className="font-bold text-[#1CE8ED] text-sm mb-1">🔒 Automated Fund Escrow</div>
                <div className="text-xs text-slate-400">Rental fees and security deposits are held in a secure state until both owner and reader confirm satisfactory return.</div>
              </div>
              <div className="p-4 rounded-xl bg-[#161C2C] border border-white/10 hover:border-[#FFD24A] transition-all">
                <div className="font-bold text-[#FFD24A] text-sm mb-1">⏱️ Late Fee Deductions</div>
                <div className="text-xs text-slate-400">Automatic ₹10/day late fee deducted from security deposit if overdue, capped at the total deposit value.</div>
              </div>
              <div className="p-4 rounded-xl bg-[#161C2C] border border-white/10 hover:border-[#FF008C] transition-all">
                <div className="font-bold text-[#FF008C] text-sm mb-1">📦 7-Day Lost Book Protection</div>
                <div className="text-xs text-slate-400">If unreturned 7 days past due date, book is automatically declared LOST; full deposit is transferred to the owner.</div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 6: TRUSTSCORE & SAFETY */}
        {currentSlide === 6 && (
          <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
            <div className="inline-block px-3 py-1 rounded-full bg-[#69FE6F]/15 border border-[#69FE6F]/40 text-[#69FE6F] font-mono text-xs font-bold mb-2">
              COMMUNITY INTEGRITY
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">TrustScore™ & Community Safety Protocol</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-6">Building peer-to-peer accountability through dynamic scoring, photo proofs, and admin arbitration.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Radial Gauge */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-[#161C2C] border border-white/10 text-center flex flex-col items-center">
                <div className="relative w-48 h-32 flex flex-col items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 200 130">
                    <path d="M 20 120 A 80 80 0 0 1 180 120" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" strokeLinecap="round" />
                    <path d="M 20 120 A 80 80 0 0 1 155 50" fill="none" stroke="url(#gaugeGrad)" strokeWidth="16" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF008C" />
                        <stop offset="60%" stopColor="#FFD24A" />
                        <stop offset="100%" stopColor="#69FE6F" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute top-12 text-5xl font-black text-[#69FE6F]">88</div>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mt-2">TRUSTSCORE™ TIER: ELITE LENDER</div>
                <p className="text-[11px] text-slate-400 mt-2 max-w-xs">
                  Initial score starts at 70 • Clamped 0 to 100 • Unlocks deposit discounts & priority search listing.
                </p>
              </div>

              {/* Safety Cards */}
              <div className="lg:col-span-7 space-y-3">
                <div className="p-4 rounded-xl bg-[#161C2C] border border-white/10 hover:border-[#1CE8ED] transition-all">
                  <div className="font-bold text-[#1CE8ED] text-sm mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Merit-Based Score Rewards
                  </div>
                  <div className="text-xs text-slate-400">Returning books on time and keeping commitments earns +2 to +5 points. High TrustScores allow zero-deposit borrowing.</div>
                </div>
                <div className="p-4 rounded-xl bg-[#161C2C] border border-white/10 hover:border-[#FF008C] transition-all">
                  <div className="font-bold text-[#FF008C] text-sm mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Strict Penalty Safeguards
                  </div>
                  <div className="text-xs text-slate-400">Late returns, damages, or cancelled commitments deduct -15 points, restricting borrower privileges across the entire network.</div>
                </div>
                <div className="p-4 rounded-xl bg-[#161C2C] border border-white/10 hover:border-[#FFD24A] transition-all">
                  <div className="font-bold text-[#FFD24A] text-sm mb-1 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Dedicated /admin Dispute Arbitration
                  </div>
                  <div className="text-xs text-slate-400">When disputes arise, administrators inspect handover vs return photos and execute fair split payouts in seconds.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 7: EDITORIAL AESTHETICS */}
        {currentSlide === 7 && (
          <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
            <div className="inline-block px-3 py-1 rounded-full bg-[#FF008C]/15 border border-[#FF008C]/40 text-[#FF008C] font-mono text-xs font-bold mb-2">
              DESIGN SYSTEM & BRANDING
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">Editorial Aesthetics: The Aardvark Touch</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-6">Crafted with high-contrast editorial typography, vibrant pop colors, and 60 FPS hardware-accelerated motion.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10">
                  <h3 className="font-bold text-white text-base mb-2">Signature Editorial Palette</h3>
                  <p className="text-xs text-slate-400 mb-3">High-contrast palette inspired by modern indie literary publishers.</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-3 rounded-lg bg-[#FF008C] text-white text-center font-mono text-xs font-bold shadow-md">
                      PINK<br/><span className="text-[10px] opacity-80">#FF008C</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1CE8ED] text-black text-center font-mono text-xs font-bold shadow-md">
                      TEAL<br/><span className="text-[10px] opacity-80">#1CE8ED</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#FFD24A] text-black text-center font-mono text-xs font-bold shadow-md">
                      GOLD<br/><span className="text-[10px] opacity-80">#FFD24A</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#9982DE] text-white text-center font-mono text-xs font-bold shadow-md">
                      LILAC<br/><span className="text-[10px] opacity-80">#9982DE</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#1CE8ED] transition-all">
                  <h3 className="font-bold text-[#1CE8ED] text-base mb-1">🌊 Lenis Smooth Inertial Scrolling</h3>
                  <p className="text-xs text-slate-400">Hardware-accelerated inertia scrolling ensures pages feel weightless and responsive on both desktop and high-refresh trackpads.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#FF008C] transition-all">
                  <h3 className="font-bold text-[#FF008C] text-base mb-1">✨ GSAP Micro-Animations</h3>
                  <p className="text-xs text-slate-400">ScrollTrigger parallax, SplitText editorial reveals, and magnetic buttons create delight without cluttering usability.</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#FFD24A] transition-all">
                  <h3 className="font-bold text-[#FFD24A] text-base mb-1">⚡ Command+K Global Palette</h3>
                  <p className="text-xs text-slate-400">Instant keyboard navigation across books, requests, listings, and user profiles powered by cmdk.</p>
                </div>
                <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#9982DE] transition-all">
                  <h3 className="font-bold text-[#9982DE] text-base mb-1">🍞 Sonner Toast Feedback</h3>
                  <p className="text-xs text-slate-400">Instant tactile feedback on bookmarks, borrow requests, and payment state transitions.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 8: TECH STACK */}
        {currentSlide === 8 && (
          <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
            <div className="inline-block px-3 py-1 rounded-full bg-[#1CE8ED]/15 border border-[#1CE8ED]/40 text-[#1CE8ED] font-mono text-xs font-bold mb-2">
              ENGINEERING ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">Built On A Modern, Production-Ready Stack</h2>
            <p className="text-sm sm:text-base text-slate-400 mb-6">Engineered for speed, strict type safety, zero layout shifts, and rapid local iteration.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#1CE8ED] hover:shadow-[0_10px_30px_rgba(28,232,237,0.2)] transition-all flex flex-col">
                <div className="font-bold text-[#1CE8ED] text-base mb-2">Next.js 16.3 App Router</div>
                <p className="text-xs text-slate-400 flex-1">React 19 Server Components for instant streaming, minimal client JavaScript bundles, and high Lighthouse SEO ratings.</p>
                <div className="mt-3 text-[11px] font-mono text-slate-500">Route Groups & API Handlers</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#FF008C] hover:shadow-[0_10px_30px_rgba(255,0,140,0.2)] transition-all flex flex-col">
                <div className="font-bold text-[#FF008C] text-base mb-2">Prisma ORM 7.9 + SQLite</div>
                <p className="text-xs text-slate-400 flex-1">High-performance better-sqlite3 driver, schema migrations, and relational integrity across users, listings, and transactions.</p>
                <div className="mt-3 text-[11px] font-mono text-slate-500">Strict Typed Queries</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#FFD24A] hover:shadow-[0_10px_30px_rgba(255,210,74,0.2)] transition-all flex flex-col">
                <div className="font-bold text-[#FFD24A] text-base mb-2">Tailwind CSS v4</div>
                <p className="text-xs text-slate-400 flex-1">Next-generation zero-config CSS engine with modern color space styling, dynamic utility classes, and custom tokens.</p>
                <div className="mt-3 text-[11px] font-mono text-slate-500">Lightweight & Fast</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#FF008C] hover:shadow-[0_10px_30px_rgba(255,0,140,0.2)] transition-all flex flex-col">
                <div className="font-bold text-[#FF008C] text-base mb-2">Stateless Jose JWT Auth</div>
                <p className="text-xs text-slate-400 flex-1">Cryptographically signed HTTP-only cookies (HS256) with bcrypt password hashing and SMS/OTP verification models.</p>
                <div className="mt-3 text-[11px] font-mono text-slate-500">CSRF & XSS Resilient</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#1CE8ED] hover:shadow-[0_10px_30px_rgba(28,232,237,0.2)] transition-all flex flex-col">
                <div className="font-bold text-[#1CE8ED] text-base mb-2">Leaflet & MiniSearch</div>
                <p className="text-xs text-slate-400 flex-1">Interactive geolocation maps and instant client-side full-text search indexing across titles, authors, and genres.</p>
                <div className="mt-3 text-[11px] font-mono text-slate-500">Sub-10ms Queries</div>
              </div>
              <div className="p-5 rounded-2xl bg-[#161C2C] border border-white/10 hover:border-[#69FE6F] hover:shadow-[0_10px_30px_rgba(105,254,111,0.2)] transition-all flex flex-col">
                <div className="font-bold text-[#69FE6F] text-base mb-2">Lazy Sweeper Cron</div>
                <p className="text-xs text-slate-400 flex-1">In-process throttled background scheduler to automatically expire stale requests, clear unpaid locks, and auto-settle lost books.</p>
                <div className="mt-3 text-[11px] font-mono text-slate-500">Zero External Workers</div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 9: BUSINESS MODEL & FINALE */}
        {currentSlide === 9 && (
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="inline-block px-3 py-1 rounded-full bg-[#FF008C]/15 border border-[#FF008C]/40 text-[#FF008C] font-mono text-xs font-bold mb-4">
              THE NEXT CHAPTER
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-white via-[#FF008C] to-[#1CE8ED] bg-clip-text text-transparent">
              Ready To Share The Next Chapter?
            </h1>
            <p className="text-lg font-bold text-white mb-2">Monetization, Roadmap & Interactive Demo</p>
            <p className="text-sm text-slate-400 max-w-2xl mb-8">
              12% platform fee on paid rentals • Curated book merch & gifting subscriptions • Campus micro-lending pods. Experience Bookyy live right now!
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link 
                href="/browse"
                className="px-6 py-3.5 rounded-full font-bold text-sm bg-[#FF008C] text-white hover:bg-[#ff1a98] shadow-[0_0_25px_rgba(255,0,140,0.5)] flex items-center gap-2 transition-all hover:scale-105"
              >
                <span>🚀 Explore Live Marketplace (/browse)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/list"
                className="px-6 py-3.5 rounded-full font-bold text-sm bg-[#161C2C] border border-[#1CE8ED] text-[#1CE8ED] hover:bg-[#1CE8ED]/10 flex items-center gap-2 transition-all hover:scale-105"
              >
                <span>📖 Try 1-Click Listing (/list)</span>
              </Link>
              <a 
                href="/Bookyy_Platform_Showcase.pptx"
                download
                className="px-6 py-3.5 rounded-full font-bold text-sm bg-[#161C2C] border border-[#FFD24A] text-[#FFD24A] hover:bg-[#FFD24A]/10 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Download PowerPoint File (.pptx)</span>
              </a>
            </div>
          </div>
        )}

      </main>

      {/* Bottom HUD Bar */}
      <footer className="relative z-40 px-8 py-5 flex items-center justify-between">
        <div className="font-mono text-xs font-bold text-slate-400 bg-[#161C2C]/80 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
          SLIDE <span className="text-[#FF008C]">{String(currentSlide + 1).padStart(2, "0")}</span> / {String(totalSlides).padStart(2, "0")}
        </div>

        <div className="flex items-center gap-2 bg-[#161C2C]/80 border border-white/10 p-1.5 rounded-full backdrop-blur-md">
          <button 
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            title="Previous Slide (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextSlide}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FF008C] text-white hover:bg-[#ff1a98] shadow-[0_0_15px_rgba(255,0,140,0.4)] transition-all"
            title="Next Slide (Right Arrow / Space)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden sm:block text-xs font-mono text-slate-500">
          Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-semibold">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-semibold">→</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-semibold">Space</kbd> • <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-semibold">F</kbd> Fullscreen
        </div>
      </footer>

      {/* Slide Thumbnails Modal */}
      {showThumbnails && (
        <div className="fixed inset-0 z-50 bg-[#0B0F19]/95 backdrop-blur-xl p-8 sm:p-12 flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Slide Overview</h3>
            <button 
              onClick={() => setShowThumbnails(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 overflow-y-auto flex-1 p-1">
            {slideTitles.map((title, i) => (
              <button
                key={i}
                onClick={() => {
                  goToSlide(i);
                  setShowThumbnails(false);
                }}
                className={`p-4 rounded-xl text-left border transition-all ${
                  i === currentSlide 
                    ? "bg-[#FF008C]/15 border-[#FF008C] shadow-[0_0_20px_rgba(255,0,140,0.3)]" 
                    : "bg-[#161C2C] border-white/10 hover:border-white/30"
                }`}
              >
                <div className="font-mono text-xs font-bold text-[#FF008C] mb-1">
                  SLIDE {String(i + 1).padStart(2, "0")}
                </div>
                <div className="text-xs font-semibold text-white truncate">{title}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
