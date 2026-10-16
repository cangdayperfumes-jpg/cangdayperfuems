'use client';

import { useEffect, useRef } from 'react';

const RESUME_DELAY_MS = 1200;
const DRAG_THRESHOLD_PX = 5;
const NUDGE_DURATION_MS = 500;

/**
 * Infinite, continuously drifting strip whose children are rendered twice in
 * a row inside `trackRef`. Moved with a GPU-composited `translate3d` rather
 * than by writing `scrollLeft` — scrollLeft only lands on whole device
 * pixels, so a sub-pixel-per-frame drift alternated between moving 1px and
 * 0px a frame and visibly stuttered (worse with the photo filters on the
 * category cards). Speed is time-based, so it's identical at 60Hz or 120Hz.
 *
 * Since the strip no longer natively scrolls, drag (mouse), swipe (touch —
 * `touch-action: pan-y` on the viewport keeps vertical page scrolling
 * native) and horizontal trackpad wheel are handled here. A drag past a few
 * px swallows the click that follows, so dragging never opens a card.
 * Auto-drift is skipped under prefers-reduced-motion; dragging still works.
 */
export function useAutoScrollLoop<V extends HTMLElement = HTMLDivElement, T extends HTMLElement = HTMLDivElement>(
  itemCount: number,
  pixelsPerSecond = 36
) {
  const viewportRef = useRef<V>(null);
  const trackRef = useRef<T>(null);

  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startOffset: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const nudgeRef = useRef<{ from: number; to: number; start: number } | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || itemCount === 0) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId: number;
    let last = performance.now();
    const step = (now: number) => {
      // Clamped so a backgrounded tab doesn't jump the strip on return.
      const dt = Math.min(now - last, 64);
      last = now;
      const half = track.scrollWidth / 2;

      const nudge = nudgeRef.current;
      if (nudge) {
        const t = Math.min((now - nudge.start) / NUDGE_DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        offsetRef.current = nudge.from + (nudge.to - nudge.from) * eased;
        if (t === 1) nudgeRef.current = null;
      } else if (!pausedRef.current && !dragRef.current && !reduceMotion) {
        offsetRef.current += (pixelsPerSecond * dt) / 1000;
      }

      if (half > 0) {
        const wrapped = ((offsetRef.current % half) + half) % half;
        // Keep an in-flight drag/nudge anchored to the wrapped position.
        const shift = wrapped - offsetRef.current;
        if (shift !== 0) {
          if (dragRef.current) dragRef.current.startOffset += shift;
          if (nudgeRef.current) {
            nudgeRef.current.from += shift;
            nudgeRef.current.to += shift;
          }
        }
        offsetRef.current = wrapped;
      }
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [itemCount, pixelsPerSecond]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  const pause = () => {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };
  const scheduleResume = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  };

  /** Smoothly shift the strip by `px` (positive = forward) — for arrow buttons. */
  const nudge = (px: number) => {
    nudgeRef.current = { from: offsetRef.current, to: offsetRef.current + px, start: performance.now() };
  };

  const endDrag = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    suppressClickRef.current = drag.moved;
    dragRef.current = null;
    scheduleResume();
  };

  const handlers = {
    style: { touchAction: 'pan-y' } as React.CSSProperties,
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      nudgeRef.current = null;
      dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startOffset: offsetRef.current, moved: false };
      pause();
    },
    onPointerMove: (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) > DRAG_THRESHOLD_PX) {
        drag.moved = true;
        // Capture only once it's really a drag, so plain clicks/taps on the
        // cards still reach their links normally.
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
      if (drag.moved) offsetRef.current = drag.startOffset - dx;
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    // A press that never became a drag isn't captured, so its pointerup can
    // land outside the strip — drop it on leave so auto-drift doesn't stall.
    onPointerLeave: (e: React.PointerEvent) => {
      if (dragRef.current && !dragRef.current.moved) endDrag(e);
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (suppressClickRef.current) {
        e.preventDefault();
        e.stopPropagation();
        suppressClickRef.current = false;
      }
    },
    // Stops the browser's native image/link drag ghost from hijacking a mouse drag.
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
    onWheel: (e: React.WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      nudgeRef.current = null;
      offsetRef.current += e.deltaX;
      pause();
      scheduleResume();
    },
    onMouseEnter: pause,
    onMouseLeave: () => {
      if (!dragRef.current) scheduleResume();
    },
    onFocus: pause,
    onBlur: scheduleResume,
  };

  return { viewportRef, trackRef, handlers, pause, scheduleResume, nudge };
}
