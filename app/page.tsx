"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import CommandPalette from "@/components/CommandPalette";
import ShareButton from "@/components/ShareButton";
import MobileCreateDock from "@/components/MobileCreateDock";

import HeroAurora from "@/components/HeroAurora";
import AgentFirstShowcase from "@/components/AgentFirstShowcase";
import CampaignOrchestrationDemo from "@/components/CampaignOrchestrationDemo";
import ComprehensiveFeatureShowcase from "@/components/ComprehensiveFeatureShowcase";
import FeatureRail from "@/components/FeatureRail";
import PersonaPreview from "@/components/PersonaPreview";
import Pricing from "@/components/Pricing";
import TestimonialStripe from "@/components/TestimonialStripe";
import SocialProofStrip from "@/components/SocialProofStrip";
import FooterMinimal from "@/components/FooterMinimal";

import StickyExportBar from "@/components/StickyExportBar";
import ReduceMotionToggle from "@/components/ReduceMotionToggle";
import HotkeysOverlay from "@/components/HotkeysOverlay";

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
      <CampaignOrchestrationDemo />
      
      {/* 🌟 NEW: Comprehensive Feature Showcase - Complete AI Ecosystem */}
      <ComprehensiveFeatureShowcase />
      
      <FeatureRail />
      <SocialProofStrip />
      <PersonaPreview />
      <Pricing />
      <TestimonialStripe />
      <FooterMinimal />

      {/* Global UX helpers */}
      <StickyExportBar />
      <ReduceMotionToggle />
      <HotkeysOverlay />
      <MobileCreateDock />

      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </main>
  );
}