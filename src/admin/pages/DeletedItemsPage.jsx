import { useState, useEffect, useMemo, useCallback } from 'react';
import { deletedItemsApi } from '../services/api';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── All soft-deletable resources ────────────────────────────────────────────
const RESOURCES = [
  { key: 'customers',           label: 'Customer',            module: 'Customer'            },
  { key: 'jobs',                label: 'Job',                 module: 'Job'                 },
  { key: 'quotations',          label: 'Quotation',           module: 'Quotation'           },
  { key: 'invoices',            label: 'Invoice',             module: 'Invoice'             },
  { key: 'tickets',             label: 'Support Ticket',      module: 'Support Ticket'      },
  { key: 'leads',               label: 'Lead',                module: 'Lead'                },
  { key: 'contracts',           label: 'Contract',            module: 'Contract'            },
  { key: 'amc',                 label: 'AMC Contract',        module: 'AMC Contract'        },
  { key: 'purchase-orders',     label: 'Work Order',          module: 'Work Order'          },
  { key: 'attendance/sessions', label: 'Attendance Session',  module: 'Attendance Session'  },
  { key: 'chat/channels',       label: 'Chat Channel',        module: 'Chat Channel'        },
  { key: 'chat/messages',       label: 'Chat Message',        module: 'Chat Message'        },
  { key: 'notices',             label: 'Notice',              module: 'Notice'              },
  { key: 'warranty',            label: 'Warranty',            module: 'Warranty'            },
  { key: 'gaslog',              label: 'Gas Log',             module: 'Gas Log'             },
  { key: 'projects',            label: 'Project',             module: 'Project'             },
  { key: 'recruitment',         label: 'Applicant',           module: 'Applicant'           },
  { key: 'customer-types',      label: 'Customer Type',       module: 'Customer Type'       },
  { key: 'lead-sources',        label: 'Lead Source',         module: 'Lead Source'         },
  { key: 'performance',         label: 'Performance',         module: 'Performance'         },
  { key: 'advance-incentive',   label: 'Advance/Incentive',   module: 'Advance/Incentive'   },
  { key: 'campaigns',           label: 'Campaign',            module: 'Campaign'            },
  { key: 'reviews',             label: 'Review',              module: 'Review'              },
  { key: 'posts',               label: 'Post',                module: 'Post'                },
  { key: 'error-codes',         label: 'AC Error Code',       module: 'AC Error Code'       },
  { key: 'content-library',     label: 'Content',             module: 'Content'             },
  { key: 'whatsapp',            label: 'WhatsApp Message',    module: 'WhatsApp Message'    },
  // ── ✅ ADDED: Technicians ──────────────────────────────────────────────────
  { key: 'technicians',         label: 'Technician',          module: 'Technician'          },
  { key: 'tasks',               label: 'Task',                module: 'Task'                },
  { key: 'expenses',            label: 'Expense',             module: 'Expense'             },
  { key: 'assets',              label: 'Asset',               module: 'Asset'               },
  { key: 'inventory',           label: 'Inventory Item',      module: 'Inventory Item'      },
  // { key: 'suppliers',           label: 'Supplier',            module: 'Supplier'            },
];

