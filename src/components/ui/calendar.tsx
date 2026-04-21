'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Calendar baseado em react-day-picker v9.
 * Usado no popover de período customizado do dashboard de recrutamento.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: `${defaults.months} flex flex-col sm:flex-row gap-4`,
        month: `${defaults.month} space-y-3`,
        month_caption: `${defaults.month_caption} flex items-center justify-center text-sm font-medium h-8`,
        caption_label: `${defaults.caption_label} text-sm font-medium`,
        nav: `${defaults.nav} flex items-center justify-between absolute top-3 left-3 right-3`,
        button_previous: cn(
          buttonVariants({ variant: 'outline', size: 'icon-xs' }),
          'h-6 w-6 bg-transparent p-0',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline', size: 'icon-xs' }),
          'h-6 w-6 bg-transparent p-0',
        ),
        month_grid: `${defaults.month_grid} w-full border-collapse`,
        weekdays: `${defaults.weekdays} flex`,
        weekday: `${defaults.weekday} text-muted-foreground rounded-md w-8 text-[0.7rem] font-normal uppercase`,
        week: `${defaults.week} flex w-full mt-1`,
        day: `${defaults.day} relative h-8 w-8 p-0 text-center text-sm focus-within:relative focus-within:z-20`,
        day_button: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md',
        ),
        range_start: `${defaults.range_start} rounded-l-md bg-primary text-primary-foreground [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90`,
        range_end: `${defaults.range_end} rounded-r-md bg-primary text-primary-foreground [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90`,
        range_middle: `${defaults.range_middle} bg-primary/10 text-foreground [&>button]:bg-transparent [&>button]:hover:bg-primary/20`,
        selected: `${defaults.selected} bg-primary text-primary-foreground [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90`,
        today: `${defaults.today} [&>button]:bg-muted [&>button]:text-foreground font-semibold`,
        outside: `${defaults.outside} text-muted-foreground/40 aria-selected:text-muted-foreground/70`,
        disabled: `${defaults.disabled} opacity-40 pointer-events-none`,
        hidden: `${defaults.hidden} invisible`,
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
