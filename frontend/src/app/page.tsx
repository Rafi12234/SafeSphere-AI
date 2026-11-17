import React from "react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Audience } from "@/components/landing/Audience";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Trust } from "@/components/landing/Trust";
import { Faq } from "@/components/landing/Faq";
import { Cta } from "@/components/landing/Cta";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <Audience />
        <HowItWorks />
        <Trust />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
