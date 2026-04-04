'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import en from '@/lib/i18n/en';
import defaultIs from '@/lib/i18n/is';

export default function TranslationsPage() {
  const { t, allKeys, dbOverrides, saveTranslations } = useTranslation();
  const [enEdits, setEnEdits] = useState<Record<string, string>>({});
  const [isEdits, setIsEdits] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Initialize edits from DB overrides + hardcoded defaults
  useEffect(() => {
    const initEn: Record<string, string> = {};
    const initIs: Record<string, string> = {};
    for (const key of allKeys) {
      initEn[key] = dbOverrides.en[key] || en[key] || '';
      initIs[key] = dbOverrides.is[key] || defaultIs[key] || '';
    }
    setEnEdits(initEn);
    setIsEdits(initIs);
  }, [allKeys, dbOverrides]);

  // Get unique category prefixes
  const categories = useMemo(() => {
    const prefixes = new Set<string>();
    for (const key of allKeys) {
      const prefix = key.split('.')[0];
      prefixes.add(prefix);
    }
    return Array.from(prefixes).sort();
  }, [allKeys]);

  // Filtered keys — search against hardcoded defaults + DB overrides (not live edits)
  const filteredKeys = useMemo(() => {
    return allKeys.filter((key) => {
      if (category && !key.startsWith(category + '.')) return false;
      if (search) {
        const q = search.toLowerCase();
        const enOriginal = dbOverrides.en[key] || en[key] || '';
        const isOriginal = dbOverrides.is[key] || defaultIs[key] || '';
        return (
          key.toLowerCase().includes(q) ||
          enOriginal.toLowerCase().includes(q) ||
          isOriginal.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allKeys, category, search, dbOverrides]);

  // Count how many keys have been customized (differ from hardcoded defaults)
  const enCustomCount = allKeys.filter((key) => dbOverrides.en[key]?.trim()).length;
  const isCustomCount = allKeys.filter((key) => dbOverrides.is[key]?.trim()).length;

  async function handleSave() {
    setSaving(true);
    setSaveError(false);
    // Only save values that differ from the hardcoded defaults
    const enOverrides: Record<string, string> = {};
    const isOverrides: Record<string, string> = {};
    for (const key of allKeys) {
      if (enEdits[key]?.trim() && enEdits[key] !== en[key]) {
        enOverrides[key] = enEdits[key];
      }
      if (isEdits[key]?.trim() && isEdits[key] !== defaultIs[key]) {
        isOverrides[key] = isEdits[key];
      }
    }
    const ok = await saveTranslations({ en: enOverrides, is: isOverrides });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    }
  }

  return (
    <div className="min-h-screen text-skin-text-primary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-skin-card border-[length:var(--border-ui-width)] border-skin-border-ui rounded-[16px] shadow-skin-card p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-medium text-skin-text-secondary uppercase tracking-[0.04em]">
                {t('translations.title')}
              </h2>
              <p className="text-xs text-skin-text-muted mt-1">
                {enCustomCount > 0 && <span className="mr-3">EN: {enCustomCount} customized</span>}
                <span>IS: {isCustomCount} customized</span>
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-skin-accent hover:bg-skin-accent-hover text-white text-sm font-semibold rounded-md shadow-skin transition-all disabled:opacity-50"
            >
              {saving ? t('toolbar.saving') : saved ? t('common.saved') : saveError ? t('translations.saveFailed') : t('common.save')}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('translations.search')}
              className="flex-1 px-3 py-2 bg-skin-primary border border-skin-border-subtle rounded-md text-skin-text-primary text-sm placeholder-skin-text-muted transition-colors"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 bg-skin-primary border border-skin-border-subtle rounded-md text-skin-text-primary text-sm"
            >
              <option value="">{t('translations.allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-skin-border-ui text-left">
                  <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium w-[180px]">
                    {t('translations.colKey')}
                  </th>
                  <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium">
                    {t('translations.colEnglish')}
                  </th>
                  <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium">
                    {t('translations.colIcelandic')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((key, i) => {
                  const enChanged = enEdits[key] !== en[key];
                  const isChanged = isEdits[key] !== defaultIs[key];
                  return (
                    <tr
                      key={key}
                      className={`${i < filteredKeys.length - 1 ? 'border-b border-skin-border-ui' : ''}`}
                    >
                      <td className="px-3 py-1.5 text-xs text-skin-text-muted font-mono break-all">{key}</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={enEdits[key] || ''}
                          onChange={(e) => setEnEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                          className={`w-full px-2 py-1 bg-skin-primary border rounded text-sm text-skin-text-primary placeholder-skin-text-muted ${enChanged ? 'border-blue-500/50' : 'border-skin-border-subtle'}`}
                          placeholder={en[key] || ''}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={isEdits[key] || ''}
                          onChange={(e) => setIsEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                          className={`w-full px-2 py-1 bg-skin-primary border rounded text-sm text-skin-text-primary placeholder-skin-text-muted ${isChanged ? 'border-blue-500/50' : 'border-skin-border-subtle'}`}
                          placeholder={defaultIs[key] || ''}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-skin-text-secondary text-center pt-3">
            {filteredKeys.length} / {allKeys.length}
          </p>
        </div>
      </div>
    </div>
  );
}
