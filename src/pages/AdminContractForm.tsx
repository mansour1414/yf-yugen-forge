import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { PageHeader } from '../components/admin/PageHeader';
import { Alert } from '../components/admin/Alert';

interface AdminContractFormProps {
  contractId?: string;
}

interface ClientOption {
  id: string;
  companyName: string;
  contactName: string;
}

interface ProjectOption {
  id: string;
  title: string;
  clientId: string | null;
}

export const AdminContractForm: React.FC<AdminContractFormProps> = ({ contractId }) => {
  const { t, i18n } = useTranslation('admin');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(contractId);
  const dateLocale = i18n.language === 'ar' ? 'ar' : 'en-US';

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [contract, setContract] = useState<any>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [signerName, setSignerName] = useState('');

  const [form, setForm] = useState({
    clientId: searchParams.get('clientId') || '',
    projectId: searchParams.get('projectId') || '',
    title: '',
    scopeOfWork: '',
    deliverables: '',
    totalAmount: '',
    currency: 'USD',
    paymentTerms: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  useEffect(() => {
    api.get('/api/clients', { params: { limit: 100 } }).then((res) => setClients(res.data?.data || [])).catch(() => {});
    api.get('/api/projects', { params: { limit: 100 } }).then((res) => setProjects(res.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/api/contracts/${contractId}`).then((res) => {
      const c = res.data?.data;
      if (!c) return;
      setContract(c);
      setForm({
        clientId: c.clientId || '',
        projectId: c.projectId || '',
        title: c.title || '',
        scopeOfWork: c.scopeOfWork || '',
        deliverables: c.deliverables || '',
        totalAmount: String(c.totalAmount ?? ''),
        currency: c.currency || 'USD',
        paymentTerms: c.paymentTerms || '',
        startDate: c.startDate ? c.startDate.slice(0, 10) : '',
        endDate: c.endDate ? c.endDate.slice(0, 10) : '',
        notes: c.notes || '',
      });
    }).catch(() => setError(t('contractForm.loadError'))).finally(() => setLoading(false));
  }, [contractId, isEditing]);

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        clientId: form.clientId,
        projectId: form.projectId || null,
        title: form.title,
        scopeOfWork: form.scopeOfWork,
        deliverables: form.deliverables || null,
        totalAmount: Number(form.totalAmount),
        currency: form.currency,
        paymentTerms: form.paymentTerms || null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        notes: form.notes || null,
      };
      if (isEditing) {
        const res = await api.put(`/api/contracts/${contractId}`, payload);
        setContract(res.data?.data);
      } else {
        const res = await api.post('/api/contracts', payload);
        navigate(`/admin/contracts/${res.data?.data?.id}/edit`);
      }
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('contractForm.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const sign = async (role: 'admin' | 'client') => {
    if (!signerName.trim() || !contractId) return;
    try {
      const res = await api.post(`/api/contracts/${contractId}/sign`, { signerName: signerName.trim(), role });
      setContract(res.data?.data);
      setSignerName('');
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || t('contractForm.signError'));
    }
  };

  const filteredProjects = form.clientId ? projects.filter((p) => p.clientId === form.clientId) : projects;

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>{t('contractForm.loadingForm')}</div>;

  if (showPrintView && contract) {
    return (
      <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: '60px 80px', fontFamily: 'Georgia, serif' }}>
        <div className="no-print" style={{ marginBottom: '30px', display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowPrintView(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer' }}>{t('contractForm.print.backToEditor')}</button>
          <button onClick={() => window.print()} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#111', color: '#fff', cursor: 'pointer' }}>{t('contractForm.print.printSave')}</button>
        </div>
        <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>{t('contractForm.print.serviceAgreement')}</h1>
        <p style={{ color: '#555', marginBottom: '30px' }}>{t('contractForm.print.contractNo', { number: contract.contractNumber })} · {new Date(contract.createdAt).toLocaleDateString(dateLocale)}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>{t('contractForm.print.serviceProvider')}</h3>
            <p>YF Digital Studio (Yugen Forge)</p>
          </div>
          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>{t('contractForm.print.client')}</h3>
            <p>{contract.client?.companyName}</p>
            <p>{contract.client?.contactName}</p>
            <p>{contract.client?.email}</p>
          </div>
        </div>

        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>{t('contractForm.print.project')}</h3>
        <p style={{ marginBottom: '20px' }}>{contract.title}</p>

        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>{t('contractForm.print.scopeOfWork')}</h3>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: '20px' }}>{contract.scopeOfWork}</p>

        {contract.deliverables && (
          <>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>{t('contractForm.print.deliverables')}</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: '20px' }}>{contract.deliverables}</p>
          </>
        )}

        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>{t('contractForm.print.totalFee')}</h3>
        <p style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 600 }}>{Number(contract.totalAmount).toLocaleString()} {contract.currency}</p>
        {contract.paymentTerms && <p style={{ color: '#555', marginBottom: '20px' }}>{contract.paymentTerms}</p>}

        {(contract.startDate || contract.endDate) && (
          <p style={{ marginBottom: '20px', color: '#555' }}>
            {contract.startDate && `${t('contractForm.print.start')}: ${new Date(contract.startDate).toLocaleDateString(dateLocale)}`}
            {contract.startDate && contract.endDate && ' · '}
            {contract.endDate && `${t('contractForm.print.end')}: ${new Date(contract.endDate).toLocaleDateString(dateLocale)}`}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '60px' }}>
          <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
            <p style={{ fontWeight: 600 }}>{contract.adminSignedName || '_______________________'}</p>
            <p style={{ fontSize: '12px', color: '#777' }}>{t('contractForm.print.forUs')} {contract.adminSignedAt && t('contractForm.print.signedOn', { date: new Date(contract.adminSignedAt).toLocaleDateString(dateLocale) })}</p>
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
            <p style={{ fontWeight: 600 }}>{contract.clientSignedName || '_______________________'}</p>
            <p style={{ fontSize: '12px', color: '#777' }}>{t('contractForm.print.forClient', { client: contract.client?.companyName })} {contract.clientSignedAt && t('contractForm.print.signedOn', { date: new Date(contract.clientSignedAt).toLocaleDateString(dateLocale) })}</p>
          </div>
        </div>

        <style>{`@media print { .no-print { display: none !important; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <PageHeader
        title={isEditing ? t('contractForm.contractTitlePrefix', { number: contract?.contractNumber || '' }) : t('contractForm.newContractTitle')}
        actions={isEditing && contract ? (
          <button onClick={() => setShowPrintView(true)} className="btn btn-outline">{t('contractForm.viewPrint')}</button>
        ) : undefined}
      />

      {error && <Alert tone="error">{error}</Alert>}

      {isEditing && contract && (
        <div className="glass dash-card" style={{ padding: '20px 24px', marginBottom: '24px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {t('contractForm.statusLabel')} <strong style={{ color: 'var(--text)' }}>{t(`contractsPage.status.${contract.status.toLowerCase()}`)}</strong>
            {contract.adminSignedAt && ` ${t('contractForm.signedByUs')}`}
            {contract.clientSignedAt && ` ${t('contractForm.signedByClient')}`}
          </span>
          {contract.status !== 'SIGNED' && contract.status !== 'CANCELLED' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input placeholder={t('contractForm.signerNamePlaceholder')} value={signerName} onChange={(e) => setSignerName(e.target.value)} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontSize: '13px' }} />
              <button onClick={() => sign('admin')} className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '12px' }}>{t('contractForm.signAsUs')}</button>
              <button onClick={() => sign('client')} className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '12px' }}>{t('contractForm.signAsClient')}</button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={submit} className="glass dash-card" style={{ padding: '40px', display: 'grid', gap: '22px', borderRadius: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('contractForm.client')}</label>
              <select required name="clientId" value={form.clientId} onChange={change} style={{ width: '100%', background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)', borderRadius: '12px', padding: '14px 16px', color: 'var(--text)' }}>
                <option value="">{t('contractForm.selectClient')}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName} ({c.contactName})</option>)}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('contractForm.linkedProject')}</label>
              <select name="projectId" value={form.projectId} onChange={change} style={{ width: '100%', background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)', borderRadius: '12px', padding: '14px 16px', color: 'var(--text)' }}>
                <option value="">{t('contractForm.noneOption')}</option>
                {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>{t('contractForm.contractTitle')}</label>
            <input required name="title" value={form.title} onChange={change} placeholder={t('contractForm.contractTitlePlaceholder')} />
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>{t('contractForm.scopeOfWork')}</label>
            <textarea required name="scopeOfWork" rows={5} value={form.scopeOfWork} onChange={change} placeholder={t('contractForm.scopeOfWorkPlaceholder')} />
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>{t('contractForm.deliverables')}</label>
            <textarea name="deliverables" rows={3} value={form.deliverables} onChange={change} placeholder={t('contractForm.deliverablesPlaceholder')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('contractForm.totalAmount')}</label>
              <input required type="number" min="0" step="0.01" name="totalAmount" value={form.totalAmount} onChange={change} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('contractForm.currency')}</label>
              <input name="currency" value={form.currency} onChange={change} placeholder="USD" />
            </div>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>{t('contractForm.paymentTerms')}</label>
            <input name="paymentTerms" value={form.paymentTerms} onChange={change} placeholder={t('contractForm.paymentTermsPlaceholder')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('contractForm.startDate')}</label>
              <input type="date" name="startDate" value={form.startDate} onChange={change} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>{t('contractForm.endDate')}</label>
              <input type="date" name="endDate" value={form.endDate} onChange={change} />
            </div>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>{t('contractForm.internalNotes')}</label>
            <textarea name="notes" rows={3} value={form.notes} onChange={change} placeholder={t('contractForm.internalNotesPlaceholder')} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <a className="btn btn-outline" href="/admin/contracts">{t('common.cancel')}</a>
            <button className="btn btn-primary" disabled={submitting}>{submitting ? t('contractForm.saving') : isEditing ? t('contractForm.updateBtn') : t('contractForm.createBtn')}</button>
          </div>
        </form>
    </div>
  );
};

export default AdminContractForm;
