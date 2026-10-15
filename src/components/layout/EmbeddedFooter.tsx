"use client";

import React from 'react';
import { motion, Variants } from 'motion/react';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { useSiteText } from '@/contexts/SiteTextContext';
import { hostInitials } from '@/lib/genericContent';

// "December 20, 2026 15:00:00" -> "20.12.2026"; null when the date can't be parsed
function formatFooterDate(targetDate: string) {
  const date = new Date(targetDate);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function EmbeddedFooter() {
  const { content } = useWeddingContent();
  const text = useSiteText();
  const { hosts, targetDate, footerTagline } = content.global;
  const monogram = hostInitials(hosts).join(' & ');
  const footerDate = formatFooterDate(targetDate);

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="w-[calc(100%+2rem)] -mx-4 -mb-24 py-8 text-center border-t border-ink/20 mt-16 shrink-0 relative z-20 flex flex-col justify-center"
    >
      <div className="max-w-md mx-auto px-4">
        <div className="text-xl font-heading tracking-[0.4em] text-ink/80 mb-4">{monogram}</div>
        <p className="text-xs font-elegant italic text-ink/80 mb-4">&quot;{footerTagline}&quot;</p>
        {footerDate && (
          <div className="flex items-center justify-center space-x-3 mb-6">
            <span className="w-8 h-[1px] bg-ink/20"></span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-ink/70 font-medium">{footerDate}</span>
            <span className="w-8 h-[1px] bg-ink/20"></span>
          </div>
        )}
        <p className="text-[9px] uppercase tracking-widest text-ink/60">{text.footer.credit}</p>
      </div>
    </motion.div>
  );
}
