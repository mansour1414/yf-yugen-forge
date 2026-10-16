import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../utils/icons';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

// Reusable password field with a show/hide toggle. Renders its own relatively
// positioned wrapper so it can be dropped into any existing `.field` block
// without needing to change surrounding layout — the descendant `.field input`
// CSS rule still matches the nested <input> regardless of this extra wrapper.
export const PasswordInput: React.FC<PasswordInputProps> = ({ style, ...props }) => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation('common');

  return (
    <div style={{ position: 'relative' }}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        style={{ paddingInlineEnd: '46px', ...style }}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? t('password.hide') : t('password.show')}
        aria-pressed={visible}
        style={{
          position: 'absolute',
          insetInlineEnd: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={{ width: '18px', height: '18px', display: 'block' }}>
          {visible ? ICONS.eye_off : ICONS.eye}
        </span>
      </button>
    </div>
  );
};

export default PasswordInput;
