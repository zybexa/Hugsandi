'use client';

import { useEffect, useRef, useState } from 'react';
import { HslColorPicker } from 'react-colorful';

interface ColorPickerInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  fallback?: string;
}

interface HslColor { h: number; s: number; l: number; }

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

// Shared base styles for the range sliders so the gradient shows through
const sliderClass =
  'w-full h-3 rounded appearance-none cursor-pointer ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white ' +
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-skin-border-ui ' +
  '[&::-webkit-slider-thumb]:shadow-md ' +
  '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-skin-border-ui';

const hueGradient =
  'linear-gradient(to right, ' +
  'hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), ' +
  'hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))';

const satGradient = (h: number, l: number) =>
  `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`;

const lightGradient = (h: number, s: number) =>
  `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`;

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
  const updateHsl = (partial: Partial<HslColor>) => {
    onChange(hslToHex({ ...hsl, ...partial }));
  };

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
          style={{ minWidth: 240 }}
        >
          {/* 2D saturation/lightness surface + hue ring */}
          <div className="mb-3">
            <HslColorPicker
              color={hsl}
              onChange={(c) => onChange(hslToHex(c))}
            />
          </div>

          {/* Hue slider */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-skin-text-muted uppercase tracking-wide mb-1">
              <span>H</span>
              <span className="font-mono text-skin-text-secondary normal-case tracking-normal">{hsl.h}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={hsl.h}
              onChange={(e) => updateHsl({ h: Number(e.target.value) })}
              className={sliderClass}
              style={{ background: hueGradient }}
            />
          </div>

          {/* Saturation slider */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-skin-text-muted uppercase tracking-wide mb-1">
              <span>S</span>
              <span className="font-mono text-skin-text-secondary normal-case tracking-normal">{hsl.s}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={hsl.s}
              onChange={(e) => updateHsl({ s: Number(e.target.value) })}
              className={sliderClass}
              style={{ background: satGradient(hsl.h, hsl.l) }}
            />
          </div>

          {/* Lightness slider */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-skin-text-muted uppercase tracking-wide mb-1">
              <span>L</span>
              <span className="font-mono text-skin-text-secondary normal-case tracking-normal">{hsl.l}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={hsl.l}
              onChange={(e) => updateHsl({ l: Number(e.target.value) })}
              className={sliderClass}
              style={{ background: lightGradient(hsl.h, hsl.s) }}
            />
          </div>

          {/* Numeric H/S/L inputs for precision */}
          <div className="grid grid-cols-3 gap-1.5">
            <input
              type="number"
              min={0}
              max={360}
              value={hsl.h}
              onChange={(e) => updateHsl({ h: Math.max(0, Math.min(360, Number(e.target.value) || 0)) })}
              aria-label="Hue"
              className="px-2 py-1 bg-skin-input border border-skin-border rounded text-skin-text-primary text-xs font-mono"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={hsl.s}
              onChange={(e) => updateHsl({ s: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
              aria-label="Saturation"
              className="px-2 py-1 bg-skin-input border border-skin-border rounded text-skin-text-primary text-xs font-mono"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={hsl.l}
              onChange={(e) => updateHsl({ l: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
              aria-label="Lightness"
              className="px-2 py-1 bg-skin-input border border-skin-border rounded text-skin-text-primary text-xs font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
