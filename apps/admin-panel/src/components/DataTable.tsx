import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRefresh?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  addClassName?: string;
  keyField?: string;
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  onRefresh,
  onAdd,
  addLabel,
  addClassName,
  keyField = 'id',
  emptyMessage = 'No items found.',
  actions,
}: DataTableProps<T>) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div />
        <div className="flex gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 border border-border rounded-xl text-textMuted hover:text-white hover:border-primary transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${addClassName || 'bg-primary/20 border border-primary text-primary hover:bg-primary/30'}`}
            >
              <Plus className="w-4 h-4" /> {addLabel || 'Add'}
            </button>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-textMuted text-xs uppercase tracking-wide">
              {columns.map(col => (
                <th key={col.key} className={`px-4 py-3 text-${col.align || 'left'} ${col.className || ''}`}>
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={(item[keyField] as string) || idx} className="border-b border-border/40 hover:bg-surface/30 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 text-${col.align || 'left'} ${col.className || ''}`}>
                    {col.render ? col.render(item) : String(item[col.key] ?? '—')}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {actions(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-textMuted">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
