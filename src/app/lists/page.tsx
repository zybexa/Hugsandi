'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';

interface EmailList {
  id: string;
  name: string;
  createdAt: string;
  subscriberCount: number;
}

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export default function ListsPage() {
  const { t, tp } = useTranslation();
  const [lists, setLists] = useState<EmailList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [newListName, setNewListName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetch('/api/lists')
      .then((res) => res.json())
      .then(setLists)
      .finally(() => setLoading(false));
  }, []);

  async function loadSubscribers(listId: string) {
    setSelectedListId(listId);
    setLoadingSubs(true);
    try {
      const res = await fetch(`/api/lists/${listId}`);
      const data = await res.json();
      setSubscribers(data.subscribers || []);
    } finally {
      setLoadingSubs(false);
    }
  }

  async function createList() {
    if (!newListName.trim()) return;
    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newListName.trim() }),
    });
    if (res.ok) {
      const list = await res.json();
      setLists((prev) => [list, ...prev]);
      setNewListName('');
    }
  }

  async function deleteList(id: string) {
    if (!confirm(t('lists.deleteListConfirm'))) return;
    await fetch(`/api/lists/${id}`, { method: 'DELETE' });
    setLists((prev) => prev.filter((l) => l.id !== id));
    if (selectedListId === id) {
      setSelectedListId(null);
      setSubscribers([]);
    }
  }

  async function addSubscriber() {
    if (!selectedListId || !newEmail.trim()) return;
    const res = await fetch('/api/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId: selectedListId, email: newEmail.trim(), name: newName.trim() }),
    });
    if (res.ok) {
      const sub = await res.json();
      setSubscribers((prev) => [sub, ...prev]);
      setNewEmail('');
      setNewName('');
      setLists((prev) =>
        prev.map((l) =>
          l.id === selectedListId ? { ...l, subscriberCount: l.subscriberCount + 1 } : l
        )
      );
    }
  }

  async function removeSubscriber(id: string) {
    await fetch('/api/subscribers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
    if (selectedListId) {
      setLists((prev) =>
        prev.map((l) =>
          l.id === selectedListId ? { ...l, subscriberCount: Math.max(0, l.subscriberCount - 1) } : l
        )
      );
    }
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
    if (!file || !selectedListId) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('listId', selectedListId);

    try {
      const res = await fetch('/api/subscribers/import', { method: 'POST', body: formData });
      if (res.ok) {
        const [, listsData] = await Promise.all([
          loadSubscribers(selectedListId),
          fetch('/api/lists').then((r) => r.json()),
        ]);
        setLists(listsData);
      }
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  const selectedList = lists.find((l) => l.id === selectedListId);

  return (
    <div className="min-h-screen text-skin-text-primary">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Lists card */}
          <div className="w-80">
            <div className="bg-skin-card border-[length:var(--border-ui-width)] border-skin-border-ui rounded-[16px] shadow-skin-card p-6">
              <h2 className="text-xs font-medium text-skin-text-secondary uppercase tracking-[0.04em] mb-4">{t('lists.title')}</h2>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder={t('lists.newListPlaceholder')}
                  onKeyDown={(e) => e.key === 'Enter' && createList()}
                  className="flex-1 px-3 py-2 bg-skin-primary border border-skin-border-subtle rounded-md text-skin-text-primary text-sm placeholder-skin-text-muted transition-colors"
                />
                <button
                  onClick={createList}
                  className="px-4 py-2 bg-skin-accent hover:bg-skin-accent-hover text-white text-sm font-semibold rounded-md shadow-skin transition-all"
                >
                  {t('common.create')}
                </button>
              </div>

              {loading ? (
                <p className="text-skin-text-secondary text-sm py-4">{t('common.loading')}</p>
              ) : lists.length === 0 ? (
                <p className="text-skin-text-muted text-sm py-4">{t('lists.noLists')}</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {lists.map((list) => (
                    <div
                      key={list.id}
                      onClick={() => loadSubscribers(list.id)}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-all ${
                        selectedListId === list.id
                          ? 'bg-skin-tertiary border-l-[3px] border-l-skin-accent'
                          : 'hover:bg-skin-tertiary'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{list.name}</p>
                        <p className="text-xs text-skin-text-muted">{tp('lists.subscriberCount', list.subscriberCount)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteList(list.id);
                        }}
                        className="text-skin-text-muted hover:text-skin-danger text-xs transition-colors"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subscribers card */}
          <div className="flex-1">
            <div className="bg-skin-card border-[length:var(--border-ui-width)] border-skin-border-ui rounded-[16px] shadow-skin-card p-6">
              {selectedListId ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[1.1rem] font-semibold">{selectedList?.name}</h2>
                    <label className="px-3 py-1.5 bg-skin-tertiary hover:bg-skin-elevated text-sm rounded-md border border-skin-border-ui cursor-pointer transition-colors">
                      {importing ? t('lists.importing') : t('lists.importCsv')}
                      <input type="file" accept=".csv" onChange={importCsv} className="hidden" disabled={importing} />
                    </label>
                  </div>

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

                  {loadingSubs ? (
                    <p className="text-skin-text-secondary text-sm py-4">{t('lists.loadingSubscribers')}</p>
                  ) : subscribers.length === 0 ? (
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
                                        className="text-xs text-skin-text-muted hover:text-skin-accent transition-colors"
                                      >
                                        {t('common.edit')}
                                      </button>
                                      <button
                                        onClick={() => removeSubscriber(sub.id)}
                                        className="text-xs text-skin-text-muted hover:text-skin-danger transition-colors"
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
              ) : (
                <div className="flex items-center justify-center h-48 text-skin-text-muted">
                  <p className="text-sm">{t('lists.selectList')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
