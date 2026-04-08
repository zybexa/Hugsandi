'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

interface Newsletter {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  blockCount: number;
  isComplete: boolean;
  lastSentAt: string | null;
  recipientCount: number;
  deliveredCount: number;
  deliveredPercent: number;
  openedCount: number;
  openedPercent: number;
}

interface DashboardData {
  subscriberCount: number;
  newsletters: Newsletter[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { t, tp, tError, lang } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');

  // Send modal
  const [sendNewsletter, setSendNewsletter] = useState<Newsletter | null>(null);
  const [sendSubject, setSendSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: 'success' | 'partial' | 'error'; message: string } | null>(null);

  // Delete modal
  const [deleteNewsletter, setDeleteNewsletter] = useState<Newsletter | null>(null);
  const [deleting, setDeleting] = useState(false);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(lang === 'is' ? 'is-IS' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/newsletters?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      setData(await res.json());
    } catch {
      setError(t('dash.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Prefetch newsletters immediately on mount, don't wait for translations
  useEffect(() => {
    fetch(`/api/newsletters?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => { if (res.ok) return res.json(); throw new Error(); })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleCreate() {
    if (!createName.trim()) return;
    router.push(`/editor?name=${encodeURIComponent(createName.trim())}`);
  }

  async function handleSend() {
    if (!sendNewsletter) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId: sendNewsletter.id, subject: sendSubject }),
      });
      const result = await res.json();
      if (!res.ok) {
        setSendResult({ type: 'error', message: tError(result.error) || t('error.failedToSend') });
      } else if (result.failed > 0 && result.sent > 0) {
        setSendResult({
          type: 'partial',
          message: `${result.sent} / ${result.sent + result.failed}. ${result.failed} failed.`,
        });
      } else if (result.sent > 0) {
        setSendResult({ type: 'success', message: t('dash.sendTo', { count: result.sent }) });
      } else {
        const detail = Array.isArray(result.errors) && result.errors.length > 0 ? result.errors[0] : null;
        setSendResult({ type: 'error', message: detail || t('error.noEmailsSent') });
      }
    } catch {
      setSendResult({ type: 'error', message: t('error.generic') });
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    if (!deleteNewsletter) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/designs/${deleteNewsletter.id}`, { method: 'DELETE' });
      if (res.ok) {
        setData((prev) =>
          prev ? { ...prev, newsletters: prev.newsletters.filter((n) => n.id !== deleteNewsletter.id) } : prev
        );
        setDeleteNewsletter(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  function closeSendModal() {
    const shouldRefetch = sendResult && sendResult.type !== 'error';
    setSendNewsletter(null);
    setSendSubject('');
    setSendResult(null);
    if (shouldRefetch) {
      fetchData();
    }
  }

  return (
    <div className="min-h-screen text-skin-text-primary">
      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-skin-card border-[length:var(--border-ui-width)] border-skin-border-ui rounded-[16px] shadow-skin-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-skin-text-secondary uppercase tracking-[0.04em]">{t('dash.title')}</h2>
            <button
              onClick={() => { setShowCreateModal(true); setCreateName('');  }}
              className="px-4 py-2 bg-skin-accent hover:bg-skin-accent-hover text-white text-sm font-semibold rounded-md shadow-skin transition-all"
            >
              {t('dash.createNew')}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-skin-text-muted text-sm">{t('dash.loading')}</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-skin-danger mb-4">{error}</p>
              <button onClick={fetchData} className="px-4 py-2 bg-skin-tertiary border border-skin-border-ui rounded-md text-sm font-medium hover:bg-skin-elevated transition-colors">
                {t('common.retry')}
              </button>
            </div>
          ) : !data || data.newsletters.length === 0 ? (
            <div className="text-center py-12 text-skin-text-muted">
              <p className="text-lg mb-2">{t('dash.noNewsletters')}</p>
              <p className="text-sm">{t('dash.noNewslettersHint')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-skin-border-ui text-left">
                      <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium">{t('dash.colName')}</th>
                      <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium hidden md:table-cell">{t('dash.colCreated')}</th>
                      <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium hidden md:table-cell">{t('dash.colChanged')}</th>
                      <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium">{t('dash.colSent')}</th>
                      <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium hidden lg:table-cell">{t('dash.colRecipients')}</th>
                      <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium hidden lg:table-cell">{t('dash.colDelivered')}</th>
                      <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium hidden lg:table-cell">{t('dash.colOpened')}</th>
                      <th className="px-3 py-2 text-xs text-skin-text-secondary uppercase tracking-[0.04em] font-medium">{t('dash.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.newsletters.map((nl, i) => {
                      const isSent = !!nl.lastSentAt;
                      const canSend = !isSent && nl.blockCount > 0 && nl.isComplete && data.subscriberCount > 0;
                      const sendDisabledReason = isSent ? null
                        : nl.blockCount === 0 ? t('dash.noContent')
                        : !nl.isComplete ? t('dash.incompleteCards')
                        : data.subscriberCount === 0 ? t('dash.noSubscribers')
                        : null;

                      return (
                        <tr key={nl.id} className={`${i < data.newsletters.length - 1 ? 'border-b border-skin-border-ui' : ''} transition-colors hover:bg-skin-accent-subtle`}>
                          <td className="px-3 py-2.5 text-[0.8125rem] font-medium text-skin-text-primary">{nl.name}</td>
                          <td className="px-3 py-2.5 text-[0.8125rem] text-skin-text-secondary hidden md:table-cell">{formatDate(nl.createdAt)}</td>
                          <td className="px-3 py-2.5 text-[0.8125rem] text-skin-text-secondary hidden md:table-cell">{formatDate(nl.updatedAt)}</td>
                          <td className="px-3 py-2.5">
                            {isSent ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[0.7rem] font-medium bg-skin-success-bg text-skin-success border border-skin-success-border">
                                {formatDate(nl.lastSentAt!)}
                              </span>
                            ) : !nl.isComplete ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[0.7rem] font-medium bg-skin-warning-bg text-skin-warning border border-skin-warning-border">
                                {t('dash.incomplete')}
                              </span>
                            ) : (
                              <span className="text-[0.8125rem] text-skin-text-muted">{t('dash.unsent')}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 hidden lg:table-cell text-[0.8125rem] text-skin-text-secondary tabular-nums">
                            {isSent ? nl.recipientCount : '\u2014'}
                          </td>
                          <td className="px-3 py-2.5 hidden lg:table-cell text-[0.8125rem] text-skin-text-secondary tabular-nums">
                            {isSent ? `${nl.deliveredCount} (${nl.deliveredPercent}%)` : '\u2014'}
                          </td>
                          <td className="px-3 py-2.5 hidden lg:table-cell text-[0.8125rem] text-skin-text-secondary tabular-nums">
                            {isSent ? `${nl.openedCount} (${nl.openedPercent}%)` : '\u2014'}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              {isSent ? (
                                <button
                                  onClick={() => router.push(`/editor?id=${nl.id}`)}
                                  className="px-3 py-1 text-xs font-medium rounded-md border border-skin-border-ui bg-skin-tertiary hover:bg-skin-elevated text-skin-text-secondary transition-colors"
                                >
                                  {t('dash.view')}
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      if (!canSend) return;
                                      setSendNewsletter(nl);
                                      setSendSubject(nl.name);
                                      setSendResult(null);
                                    }}
                                    disabled={!canSend}
                                    title={sendDisabledReason || undefined}
                                    className="px-3 py-1 text-xs font-medium rounded-md bg-skin-accent hover:bg-skin-accent-hover text-white shadow-skin transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {t('dash.send')}
                                  </button>
                                  <button
                                    onClick={() => router.push(`/editor?id=${nl.id}`)}
                                    className="px-3 py-1 text-xs font-medium rounded-md border border-skin-text-muted bg-skin-tertiary hover:bg-skin-elevated text-skin-text-secondary transition-colors"
                                  >
                                    {t('common.edit')}
                                  </button>
                                  <button
                                    onClick={() => setDeleteNewsletter(nl)}
                                    className="px-2 py-1 text-xs rounded-md text-skin-danger hover:bg-skin-danger-bg border border-skin-danger hover:border-skin-danger-border transition-colors"
                                  >
                                    {t('common.delete')}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-skin-text-secondary text-center pt-3">
                {tp('dash.newsletterCount', data.newsletters.length)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-skin-overlay backdrop-blur-sm flex items-center justify-center z-50" style={{ overscrollBehavior: 'contain' }} onClick={() => setShowCreateModal(false)}>
          <div className="bg-skin-secondary border-[length:var(--border-ui-width)] border-skin-border-ui rounded-[16px] p-6 w-full max-w-md shadow-skin-elevated" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[1.2rem] font-bold text-skin-text-primary mb-4">{t('dash.createTitle')}</h2>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && createName.trim()) handleCreate(); if (e.key === 'Escape') setShowCreateModal(false); }}
              placeholder={t('dash.namePlaceholder')}
              autoFocus
              className="w-full px-3 py-2 bg-skin-primary border border-skin-border-subtle rounded-md text-skin-text-primary text-sm placeholder-skin-text-muted transition-colors"
            />
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-skin-text-secondary hover:text-skin-text-primary transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!createName.trim()}
                className="px-4 py-2 bg-skin-accent hover:bg-skin-accent-hover text-white text-sm font-semibold rounded-md shadow-skin disabled:opacity-50 transition-all"
              >
                {t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send confirmation modal */}
      {sendNewsletter && (
        <div className="fixed inset-0 bg-skin-overlay backdrop-blur-sm flex items-center justify-center z-50" style={{ overscrollBehavior: 'contain' }} onClick={() => { if (!sending) closeSendModal(); }}>
          <div className="bg-skin-secondary border-[length:var(--border-ui-width)] border-skin-border-ui rounded-[16px] p-6 w-full max-w-md shadow-skin-elevated" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[1.2rem] font-bold text-skin-text-primary mb-1">{t('dash.sendTitle')}</h2>
            <p className="text-skin-text-secondary text-sm mb-4">{sendNewsletter.name}</p>

            {!sendResult ? (
              <>
                <div className="mb-4">
                  <label className="text-xs font-medium text-skin-text-secondary uppercase tracking-[0.04em] block mb-1">{t('dash.subject')}</label>
                  <input
                    type="text"
                    value={sendSubject}
                    onChange={(e) => setSendSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-skin-primary border border-skin-border-subtle rounded-md text-skin-text-primary text-sm transition-colors"
                  />
                </div>
                <p className="text-sm text-skin-text-secondary mb-4">
                  {t('dash.sendTo', { count: data?.subscriberCount ?? 0 })}
                </p>
                <div className="flex gap-2 justify-end">
                  {!sending && (
                    <button onClick={closeSendModal} className="px-4 py-2 text-sm font-medium text-skin-text-secondary hover:text-skin-text-primary transition-colors">
                      {t('common.cancel')}
                    </button>
                  )}
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="px-4 py-2 bg-skin-danger hover:bg-skin-danger-hover text-white text-sm font-semibold rounded-md shadow-skin disabled:opacity-50 transition-all"
                  >
                    {sending ? t('dash.sending', { count: data?.subscriberCount ?? 0 }) : t('dash.sendButton')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={`text-sm mb-4 ${
                  sendResult.type === 'success' ? 'text-skin-success'
                  : sendResult.type === 'partial' ? 'text-skin-warning'
                  : 'text-skin-danger'
                }`}>
                  {sendResult.message}
                </p>
                <div className="flex gap-2 justify-end">
                  {sendResult.type === 'error' ? (
                    <>
                      <button onClick={closeSendModal} className="px-4 py-2 text-sm font-medium text-skin-text-secondary hover:text-skin-text-primary transition-colors">
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={() => { setSendResult(null); }}
                        className="px-4 py-2 bg-skin-danger hover:bg-skin-danger-hover text-white text-sm font-semibold rounded-md shadow-skin transition-all"
                      >
                        {t('common.retry')}
                      </button>
                    </>
                  ) : (
                    <button onClick={closeSendModal} className="px-4 py-2 bg-skin-tertiary border border-skin-border-ui text-skin-text-primary text-sm font-medium rounded-md hover:bg-skin-elevated transition-colors">
                      {t('common.close')}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteNewsletter && (
        <div className="fixed inset-0 bg-skin-overlay backdrop-blur-sm flex items-center justify-center z-50" style={{ overscrollBehavior: 'contain' }} onClick={() => setDeleteNewsletter(null)}>
          <div className="bg-skin-secondary border-[length:var(--border-ui-width)] border-skin-border-ui rounded-[16px] p-6 w-full max-w-md shadow-skin-elevated" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[1.2rem] font-bold text-skin-text-primary mb-2">{t('dash.deleteTitle')}</h2>
            <p className="text-skin-text-secondary text-sm mb-4">
              {t('dash.deleteConfirm', { name: deleteNewsletter.name })}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteNewsletter(null)} className="px-4 py-2 text-sm font-medium text-skin-text-secondary hover:text-skin-text-primary transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-skin-danger hover:bg-skin-danger-hover text-white text-sm font-semibold rounded-md shadow-skin disabled:opacity-50 transition-all"
              >
                {deleting ? t('dash.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
