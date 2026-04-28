'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { faqItems } from '../content';

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-outline-variant border-y border-outline-variant bg-transparent">
      {faqItems.map((item, index) => {
        const open = index === openIndex;
        const panelId = `faq-panel-${index}`;

        return (
          <div key={item.question}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-6 text-left"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIndex(open ? -1 : index)}
            >
              <span className="font-serif-landing text-xl leading-tight text-slate-950">{item.question}</span>
              <ChevronDown
                className={cn('size-5 shrink-0 text-slate-500 transition-transform', open && 'rotate-180')}
              />
            </button>
            <div
              id={panelId}
              className={cn(
                'grid transition-all duration-200',
                open ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl text-base leading-8 text-slate-600">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
