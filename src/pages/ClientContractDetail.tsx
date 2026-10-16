import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

interface ContractDetail {
  id: string;
  contractNumber: string;
  title: string;
  scopeOfWork: string;
  deliverables?: string | null;
  totalAmount: number;
  currency: string;
  paymentTerms?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  adminSignedName?: string | null;
  adminSignedAt?: string | null;
  clientSignedName?: string | null;
  clientSignedAt?: string | null;
  createdAt: string;
  client: { companyName: string; contactName: string; email: string };
}

export const ClientContractDetail: React.FC = () => {
  const { t } = useTranslation('portal');
  const { contractId } = useParams();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/api/client/contracts/${contractId}`)
      .then((res) => setContract(res.data?.data || null))
      .catch(() => setError('Failed to load contract.'))
      .finally(() => setLoading(false));
  }, [contractId]);

  if (loading) return <div className="glass" style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>...</div>;
  if (error || !contract) return <div className="glass" style={{ padding: '48px', textAlign: 'center', color: '#f87171' }}>{error || 'Not found.'}</div>;

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: '60px 80px', fontFamily: 'Georgia, serif', margin: '-20px', width: 'calc(100% + 40px)' }}>
      <div className="no-print" style={{ marginBottom: '30px', display: 'flex', gap: '12px' }}>
        <Link to="/account/contracts" style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #ccc', background: '#f5f5f5', color: '#111', textDecoration: 'none' }}>{t('contracts.backToList')}</Link>
        <button onClick={() => window.print()} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#111', color: '#fff', cursor: 'pointer' }}>{t('contracts.print')}</button>
      </div>
      <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Service Agreement</h1>
      <p style={{ color: '#555', marginBottom: '30px' }}>{t('contracts.contractNumber')} {contract.contractNumber} · {new Date(contract.createdAt).toLocaleDateString()}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        <div>
          <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>Service Provider</h3>
          <p>YF Digital Studio (Yugen Forge)</p>
        </div>
        <div>
          <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>Client</h3>
          <p>{contract.client?.companyName}</p>
          <p>{contract.client?.contactName}</p>
          <p>{contract.client?.email}</p>
        </div>
      </div>

      <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>Project</h3>
      <p style={{ marginBottom: '20px' }}>{contract.title}</p>

      <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>{t('contracts.scopeOfWork')}</h3>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: '20px' }}>{contract.scopeOfWork}</p>

      {contract.deliverables && (
        <>
          <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>{t('contracts.deliverables')}</h3>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: '20px' }}>{contract.deliverables}</p>
        </>
      )}

      <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: '8px' }}>{t('contracts.amount')}</h3>
      <p style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 600 }}>{Number(contract.totalAmount).toLocaleString()} {contract.currency}</p>
      {contract.paymentTerms && <p style={{ color: '#555', marginBottom: '20px' }}>{contract.paymentTerms}</p>}

      {(contract.startDate || contract.endDate) && (
        <p style={{ marginBottom: '20px', color: '#555' }}>
          {contract.startDate && `${t('contracts.startDate')}: ${new Date(contract.startDate).toLocaleDateString()}`}
          {contract.startDate && contract.endDate && ' · '}
          {contract.endDate && `${t('contracts.endDate')}: ${new Date(contract.endDate).toLocaleDateString()}`}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '60px' }}>
        <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
          <p style={{ fontWeight: 600 }}>{contract.adminSignedName || '_______________________'}</p>
          <p style={{ fontSize: '12px', color: '#777' }}>For YF Digital Studio {contract.adminSignedAt && `· Signed ${new Date(contract.adminSignedAt).toLocaleDateString()}`}</p>
        </div>
        <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
          <p style={{ fontWeight: 600 }}>{contract.clientSignedName || '_______________________'}</p>
          <p style={{ fontSize: '12px', color: '#777' }}>For {contract.client?.companyName} {contract.clientSignedAt && `· Signed ${new Date(contract.clientSignedAt).toLocaleDateString()}`}</p>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  );
};

export default ClientContractDetail;
