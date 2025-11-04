"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import TopBar from "@/components/TopBar";
import CommandPalette from "@/components/CommandPalette";
import ShareButton from "@/components/ShareButton";
import MobileCreateDock from "@/components/MobileCreateDock";

import HeroAurora from "@/components/HeroAurora";
import AgentFirstShowcase from "@/components/AgentFirstShowcase";

// Lazy load heavy below-the-fold components for better initial load performance
// Note: CampaignOrchestrationDemo component not yet created
// const CampaignOrchestrationDemo = lazy(() => import("@/components/CampaignOrchestrationDemo"));
const ComprehensiveFeatureShowcase = lazy(() => import("@/components/ComprehensiveFeatureShowcase"));
const FeatureRail = lazy(() => import("@/components/FeatureRail"));
const PersonaPreview = lazy(() => import("@/components/PersonaPreview"));
const Pricing = lazy(() => import("@/components/Pricing"));
const TestimonialStripe = lazy(() => import("@/components/TestimonialStripe"));
const SocialProofStrip = lazy(() => import("@/components/SocialProofStrip"));
const FooterMinimal = lazy(() => import("@/components/FooterMinimal"));

import StickyExportBar from "@/components/StickyExportBar";
import ReduceMotionToggle from "@/components/ReduceMotionToggle";
import HotkeysOverlay from "@/components/HotkeysOverlay";

// Simple loading fallback
function SectionLoader() {
  return (
    <div className="py-12 flex justify-center">
      <div className="text-sm opacity-50">Loading...</div>
    </div>
  );
}

export default function Page() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onK = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", onK);
    return () => window.removeEventListener("keydown", onK);
  }, []);

  return (
    <main>
      <TopBar onOpenPalette={() => setOpen(true)} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 flex justify-end">
        <ShareButton />
      </div>

      <HeroAurora />
      <AgentFirstShowcase />
      
      {/* 🎯 Campaign Orchestration Demo - The Revolutionary Core */}
      {/* TODO: Create CampaignOrchestrationDemo component
      <Suspense fallback={<SectionLoader />}>
        <CampaignOrchestrationDemo />
      </Suspense>
      */}
      
      {/* 🌟 NEW: Comprehensive Feature Showcase - Complete AI Ecosystem */}
      <Suspense fallback={<SectionLoader />}>
        <ComprehensiveFeatureShowcase />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <FeatureRail />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <SocialProofStrip />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <PersonaPreview />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <Pricing />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <TestimonialStripe />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <FooterMinimal />
      </Suspense>

      {/* Global UX helpers */}
      <StickyExportBar />
      <ReduceMotionToggle />
      <HotkeysOverlay />
      <MobileCreateDock />

      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </main>
  );
}