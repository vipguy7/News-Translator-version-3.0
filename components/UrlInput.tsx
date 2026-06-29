
import React from 'react';
import { UI_STRINGS_MY } from '../constants';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const UrlInput: React.FC<UrlInputProps> = ({ 
  value, 
  onChange, 
  label = UI_STRINGS_MY.ENTER_URL_PROMPT, 
  placeholder = UI_STRINGS_MY.URL_PLACEHOLDER 
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor={label.replace(/\s/g, '-').toLowerCase()} className="block text-sm font-medium text-black font-serif">
        {label}
      </label>
      <input
        type="url"
        id={label.replace(/\s/g, '-').toLowerCase()}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-400 rounded-md shadow-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-serif"
        aria-label={label}
      />
    </div>
  );
};

export default UrlInput;