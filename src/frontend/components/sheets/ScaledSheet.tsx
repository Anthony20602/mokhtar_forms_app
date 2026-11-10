"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const SHEET_WIDTH_PX = (210 * 96) / 25.4;

/**
 * Shrinks (or slightly enlarges) an A4 sheet so it fits the available width.
 * Printing ignores the scale, see `.sheet-zoom` in globals.css.
 */
export function ScaledSheet({
  children,
  maxZoom = 1.5,
  onZoom,
}: {
  children: ReactNode;
  maxZoom?: number;
  onZoom?: (zoom: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      if (width > 0) setZoom(Math.min(maxZoom, Math.round((width / SHEET_WIDTH_PX) * 1000) / 1000));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxZoom]);

  useEffect(() => {
    if (zoom != null) onZoom?.(zoom);
  }, [zoom, onZoom]);

  return (
    <div ref={ref} className="w-full overflow-hidden print:overflow-visible">
      <div
        // Hidden until measured, so a phone never flashes a page wider than its screen.
        className={`sheet-zoom mx-auto w-fit print:visible print:mx-0 ${zoom == null ? "invisible" : ""}`}
        style={{ "--sheet-zoom": zoom ?? 0.4 } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