const MODULE_STYLE = {
  'Customer':            { bg: '#EAF3DE', color: '#3B6D11' },
  'Job':                 { bg: '#E6F1FB', color: '#185FA5' },
  'Quotation':           { bg: '#FAEEDA', color: '#854F0B' },
  'Invoice':             { bg: '#FCEBEB', color: '#A32D2D' },
  'Support Ticket':      { bg: '#EEEDFE', color: '#3C3489' },
  'Lead':                { bg: '#FBEAF0', color: '#72243E' },
  'Contract':            { bg: '#E1F5EE', color: '#0F6E56' },
  'AMC Contract':        { bg: '#E1F8EE', color: '#0F5E56' },
  'Work Order':          { bg: '#F1EFE8', color: '#5F5E5A' },
  'Attendance Session':  { bg: '#FFF3E0', color: '#E65100' },
  'Chat Channel':        { bg: '#E8F4FD', color: '#1565C0' },
  'Chat Message':        { bg: '#F3E5F5', color: '#6A1B9A' },
  'Task':                { bg: '#FFF7ED', color: '#C2410C' },
  'Notice':              { bg: '#E0F2FE', color: '#0369A1' },
  'Warranty':            { bg: '#F0FDF4', color: '#166534' },
  'Gas Log':             { bg: '#FDF4FF', color: '#7E22CE' },
  'Project':             { bg: '#FFF7ED', color: '#9A3412' },
  'Applicant':           { bg: '#F0F9FF', color: '#0C4A6E' },
  'Customer Type':       { bg: '#FFF7ED', color: '#C2410C' },
  'Lead Source':         { bg: '#F0F9FF', color: '#0369A1' },
  'Performance':         { bg: '#F5F3FF', color: '#6D28D9' },
  'Advance/Incentive':   { bg: '#FFF1F2', color: '#BE123C' },
  'Campaign':            { bg: '#ECFDF5', color: '#065F46' },
  'Review':              { bg: '#FFFBEB', color: '#92400E' },
  'Post':                { bg: '#F0FDF4', color: '#15803D' },
  'AC Error Code':       { bg: '#FEF2F2', color: '#991B1B' },
  'Content':             { bg: '#EFF6FF', color: '#1E40AF' },
  'WhatsApp Message':    { bg: '#F0FDF4', color: '#166534' },
  // ── ✅ ADDED ──────────────────────────────────────────────────────────────
  'Technician':          { bg: '#FFF7ED', color: '#C2410C' },
  'Expense':             { bg: '#FEF9C3', color: '#854D0E' },
  'Asset':               { bg: '#F0F9FF', color: '#0369A1' },
  'Inventory Item':      { bg: '#F0FDF4', color: '#15803D' },
  'Supplier':            { bg: '#FDF4FF', color: '#7E22CE' },
};

const ALL_MODULES = RESOURCES.map(r => r.module);

// ─── API helpers ──────────────────────────────────────────────────────────────
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('token')
    ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
    : {}),
});

