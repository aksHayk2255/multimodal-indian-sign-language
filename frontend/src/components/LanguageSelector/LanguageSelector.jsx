import React from 'react';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';

export const LanguageSelector = ({
  value = 'en',
  onChange,
  label = 'Language',
  id = 'language-select',
  className = '',
  disabled = false,
}) => {
  return (
    <div className={`language-selector-wrapper ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label" style={{ marginRight: '8px' }}>
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
        className="form-select"
        aria-label={label}
        style={{ minWidth: '140px' }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.native} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
