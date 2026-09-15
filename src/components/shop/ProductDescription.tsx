'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// Descriptions past this length get collapsed behind "Read more" — short
// ones always render in full with no toggle.
const COLLAPSE_THRESHOLD = 260;

export default function ProductDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > COLLAPSE_THRESHOLD;

  return (
    <div className="max-w-prose text-muted-foreground">
      <p
        className={cn(
          'whitespace-pre-line text-base md:text-lg leading-relaxed md:leading-loose',
          isLong && !expanded && 'line-clamp-4 md:line-clamp-5'
        )}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
