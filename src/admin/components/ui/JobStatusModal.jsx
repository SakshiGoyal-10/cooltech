// JobStatusModal.jsx
// Place at: src/admin/components/ui/JobStatusModal.jsx

import { useState } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { JOB_STATUS } from '../../constants/statusMaps';

const STATUS_META = {
  assigned:    { icon: '📋', desc: 'Job has been assigned to a technician.',        confirmLabel: 'Mark Assigned'    },
  in_progress: { icon: '🔧', desc: 'Technician is actively working on this job.',   confirmLabel: 'Mark In Progress' },
  completed:   { icon: '✅', desc: 'Job work is finished. Ready for invoicing.',     confirmLabel: 'Mark Completed'   },
  invoiced:    { icon: '📄', desc: 'An invoice will be auto-created for this job.', confirmLabel: 'Mark & Create Invoice', warning: true },
  cancelled:   { icon: '✕',  desc: 'This job will be cancelled.',                   confirmLabel: 'Cancel Job',       danger: true  },
};

export default function JobStatusModal({ job, targetStatus, onConfirm, onClose, loading }) {
  const [note, setNote] = useState('');
  if (!job || !targetStatus) return null;

  const m    = JOB_STATUS[targetStatus]   || {};
  const meta = STATUS_META[targetStatus]  || {};
  const isDanger  = meta.danger;
  const isWarning = meta.warning;

  const accentColor = isDanger  ? '#DC2626'
                    : isWarning ? '#0369A1'
                    : m.color   || COLORS.brand;

  const accentBg    = isDanger  ? '#FEF2F2'
                    : isWarning ? '#EFF6FF'
                    : m.bg      || COLORS.brandL;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16,
        width: '100%', maxWidth: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        border: '0.5px solid #e2e0db',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid #f0ede8',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: accentBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            {meta.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
              Update Status
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {job.id} · {job.customer}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, color: '#aaa', padding: 4, lineHeight: 1,
          }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '18px 22px' }}>

          {/* Current → New status pill row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 16,
          }}>
            <span style={{
              padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              background: (JOB_STATUS[job.status]?.bg || '#f3f4f6'),
              color: (JOB_STATUS[job.status]?.color || '#555'),
            }}>
              {JOB_STATUS[job.status]?.label || job.status}
            </span>
            <span style={{ color: '#ccc', fontSize: 14 }}>→</span>
            <span style={{
              padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: accentBg, color: accentColor,
              border: `1px solid ${accentColor}33`,
            }}>
              {m.label || targetStatus}
            </span>
          </div>

          {/* Description */}
          <div style={{
            background: accentBg, border: `1px solid ${accentColor}22`,
            borderRadius: 10, padding: '11px 14px',
            fontSize: 13, color: accentColor, marginBottom: 16,
            lineHeight: 1.6,
          }}>
            {meta.icon} {meta.desc}
            {targetStatus === 'invoiced' && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#555', background: '#fff', borderRadius: 7, padding: '8px 11px', border: '1px solid #e2e0db' }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: '#111' }}>Invoice will include:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Labour</span><span style={{ fontFamily: 'monospace' }}>₹1,200</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Service Charge</span><span style={{ fontFamily: 'monospace' }}>₹500</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Parts</span><span style={{ fontFamily: 'monospace' }}>₹2,885</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #f0ede8', marginTop: 6, paddingTop: 6 }}>
                  <span>Total (incl. 18% GST)</span><span style={{ fontFamily: 'monospace', color: COLORS.brand }}>₹5,409</span>
                </div>
              </div>
            )}
          </div>

          {/* Optional note */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>
              Note <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={
                targetStatus === 'cancelled'   ? 'Reason for cancellation…' :
                targetStatus === 'completed'   ? 'Work summary or observations…' :
                'Add a note about this status change…'
              }
              rows={3}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 9,
                border: '1px solid #e2e0db', fontSize: 13, color: '#222',
                fontFamily: FONTS.sans, resize: 'vertical',
                background: '#fafaf9', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '10px 16px', borderRadius: 9,
              border: '1px solid #e2e0db', background: 'transparent',
              fontSize: 13, color: '#555', cursor: 'pointer', fontWeight: 500,
            }}>
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={() => onConfirm(targetStatus, note)}
              style={{
                flex: 2, padding: '10px 16px', borderRadius: 9,
                border: 'none',
                background: isDanger  ? '#DC2626'
                           : isWarning ? '#0369A1'
                           : COLORS.brand,
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {loading ? '⏳ Updating…' : meta.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}