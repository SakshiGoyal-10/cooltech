// pages/settings/TechnicianLookups.jsx
// Full CRUD — reads from and writes to /api/technician-lookups
// On first load, seeds defaults automatically if the DB is empty.

import { useState, useEffect, useCallback } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { technicianLookupsApi } from '../../services/api';

const TABS = [
  { key: 'role',           label: 'Roles',            icon: '🪪', singular: 'Role',            placeholder: 'e.g. Master Technician, HVAC Engineer…' },
  { key: 'department',     label: 'Departments',       icon: '🏢', singular: 'Department',       placeholder: 'e.g. Solar HVAC, Ducting…' },
  { key: 'employmentType', label: 'Employment Types',  icon: '💼', singular: 'Employment Type',  placeholder: 'e.g. Seasonal, Sub-contractor…' },
  { key: 'reportingTo',    label: 'Reporting To',      icon: '👤', singular: 'Manager',          placeholder: 'e.g. Regional Manager, GM…' },
  { key: 'vehicleType',    label: 'Vehicle Types',     icon: '🏍️', singular: 'Vehicle Type',     placeholder: 'e.g. Electric Bike, Three-Wheeler…' },
  { key: 'bank',           label: 'Banks',             icon: '🏦', singular: 'Bank',             placeholder: 'e.g. Federal Bank, IDFC First…' },
];

const Toggle = ({ active, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
      background: active ? '#16A34A' : '#D1D5DB',
      position: 'relative', transition: 'background .2s', flexShrink: 0,
    }}
  >
    <div style={{
      position: 'absolute', top: 3, left: active ? 23 : 3,
      width: 18, height: 18, borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s',
    }} />
  </div>
);

const AddModal = ({ tab, onClose, onSave, saving }) => {
  const [value, setValue] = useState('');
  const valid = value.trim().length > 0;
  return (
    <div
      style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,.45)',backdropFilter:'blur(3px)',display:'flex',alignItems:'center',justifyContent:'center' }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff',borderRadius:16,width:440,boxShadow:'0 24px 64px rgba(0,0,0,.18)',padding:'28px 28px 22px',fontFamily:FONTS.sans }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:`${COLORS.brand}15`,color:COLORS.brand,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{tab.icon}</div>
            <div style={{ fontSize:16,fontWeight:800,color:COLORS.h1 }}>Add {tab.singular}</div>
          </div>
          <button onClick={onClose} style={{ background:'#F3F4F6',border:'none',width:30,height:30,borderRadius:8,fontSize:16,color:COLORS.muted,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
        </div>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:10,fontWeight:700,color:COLORS.faint,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:7 }}>
            {tab.singular} Name <span style={{ color:'#DC2626' }}>*</span>
          </div>
          <input
            autoFocus value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && valid && !saving && onSave(value.trim())}
            placeholder={tab.placeholder}
            style={{ width:'100%',padding:'10px 13px',borderRadius:9,boxSizing:'border-box',border:`1.5px solid ${valid ? COLORS.brand : COLORS.border}`,fontSize:13,fontFamily:FONTS.sans,color:COLORS.h2,background:'#FAFAFA',outline:'none',boxShadow:valid?`0 0 0 3px ${COLORS.brand}18`:'none',transition:'border-color .15s' }}
          />
          {valid && <div style={{ fontSize:11,color:COLORS.brand,marginTop:5,fontWeight:600 }}>✓ "{value.trim()}" will be added</div>}
        </div>
        <div style={{ display:'flex',justifyContent:'flex-end',gap:8 }}>
          <button onClick={onClose} style={{ padding:'9px 18px',borderRadius:8,border:`1px solid ${COLORS.border}`,background:'#fff',color:COLORS.muted,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:FONTS.sans }}>Cancel</button>
          <button onClick={() => valid && !saving && onSave(value.trim())} disabled={!valid||saving}
            style={{ padding:'9px 22px',borderRadius:8,border:'none',background:valid?'linear-gradient(135deg,#ea580c,#c2410c)':COLORS.border,color:valid?'#fff':COLORS.muted,fontSize:13,fontWeight:700,cursor:valid&&!saving?'pointer':'not-allowed',fontFamily:FONTS.sans }}>
            {saving ? 'Saving…' : '✓ Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RenameInput = ({ value, onCommit, onCancel }) => {
  const [draft, setDraft] = useState(value);
  return (
    <input
      autoFocus value={draft}
      onChange={e => setDraft(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && draft.trim()) onCommit(draft.trim());
        if (e.key === 'Escape') onCancel();
      }}
      onBlur={() => draft.trim() && draft.trim() !== value ? onCommit(draft.trim()) : onCancel()}
      style={{ padding:'5px 8px',borderRadius:7,border:`1.5px solid ${COLORS.brand}`,fontSize:13,fontFamily:FONTS.sans,color:COLORS.h1,background:'#fff',outline:'none',width:200,boxShadow:`0 0 0 3px ${COLORS.brand}18` }}
    />
  );
};

