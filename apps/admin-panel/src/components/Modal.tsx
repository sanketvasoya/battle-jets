import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => Promise<void> | void;
  saveLabel?: string;
  saving?: boolean;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, children, onSave, saveLabel = 'Save', saving, wide }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`glass rounded-2xl p-6 space-y-4 ${wide ? 'w-full max-w-4xl' : 'w-full max-w-lg'}`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-xl">{title}</h2>
              <button onClick={onClose} className="text-textMuted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-1">
              {children}
            </div>

            {(
              <div className="flex gap-3 pt-2 border-t border-border/50">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-border rounded-xl text-textMuted hover:text-white transition-all text-sm"
                >
                  Cancel
                </button>
                {onSave && (
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/80 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : saveLabel}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Reusable form field components
interface FieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label className="text-xs text-textMuted uppercase tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function InputField({ label, value, onChange, type = 'text', step, disabled, placeholder, className }: InputFieldProps) {
  return (
    <Field label={label} className={className}>
      <input
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary disabled:opacity-50"
      />
    </Field>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function SelectField({ label, value, onChange, options, className }: SelectFieldProps) {
  return (
    <Field label={label} className={className}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </Field>
  );
}

interface ToggleFieldProps {
  label: string;
  value?: boolean;
  checked?: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}

export function ToggleField({ label, value, checked, onChange, className }: ToggleFieldProps) {
  const currentValue = value ?? checked ?? false;
  return (
    <div className={`flex items-center justify-between ${className || ''}`}>
      <label className="text-xs text-textMuted uppercase tracking-wider">{label}</label>
      <button
        onClick={() => onChange(!currentValue)}
        className={`w-10 h-5 rounded-full transition-colors ${currentValue ? 'bg-primary' : 'bg-surface border border-border'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${currentValue ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
