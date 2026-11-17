"use client";

import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Reveal } from "@/components/common/Reveal";

export function Faq() {
  const faqs = [
    {
      id: "faq-1",
      question: "What permissions does SafeSphere require from Facebook?",
      answer:
        "SafeSphere only requests read-only permissions (pages_show_list and pages_read_engagement) via Facebook Login for Business to list authorized Pages and retrieve their published posts. We never request or use write permissions.",
    },
    {
      id: "faq-2",
      question: "Will SafeSphere post, delete, or hide comments automatically?",
      answer:
        "Never. This prototype does not process real comments or perform live AI analysis. It does not publish posts, post replies, delete comments, or block profiles on your behalf.",
    },
    {
      id: "faq-3",
      question: "Which languages and dialects are supported?",
      answer:
        "Our fictional demonstration samples include Bangla (বাংলা), Banglish and English. Live multilingual AI models are not yet implemented.",
    },
    {
      id: "faq-4",
      question: "Is SafeSphere a replacement for formal legal counsel?",
      answer:
        "No. The current prototype shows fictional safety findings and a UI-only report draft, not verified evidence. It does not provide legal advice or directly file law enforcement complaints.",
    },
    {
      id: "faq-5",
      question: "How are tokens and Facebook access credentials stored?",
      answer:
        "Access tokens are encrypted at rest using AES Fernet cryptography before being stored in the database. Tokens are never exposed to browser memory, client JavaScript, or public logs.",
    },
    {
      id: "faq-6",
      question: "What does it cost to run a comment scan?",
      answer:
        "The hackathon prototype has no billing. Its simulated scans use only scripted fictional examples.",
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Frequently Asked Questions
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Everything you need to know.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Have questions about permissions, privacy, or technical capabilities? Here are the answers.
          </p>
        </Reveal>

        <Reveal>
          <Accordion className="rounded-lg border bg-card p-6 shadow-xs">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} id={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
