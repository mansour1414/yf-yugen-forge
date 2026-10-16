import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Alert } from '../components/admin/Alert';

interface ContractListItem {
  id: string;
  contractNumber: string;
  title: string;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'CANCELLED';
  createdAt: string;
}

export const ClientContracts: React.FC = () => {
  const { t } = useTranslation('portal');
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/client/contracts')
      .then((res) => setContracts(res.data?.data || []))
      .catch(() => setError('Failed to load contracts.'))
      .finally(() => setLoading(false));
  }, []);

  const statusStyle = (value: ContractListItem['status']) => ({
    padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
    background: value === 'SIGNED' ? 'rgba(74,222,128,.15)' : value === 'SENT' ? 'rgba(250,204,21,.14)' : value === 'CANCELLED' ? 'rgba(239,68,68,.14)' : 'rgba(255,255,255,.06)',
    color: value === 'SIGNED' ? '#4ade80' : value === 'SENT' ? '#fde047' : value === 'CANCELLED' ? '#f87171' : 'var(--muted)',
  });

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '20px' }}>{t('contracts.title')}</h1>
      {error && <Alert tone="error">{error}</Alert>}
      {loading ? (
        <div className="glass" style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>...</div>
      ) : contracts.length === 0 ? (
        <div className="glass" style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>{t('contracts.empty')}</div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {contracts.map((c) => (
            <div key={c.id} className="glass" style={{ padding: '20px 24px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{c.title}</div>
                <div style={{ color: 'var(--muted)', fontSize: '12.5px', marginTop: '4px' }}>{t('contracts.contractNumber')}: {c.contractNumber} · {Number(c.totalAmount).toLocaleString()} {c.currency}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={statusStyle(c.status)}>{c.status}</span>
                <Link to={`/account/contracts/${c.id}`} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '12.5px' }}>{t('contracts.viewDetails')}</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientContracts;