async function fetchDeleted(resourceKey) {
  const res = await fetch(`${BASE}/${resourceKey}/deleted`, { headers: authHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function restoreItem(resourceKey, id) {
  const res = await fetch(`${BASE}/${resourceKey}/${id}/restore`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Restore failed');
  return res.json();
}

async function hardDeleteItem(resourceKey, id) {
  const res = await fetch(`${BASE}/${resourceKey}/${id}/hard`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

// ─── Normalise a raw doc into a display row ───────────────────────────────────
function normalise(doc, resource) {

  // ── Technician ─────────────────────────────────────────────────────────────
  if (resource.key === 'technicians') {
    return {
      _id:         doc._id,
      id:          'TECH-' + String(doc._id).slice(-6).toUpperCase(),
      name:        doc.name || doc.techName || 'Unknown Technician',
      module:      resource.module,
      resourceKey: resource.key,
      by:          doc.deletedBy ?? 'Admin',
      date:        doc.deletedAt
        ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
      rawDate:     doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Attendance Session ─────────────────────────────────────────────────────
  if (resource.key === 'attendance/sessions') {
    const userName =
      typeof doc.userId === 'object' && doc.userId !== null
        ? (doc.userId.name || doc.userId.email || 'Unknown User')
        : 'Unknown User';
    const dateStr = doc.date || new Date(doc.clockInTime).toLocaleDateString('en-IN');
    const inTime  = doc.clockInTime
      ? new Date(doc.clockInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      : '—';
    return {
      _id: doc._id, id: `ATT-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${userName} — ${dateStr} (In: ${inTime})`,
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Chat Channel ───────────────────────────────────────────────────────────
  if (resource.key === 'chat/channels') {
    return {
      _id: doc._id, id: `CH-${doc.id || String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.icon || '💬'} ${doc.label}`,
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.updatedAt ?? doc.createdAt,
    };
  }

  // ── Chat Message ───────────────────────────────────────────────────────────
  if (resource.key === 'chat/messages') {
    return {
      _id: doc._id, id: `MSG-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `[#${doc.channel}] ${doc.from}: ${(doc.msg || '').slice(0, 60)}${(doc.msg || '').length > 60 ? '…' : ''}`,
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? doc.from ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Task ───────────────────────────────────────────────────────────────────
  if (resource.key === 'tasks') {
    return {
      _id: doc._id, id: doc.taskId || `TSK-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.title || '—',
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Expense ────────────────────────────────────────────────────────────────
  if (resource.key === 'expenses') {
    return {
      _id: doc._id, id: doc.expId || `EXP-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.category || '—'} — ${doc.tech || doc.techName || '—'} (₹${doc.amount || 0})`,
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Asset ──────────────────────────────────────────────────────────────────
  if (resource.key === 'assets') {
    return {
      _id: doc._id, id: doc.assetId || `AST-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  if (resource.key === 'inventory') {
    return {
      _id: doc._id, id: doc.sku || `INV-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Supplier ───────────────────────────────────────────────────────────────
  if (resource.key === 'suppliers') {
    return {
      _id: doc._id, id: doc.supplierId || `SUP-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Customer Type ──────────────────────────────────────────────────────────
  if (resource.key === 'customer-types') {
    return {
      _id: doc._id, id: doc.typeId || `CT-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Lead Source ────────────────────────────────────────────────────────────
  if (resource.key === 'lead-sources') {
    return {
      _id: doc._id, id: doc.sourceId || `LS-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Performance ────────────────────────────────────────────────────────────
  if (resource.key === 'performance') {
    return {
      _id: doc._id, id: doc.perfId || `PRF-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.techName || 'Unknown'} — ${doc.period || ''}`,
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Advance/Incentive ──────────────────────────────────────────────────────
  if (resource.key === 'advance-incentive') {
    return {
      _id: doc._id, id: doc.recordId || `ADV-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.techName || 'Unknown'} — ${doc.type} ₹${doc.amount}`,
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Campaign ───────────────────────────────────────────────────────────────
  if (resource.key === 'campaigns') {
    return {
      _id: doc._id, id: doc.campaignId || `CAM-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Review ─────────────────────────────────────────────────────────────────
  if (resource.key === 'reviews') {
    return {
      _id: doc._id, id: doc.reviewId || `REV-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.customerName || 'Unknown'} — ${'★'.repeat(doc.rating || 0)}`,
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Post ───────────────────────────────────────────────────────────────────
  if (resource.key === 'posts') {
    return {
      _id: doc._id, id: doc.postId || `PST-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.title || '—',
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── AC Error Code ──────────────────────────────────────────────────────────
  if (resource.key === 'error-codes') {
    return {
      _id: doc._id, id: doc.codeId || `EC-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `[${doc.code || '?'}] ${(doc.description || '').slice(0, 60) || '—'}`,
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── Content Library ────────────────────────────────────────────────────────
  if (resource.key === 'content-library') {
    return {
      _id: doc._id, id: doc.contentId || `CON-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.title || '—',
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── WhatsApp Message ───────────────────────────────────────────────────────
  if (resource.key === 'whatsapp') {
    return {
      _id: doc._id, id: doc.msgId || `WA-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.recipientName || doc.recipient || 'Unknown'} (${doc.phone || '—'})`,
      module: resource.module, resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt,
    };
  }

  // ── All other resources (generic fallback) ─────────────────────────────────
  let id = doc.customerId ?? doc.quotationId ?? doc.invoiceId ?? doc.ticketId ?? doc.leadId ?? doc.contractId;

  if (!id && resource.key === 'amc') {
    id = doc.amcId || ('AMC-' + String(doc._id).slice(-6).toUpperCase());
  } else if (!id && resource.key === 'jobs') {
    id = doc.jobId || ('JOB-' + String(doc._id).slice(-6).toUpperCase());
  } else if (!id && resource.key === 'purchase-orders') {
    id = doc.poId || ('PO-' + String(doc._id).slice(-6).toUpperCase());
  } else if (!id && resource.key === 'notices') {
    id = doc.noticeId || ('NOT-' + String(doc._id).slice(-6).toUpperCase());
  } else if (!id && resource.key === 'warranty') {
    id = doc.warrantyId || ('WR-' + String(doc._id).slice(-6).toUpperCase());
  } else if (!id && resource.key === 'gaslog') {
    id = doc.logId || ('GAS-' + String(doc._id).slice(-6).toUpperCase());
  } else if (!id && resource.key === 'projects') {
    id = doc.projectId || ('PRJ-' + String(doc._id).slice(-6).toUpperCase());
  } else if (!id && resource.key === 'recruitment') {
    id = doc.appId || ('REC-' + String(doc._id).slice(-6).toUpperCase());
  }
  id = id ?? doc._id;

  const customerName =
    typeof doc.customer === 'object' && doc.customer !== null
      ? doc.customer.name
      : (doc.customerName ?? doc.customer ?? null);

  const name =
    customerName   ??
    doc.name       ??
    doc.title      ??
    doc.issue      ??
    doc.subject    ??
    doc.company    ??
    '—';

  return {
    _id:         doc._id,
    id,
    name,
    module:      resource.module,
    resourceKey: resource.key,
    by:          doc.deletedBy ?? 'Admin',
    date:        doc.deletedAt
      ? new Date(doc.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
    rawDate:     doc.deletedAt ?? doc.createdAt,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Badge({ module }) {
  const s = MODULE_STYLE[module] || { bg: '#F1EFE8', color: '#5F5E5A' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 99,
      fontSize: 11, fontWeight: 600, background: s.bg, color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {module}
    </span>
  );
}

function Checkbox({ checked, indeterminate = false, onChange }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={el => { if (el) el.indeterminate = indeterminate; }}
      onChange={e => onChange(e.target.checked)}
      style={{ cursor: 'pointer', width: 15, height: 15, accentColor: '#E8520A' }}
    />
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: '#1a1a1a', color: '#fff', padding: '10px 20px',
      borderRadius: 10, fontSize: 13, zIndex: 999, pointerEvents: 'none',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    }}>
      {msg}
    </div>
  );
}

function ConfirmModal({ modal, onConfirm, onCancel }) {
  if (!modal) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '28px 32px',
        maxWidth: 400, width: '90%', border: '0.5px solid #e2e0db',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#111' }}>
          Permanently delete {modal.count} item{modal.count > 1 ? 's' : ''}?
        </div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
          This cannot be undone. The item{modal.count > 1 ? 's' : ''} will be removed from the database forever.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '8px 18px', fontSize: 13, borderRadius: 8,
            border: '0.5px solid #d8d5cf', background: 'transparent',
            cursor: 'pointer', color: '#555',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: '8px 18px', fontSize: 13, borderRadius: 8,
            border: 'none', background: '#A32D2D', color: '#fff',
            cursor: 'pointer', fontWeight: 600,
          }}>Yes, delete permanently</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const DeletedItemsPage = () => {
  const [data,          setData]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(new Set());
  const [selected,      setSelected]      = useState(new Set());
  const [searchQ,       setSearchQ]       = useState('');
  const [modFilter,     setModFilter]     = useState('');
  const [toast,         setToast]         = useState('');
  const [confirmModal,  setConfirmModal]  = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        RESOURCES.map(r =>
          fetchDeleted(r.key)
            .then(docs => docs.map(d => normalise(d, r)))
            .catch(() => [])          // silently skip any resource whose endpoint doesn't exist yet
        )
      );
      const all = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
      setData(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtered = useMemo(() => data.filter(r => {
    if (searchQ && !String(r.id).toLowerCase().includes(searchQ.toLowerCase())
                && !r.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
    if (modFilter && r.module !== modFilter) return false;
    return true;
  }), [data, searchQ, modFilter]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  const setItemLoading = (id, on) => setActionLoading(prev => {
    const next = new Set(prev);
    on ? next.add(id) : next.delete(id);
    return next;
  });

  const toggleRow = (id, checked) => setSelected(prev => {
    const next = new Set(prev); checked ? next.add(id) : next.delete(id); return next;
  });
  const toggleAll = (checked) => setSelected(
    checked ? new Set(filtered.map(r => r._id)) : new Set()
  );
  const allChecked     = filtered.length > 0 && filtered.every(r => selected.has(r._id));
  const someChecked    = filtered.some(r => selected.has(r._id));
  const selectedInView = filtered.filter(r => selected.has(r._id)).length;

  const recoverOne = async (row) => {
    setItemLoading(row._id, true);
    try {
      await restoreItem(row.resourceKey, row._id);
      setData(prev => prev.filter(r => r._id !== row._id));
      setSelected(prev => { const n = new Set(prev); n.delete(row._id); return n; });
      showToast(`${row.name} restored`);
    } catch {
      showToast('Restore failed. Try again.');
    } finally {
      setItemLoading(row._id, false);
    }
  };

  const deleteOne = (row) => setConfirmModal({ rows: [row], count: 1 });

  const confirmDelete = async () => {
    const { rows } = confirmModal;
    setConfirmModal(null);
    for (const row of rows) {
      setItemLoading(row._id, true);
      try {
        await hardDeleteItem(row.resourceKey, row._id);
        setData(prev => prev.filter(r => r._id !== row._id));
        setSelected(prev => { const n = new Set(prev); n.delete(row._id); return n; });
      } catch {
        showToast(`Failed to delete ${row.name}`);
      } finally {
        setItemLoading(row._id, false);
      }
    }
    showToast(`${rows.length} item${rows.length > 1 ? 's' : ''} permanently deleted`);
  };

  const bulkRecover = async () => {
    const rows = filtered.filter(r => selected.has(r._id));
    if (!rows.length) return;
    let ok = 0;
    for (const row of rows) {
      try {
        await restoreItem(row.resourceKey, row._id);
        setData(prev => prev.filter(r => r._id !== row._id));
        ok++;
      } catch { /* continue */ }
    }
    setSelected(new Set());
    showToast(`${ok} item${ok > 1 ? 's' : ''} recovered`);
  };

  const bulkDelete = () => {
    const rows = filtered.filter(r => selected.has(r._id));
    if (rows.length) setConfirmModal({ rows, count: rows.length });
  };

  const S = {
    page:           { fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: '24px', color: '#1a1a1a', minHeight: '100vh', background: '#F7F6F3' },
    card:           { background: '#fff', borderRadius: 14, border: '0.5px solid #e2e0db', overflow: 'hidden' },
    header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    h1:             { fontSize: 20, fontWeight: 700, color: '#111', margin: 0 },
    sub:            { fontSize: 13, color: '#888', marginTop: 3 },
    toolbar:        { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #ece9e4' },
    input:          { padding: '7px 11px', fontSize: 13, borderRadius: 8, border: '0.5px solid #d8d5cf', background: '#fafaf9', color: '#111', flex: 1, minWidth: 180, outline: 'none' },
    select:         { padding: '7px 10px', fontSize: 13, borderRadius: 8, border: '0.5px solid #d8d5cf', background: '#fafaf9', color: '#111', outline: 'none', cursor: 'pointer' },
    th:             { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#fafaf9', borderBottom: '0.5px solid #ece9e4', whiteSpace: 'nowrap' },
    td:             { padding: '11px 14px', fontSize: 13, color: '#222', borderBottom: '0.5px solid #f0ede8', verticalAlign: 'middle' },
    btnRecover:     { padding: '5px 11px', fontSize: 12, borderRadius: 7, border: '0.5px solid #0F6E56', color: '#0F6E56', background: 'transparent', cursor: 'pointer', fontWeight: 600 },
    btnDel:         { padding: '5px 11px', fontSize: 12, borderRadius: 7, border: '0.5px solid #A32D2D', color: '#A32D2D', background: 'transparent', cursor: 'pointer', fontWeight: 600 },
    btnBulkRecover: { padding: '8px 15px', fontSize: 13, borderRadius: 8, border: 'none', color: '#fff', background: '#E8520A', cursor: 'pointer', fontWeight: 500, opacity: selectedInView > 0 ? 1 : 0.4 },
    btnBulkDel:     { padding: '8px 15px', fontSize: 13, borderRadius: 8, border: '0.5px solid #A32D2D', color: '#fff', background: '#A32D2D', cursor: 'pointer', fontWeight: 500, opacity: selectedInView > 0 ? 1 : 0.4 },
    btnRefresh:     { padding: '8px 12px', fontSize: 13, borderRadius: 8, border: '0.5px solid #d8d5cf', color: '#555', background: 'transparent', cursor: 'pointer' },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={S.h1}>🗑 Deleted Items</div>
          <div style={S.sub}>
            {loading ? 'Loading…' : `${filtered.length} of ${data.length} deleted items`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btnRefresh} onClick={loadAll} title="Refresh">↻ Refresh</button>
          <button style={S.btnBulkRecover} disabled={selectedInView === 0} onClick={bulkRecover}>
            Recover{selectedInView > 0 ? ` (${selectedInView})` : ' selected'}
          </button>
          <button style={S.btnBulkDel} disabled={selectedInView === 0} onClick={bulkDelete}>
            Delete permanently{selectedInView > 0 ? ` (${selectedInView})` : ''}
          </button>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.toolbar}>
          <input
            style={S.input}
            type="text"
            placeholder="Search by name or ID…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          <select style={S.select} value={modFilter} onChange={e => setModFilter(e.target.value)}>
            <option value="">All modules</option>
            {ALL_MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span style={{ fontSize: 12, color: '#aaa', marginLeft: 4 }}>
            {filtered.length} of {data.length} items
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 40 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 160 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={S.th}>
                  <Checkbox checked={allChecked} indeterminate={!allChecked && someChecked} onChange={toggleAll} />
                </th>
                <th style={S.th}>ID</th>
                <th style={S.th}>Name / Title</th>
                <th style={S.th}>Module</th>
                <th style={S.th}>Deleted by</th>
                <th style={S.th}>Deleted on</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#aaa' }}>
                    Loading deleted items…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: 40, color: '#aaa' }}>
                    {searchQ || modFilter ? 'No items match your filters.' : 'No deleted items found.'}
                  </td>
                </tr>
              ) : filtered.map(r => {
                const busy = actionLoading.has(r._id);
                return (
                  <tr key={r._id} style={{ background: selected.has(r._id) ? '#fdf9f6' : 'transparent', opacity: busy ? 0.5 : 1 }}>
                    <td style={S.td}>
                      <Checkbox checked={selected.has(r._id)} onChange={v => toggleRow(r._id, v)} />
                    </td>
                    <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11, color: '#888' }}>
                      {r.id}
                    </td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600, color: '#111' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{r.module}</div>
                    </td>
                    <td style={S.td}><Badge module={r.module} /></td>
                    <td style={{ ...S.td, color: '#888' }}>{r.by}</td>
                    <td style={{ ...S.td, fontSize: 12, color: '#888' }}>{r.date}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          style={{ ...S.btnRecover, opacity: busy ? 0.5 : 1 }}
                          disabled={busy}
                          onClick={() => recoverOne(r)}
                        >
                          {busy ? '…' : 'Recover'}
                        </button>
                        <button
                          style={{ ...S.btnDel, opacity: busy ? 0.5 : 1 }}
                          disabled={busy}
                          onClick={() => deleteOne(r)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal modal={confirmModal} onConfirm={confirmDelete} onCancel={() => setConfirmModal(null)} />
      <Toast msg={toast} />
    </div>
  );
};

export default DeletedItemsPage;