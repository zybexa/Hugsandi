'use client';

import { useEffect, useState } from 'react';

interface ColorPickerInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  fallback?: string;
}

// Swatch + hex text input. The text input uses a local draft so the user
// can type freely (incl. invalid intermediate values like '#F') without
// breaking the committed value. Commits only when the draft matches a
// 6-digit hex; reverts to the committed value on blur if invalid.
export default function ColorPickerInput({
  value,
  onChange,
  disabled,
  label,
  fallback = '#000000',
}: ColorPickerInputProps) {
  const currentValue = value || fallback;
  const [draft, setDraft] = useState(currentValue);
  useEffect(() => {
    setDraft(currentValue);
  }, [currentValue]);

  return (
    <div className="mt-1.5 flex items-center gap-2">
      {label && (
        <label className="text-[10px] text-skin-text-muted uppercase tracking-wide">{label}</label>
      )}
      <input
        type="color"
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-7 h-7 rounded border border-skin-border bg-transparent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
    </div>
  );
}
