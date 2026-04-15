'use client';

import { useEffect, useRef, useState } from 'react';
import { HslColorPicker, type HslColor } from 'react-colorful';

interface ColorPickerInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  fallback?: string;
}

// HEX <-> HSL conversions -------------------------------------------------

function hexToHsl(hex: string): HslColor {
  const m = hex.replace('#', '').match(/^([0-9a-fA-F]{6})$/);
  if (!m) return { h: 0, s: 0, l: 0 };
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex({ h, s, l }: HslColor): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// -------------------------------------------------------------------------

export default function ColorPickerInput({
  value,
  onChange,
  disabled,
  label,
  fallback = '#000000',
}: ColorPickerInputProps) {
  const currentValue = value || fallback;
  const [draft, setDraft] = useState(currentValue);
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setDraft(currentValue);
  }, [currentValue]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t) || swatchRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hsl = hexToHsl(currentValue);

  return (
    <div className="mt-1.5 flex items-center gap-2 relative">
      {label && (
        <label className="text-[10px] text-skin-text-muted uppercase tracking-wide">{label}</label>
      )}
      <button
        ref={swatchRef}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-label="Open color picker"
        aria-expanded={open}
        className="w-7 h-7 rounded border border-skin-border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: currentValue }}
      />
      <input
        type="text"
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          const normalized = next.startsWith('#') ? next : `#${next}`;
          if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
            onChange(normalized.toUpperCase());
          }
        }}
        onBlur={() => setDraft(currentValue)}
        placeholder={fallback}
        spellCheck={false}
        disabled={disabled}
        className="px-2 py-1 bg-skin-input border border-skin-border rounded text-skin-text-primary text-xs w-20 font-mono disabled:opacity-40 disabled:cursor-not-allowed"
      />

      {open && !disabled && (
        <div
          ref={popoverRef}
          className="absolute z-50 top-full left-0 mt-2 p-3 bg-skin-secondary border border-skin-border-ui rounded-lg shadow-lg"
          style={{ minWidth: 220 }}
        >
          <HslColorPicker
            color={hsl}
            onChange={(c) => onChange(hslToHex(c))}
          />
          <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px] text-skin-text-muted uppercase tracking-wide">
            <label className="flex flex-col items-start gap-0.5">
              H
              <input
                type="number"
                min={0}
                max={360}
                value={hsl.h}
                onChange={(e) => onChange(hslToHex({ ...hsl, h: Math.max(0, Math.min(360, Number(e.target.value) || 0)) }))}
                className="w-full px-2 py-1 bg-skin-input border border-skin-border rounded text-skin-text-primary text-xs font-mono"
              />
            </label>
            <label className="flex flex-col items-start gap-0.5">
              S
              <input
                type="number"
                min={0}
                max={100}
                value={hsl.s}
                onChange={(e) => onChange(hslToHex({ ...hsl, s: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))}
                className="w-full px-2 py-1 bg-skin-input border border-skin-border rounded text-skin-text-primary text-xs font-mono"
              />
            </label>
            <label className="flex flex-col items-start gap-0.5">
              L
              <input
                type="number"
                min={0}
                max={100}
                value={hsl.l}
                onChange={(e) => onChange(hslToHex({ ...hsl, l: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))}
                className="w-full px-2 py-1 bg-skin-input border border-skin-border rounded text-skin-text-primary text-xs font-mono"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
