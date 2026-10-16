import { Component, ErrorInfo, ReactNode } from 'react';
import i18n from '../i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isArabic = i18n.language === 'ar';
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: isArabic ? 'var(--ff-ar)' : 'var(--ff-en)',
          textAlign: 'center',
          padding: '0 24px',
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '12px' }}>
            {i18n.t('errorBoundary.title')}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '440px', lineHeight: '1.8', marginBottom: '28px' }}>
            {i18n.t('errorBoundary.message')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary magnetic"
          >
            {i18n.t('errorBoundary.reloadBtn')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
