'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export default function ListsPage() {
  const { t, tp } = useTranslation();
  const [listId, setListId] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetch(`/api/lists?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((lists) => {
        if (lists.length > 0) {
          const id = lists[0].id;
          setListId(id);
          return fetch(`/api/lists/${id}`).then((res) => res.json());
        }
        return null;
      })
      .then((data) => {
        if (data) setSubscribers(data.subscribers || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function addSubscriber() {
    if (!listId || !newEmail.trim()) return;
    const res = await fetch('/api/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, email: newEmail.trim(), name: newName.trim() }),
    });
    if (res.ok) {
      const sub = await res.json();
      setSubscribers((prev) => [sub, ...prev]);
      setNewEmail('');
      setNewName('');
    }
  }

  async function removeSubscriber(id: string) {
    await fetch('/api/subscribers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  }

  function startEdit(sub: Subscriber) {
    setEditingId(sub.id);
    setEditEmail(sub.email);
    setEditName(sub.name || '');
  }

  async function saveEdit() {
    if (!editingId || !editEmail.trim()) return;
    const res = await fetch('/api/subscribers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, email: editEmail.trim(), name: editName.trim() }),
    });
    if (res.ok) {
      setSubscribers((prev) =>
        prev.map((s) =>
          s.id === editingId ? { ...s, email: editEmail.trim(), name: editName.trim() || undefined } : s
        )
      );
      setEditingId(null);
    }
  }

  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !listId) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('listId', listId);

    try {
      const res = await fetch('/api/subscribers/import', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await fetch(`/api/lists/${listId}`).then((r) => r.json());
        setSubscribers(data.subscribers || []);
      }
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <div className="min-h-screen text-skin-text-primary">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-skin-card border-[length:var(--border-ui-width)] border-skin-border-ui rounded-[16px] shadow-skin-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-skin-text-secondary uppercase tracking-[0.04em]">{t('lists.subscribers')}</h2>
            <label className="px-3 py-1.5 bg-skin-tertiary hover:bg-skin-elevated text-sm rounded-md border border-skin-border-ui cursor-pointer transition-colors">
              {importing ? t('lists.importing') : t('lists.importCsv')}
              <input type="file" accept=".csv" onChange={importCsv} className="hidden" disabled={importing || !listId} />
            </label>
          </div>

          {loading ? (
            <p className="text-skin-text-secondary text-sm py-4">{t('common.loading')}</p>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t('lists.emailPlaceholder')}
                  spellCheck={false}
                  autoComplete="off"
                  className="flex-1 px-3 py-2 bg-skin-primary border border-skin-border-subtle rounded-md text-skin-text-primary text-sm placeholder-skin-text-muted transition-colors"
                />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('lists.namePlaceholder')}
                  onKeyDown={(e) => e.key === 'Enter' && addSubscriber()}
                  className="flex-1 px-3 py-2 bg-skin-primary border border-skin-border-subtle rounded-md text-skin-text-primary text-sm placeholder-skin-text-muted transition-colors"
                />
                <button
                  onClick={addSubscriber}
                  className="px-4 py-2 bg-skin-accent hover:bg-skin-accent-hover text-white text-sm font-semibold rounded-md shadow-skin transition-all"
                >
                  {t('lists.add')}
                </button>
              </div>

              {subscribers.length === 0 ? (
                <p className="text-skin-text-muted text-sm py-8 text-center">
                  {t('lists.noSubscribers')}
                </p>
              ) : (
                <>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-skin-border-ui text-left">
                        <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium">{t('lists.colEmail')}</th>
                        <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium">{t('lists.colName')}</th>
                        <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub, i) => (
                        <tr key={sub.id} className={`${i < subscribers.length - 1 ? 'border-b border-skin-border-ui' : ''} transition-colors hover:bg-skin-accent-subtle`}>
                          {editingId === sub.id ? (
                            <>
                              <td className="px-3 py-2">
                                <input
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                                  autoFocus
                                  className="w-full px-2 py-1 bg-skin-primary border border-skin-border-subtle rounded text-sm text-skin-text-primary"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                                  className="w-full px-2 py-1 bg-skin-primary border border-skin-border-subtle rounded text-sm text-skin-text-primary"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex gap-2">
                                  <button onClick={saveEdit} className="text-xs text-skin-accent hover:text-skin-accent-hover transition-colors">{t('common.save')}</button>
                                  <button onClick={() => setEditingId(null)} className="text-xs text-skin-text-muted hover:text-skin-text-primary transition-colors">{t('common.cancel')}</button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2.5 text-[0.8125rem]">{sub.email}</td>
                              <td className="px-3 py-2.5 text-[0.8125rem] text-skin-text-secondary">{sub.name || '\u2014'}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startEdit(sub)}
                                    className="px-3 py-1 text-xs font-medium rounded-md border border-skin-text-muted bg-skin-tertiary hover:bg-skin-elevated text-skin-text-secondary transition-colors"
                                  >
                                    {t('common.edit')}
                                  </button>
                                  <button
                                    onClick={() => removeSubscriber(sub.id)}
                                    className="px-2 py-1 text-xs rounded-md text-skin-danger hover:bg-skin-danger-bg border border-skin-danger hover:border-skin-danger-border transition-colors"
                                  >
                                    {t('lists.remove')}
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-skin-text-secondary text-center pt-3">
                    {tp('lists.subscriberCount', subscribers.length)}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