const TechnicianLookups = () => {
  const [activeTab, setActiveTab]       = useState('role');
  const [grouped, setGrouped]           = useState({});
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('all');
  const [showAdd, setShowAdd]           = useState(false);
  const [renamingId, setRenamingId]     = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const fetchAll = useCallback(async (seedIfEmpty = false) => {
    try {
      setLoading(true);
      setError('');
      const res = await technicianLookupsApi.list();
      const g = res?.grouped || {};
      if (seedIfEmpty && Object.keys(g).length === 0) {
        await technicianLookupsApi.seed();
        const res2 = await technicianLookupsApi.list();
        setGrouped(res2?.grouped || {});
      } else {
        setGrouped(g);
      }
    } catch (err) {
      setError(err.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(true); }, [fetchAll]);

  const tab      = TABS.find(t => t.key === activeTab);
  const list     = grouped[activeTab] || [];
  const filtered = list.filter(item => {
    const ms = item.value.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'all' ? true : filter === 'active' ? item.isActive : !item.isActive;
    return ms && mf;
  });
  const total    = list.length;
  const active   = list.filter(i => i.isActive).length;
  const inactive = total - active;

  const handleAdd = async (value) => {
    setSaving(true);
    try {
      const doc = await technicianLookupsApi.create({ category: activeTab, value, order: list.length + 1, isActive: true });
      setGrouped(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), doc] }));
      setShowAdd(false);
    } catch (err) {
      setError(err.message || 'Failed to add.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (doc) => {
    setGrouped(prev => ({ ...prev, [activeTab]: prev[activeTab].map(i => i._id === doc._id ? { ...i, isActive: !i.isActive } : i) }));
    try {
      await technicianLookupsApi.update(doc._id, { isActive: !doc.isActive });
    } catch (err) {
      setGrouped(prev => ({ ...prev, [activeTab]: prev[activeTab].map(i => i._id === doc._id ? { ...i, isActive: doc.isActive } : i) }));
      setError(err.message || 'Failed to update.');
    }
  };

  const handleRename = async (doc, newValue) => {
    setRenamingId(null);
    if (newValue === doc.value) return;
    setGrouped(prev => ({ ...prev, [activeTab]: prev[activeTab].map(i => i._id === doc._id ? { ...i, value: newValue } : i) }));
    try {
      await technicianLookupsApi.update(doc._id, { value: newValue });
    } catch (err) {
      setGrouped(prev => ({ ...prev, [activeTab]: prev[activeTab].map(i => i._id === doc._id ? { ...i, value: doc.value } : i) }));
      setError(err.message || 'Failed to rename.');
    }
  };

  const handleDelete = async (doc) => {
    setGrouped(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(i => i._id !== doc._id) }));
    try {
      await technicianLookupsApi.remove(doc._id);
    } catch (err) {
      setGrouped(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), doc] }));
      setError(err.message || 'Failed to delete.');
    }
  };

  const handleReset = async () => {
    setConfirmReset(false);
    setSaving(true);
    try {
      const res = await technicianLookupsApi.reset(activeTab);
      setGrouped(prev => ({ ...prev, [activeTab]: res.data }));
    } catch (err) {
      setError(err.message || 'Failed to reset.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ fontFamily:FONTS.sans,color:COLORS.h2,minHeight:'100vh',background:COLORS.bg??'#F9FAFB' }}>

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24,fontWeight:800,color:COLORS.h1,margin:'0 0 4px' }}>Technician Lookups</h1>
          <p style={{ fontSize:13,color:COLORS.muted,margin:0 }}>Manage dropdown options used in the Add Technician form. Changes save instantly.</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom:16,padding:'10px 16px',borderRadius:9,background:'#FEF2F2',border:'1px solid #FECACA',fontSize:13,color:'#DC2626',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          {error}
          <button onClick={() => setError('')} style={{ background:'none',border:'none',cursor:'pointer',color:'#DC2626',fontSize:16 }}>×</button>
        </div>
      )}

      {/* Tab strip */}
      <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:20,borderBottom:`2px solid ${COLORS.border}` }}>
        {TABS.map(t => {
          const isSel = t.key === activeTab;
          const cnt   = (grouped[t.key] || []).length;
          return (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(''); setFilter('all'); setRenamingId(null); }}
              style={{ padding:'9px 16px',border:'none',cursor:'pointer',fontFamily:FONTS.sans,fontSize:13,fontWeight:isSel?700:500,background:'transparent',color:isSel?COLORS.brand:COLORS.muted,borderBottom:isSel?`2.5px solid ${COLORS.brand}`:'2.5px solid transparent',marginBottom:'-2px',borderRadius:0,display:'flex',alignItems:'center',gap:7 }}>
              {t.icon} {t.label}
              <span style={{ fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:20,background:isSel?`${COLORS.brand}18`:'#F3F4F6',color:isSel?COLORS.brand:COLORS.muted }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div style={{ background:'#fff',borderRadius:14,border:`1px solid ${COLORS.border}`,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>

        {/* Panel header */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px 16px',borderBottom:`1px solid ${COLORS.border}`,flexWrap:'wrap',gap:12 }}>
          <div>
            <div style={{ fontSize:18,fontWeight:800,color:COLORS.h1,display:'flex',alignItems:'center',gap:8 }}>{tab.icon} {tab.label}</div>
            <div style={{ fontSize:12,color:COLORS.muted,marginTop:3 }}>{total} options · {active} active · {inactive} inactive</div>
          </div>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)}
                style={{ padding:'8px 14px',borderRadius:8,border:`1px solid ${COLORS.border}`,background:'#fff',fontSize:12,fontWeight:600,color:COLORS.muted,cursor:'pointer',fontFamily:FONTS.sans }}
                onMouseEnter={e => { e.currentTarget.style.color='#DC2626'; e.currentTarget.style.borderColor='#DC2626'; }}
                onMouseLeave={e => { e.currentTarget.style.color=COLORS.muted; e.currentTarget.style.borderColor=COLORS.border; }}
              >↺ Reset defaults</button>
            ) : (
              <div style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:8,background:'#FEF2F2',border:'1px solid #FECACA' }}>
                <span style={{ fontSize:12,color:'#DC2626',fontWeight:700 }}>Reset to defaults?</span>
                <button onClick={handleReset} style={{ padding:'4px 10px',borderRadius:6,border:'none',background:'#DC2626',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer' }}>Yes</button>
                <button onClick={() => setConfirmReset(false)} style={{ padding:'4px 10px',borderRadius:6,border:'1px solid #FECACA',background:'#fff',color:'#DC2626',fontSize:11,cursor:'pointer' }}>No</button>
              </div>
            )}
            <button onClick={() => setShowAdd(true)}
              style={{ padding:'9px 18px',borderRadius:9,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#ea580c,#c2410c)',color:'#fff',fontSize:13,fontWeight:700,fontFamily:FONTS.sans,display:'flex',alignItems:'center',gap:7,boxShadow:'0 2px 8px rgba(234,88,12,.35)' }}>
              + Add {tab.singular}
            </button>
          </div>
        </div>

        {/* Search + filter */}
        <div style={{ display:'flex',alignItems:'center',gap:12,padding:'16px 24px',flexWrap:'wrap' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,border:`1px solid ${COLORS.border}`,borderRadius:9,padding:'7px 12px',background:'#FAFAFA',flex:1,minWidth:200 }}>
            <span style={{ color:COLORS.muted }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab.label.toLowerCase()}…`}
              style={{ border:'none',outline:'none',background:'transparent',fontSize:13,fontFamily:FONTS.sans,color:COLORS.h2,width:'100%' }} />
          </div>
          <div style={{ display:'flex',gap:6 }}>
            {[['all',`All (${total})`],['active',`Active (${active})`],['inactive',`Inactive (${inactive})`]].map(([val,lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding:'7px 14px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:FONTS.sans,fontSize:12,fontWeight:600,background:filter===val?COLORS.brand:'#F3F4F6',color:filter===val?'#fff':COLORS.muted }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX:'auto' }}>
          {loading ? (
            <div style={{ padding:'48px 24px',textAlign:'center',color:COLORS.muted,fontSize:13 }}>Loading…</div>
          ) : (
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F9FAFB',borderTop:`1px solid ${COLORS.border}` }}>
                  {['#','OPTION NAME','STATUS','ACTIVE',''].map((h,i) => (
                    <th key={i} style={{ padding:'10px 24px',textAlign:i===4?'right':'left',fontSize:11,fontWeight:700,color:COLORS.faint,letterSpacing:'.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding:'48px 24px',textAlign:'center',fontSize:13,color:COLORS.muted }}>
                    {search ? `No results for "${search}"` : `No ${filter !== 'all' ? filter+' ' : ''}options yet.`}
                  </td></tr>
                ) : filtered.map((item, idx) => (
                  <tr key={item._id} style={{ borderTop:`1px solid ${COLORS.border}`,transition:'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                    <td style={{ padding:'14px 24px',fontSize:13,color:COLORS.muted,width:48 }}>{idx+1}</td>

                    <td style={{ padding:'14px 24px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <div style={{ width:32,height:32,borderRadius:8,background:`${COLORS.brand}12`,color:COLORS.brand,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}>{tab.icon}</div>
                        {renamingId === item._id ? (
                          <RenameInput value={item.value} onCommit={v => handleRename(item, v)} onCancel={() => setRenamingId(null)} />
                        ) : (
                          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                            <span style={{ fontSize:13,fontWeight:600,color:COLORS.h1 }}>{item.value}</span>
                            <button onClick={() => setRenamingId(item._id)} title="Rename"
                              style={{ background:'none',border:'none',cursor:'pointer',color:COLORS.muted,fontSize:13,padding:'0 2px' }}
                              onMouseEnter={e => e.currentTarget.style.color=COLORS.brand}
                              onMouseLeave={e => e.currentTarget.style.color=COLORS.muted}>✎</button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td style={{ padding:'14px 24px' }}>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:item.isActive?'#F0FDF4':'#F3F4F6',color:item.isActive?'#16A34A':'#9CA3AF',border:`1px solid ${item.isActive?'#BBF7D0':'#E5E7EB'}` }}>
                        <span style={{ width:6,height:6,borderRadius:'50%',background:item.isActive?'#16A34A':'#9CA3AF',display:'inline-block' }} />
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td style={{ padding:'14px 24px' }}>
                      <Toggle active={item.isActive} onChange={() => handleToggle(item)} />
                    </td>

                    <td style={{ padding:'14px 24px',textAlign:'right' }}>
                      <button onClick={() => handleDelete(item)}
                        style={{ padding:'6px 14px',borderRadius:7,border:'1px solid #FECACA',background:'#FEF2F2',color:'#DC2626',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FONTS.sans,display:'inline-flex',alignItems:'center',gap:5,transition:'all .15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='#DC2626'; e.currentTarget.style.color='#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.color='#DC2626'; }}>
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 24px',borderTop:`1px solid ${COLORS.border}`,background:'#FAFAFA',fontSize:12,color:COLORS.muted }}>
          <span>Showing {filtered.length} of {total} {tab.label.toLowerCase()}</span>
          <span><span style={{ color:'#16A34A',fontWeight:700 }}>{active} active</span>{' · '}<span style={{ fontWeight:700 }}>{inactive} inactive</span></span>
        </div>
      </div>

      {showAdd && <AddModal tab={tab} onClose={() => setShowAdd(false)} onSave={handleAdd} saving={saving} />}
    </div>
  );
};

export default TechnicianLookups;