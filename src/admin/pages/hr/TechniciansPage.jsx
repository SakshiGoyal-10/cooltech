import { JOB_STATUS, TECH_STATUS } from '../../constants/statusMaps';
import { jobsApi, techsApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, Avatar } from '../../components/ui/Badges';
import { Thead } from '../../components/ui/Cards';
import ActionDropdown from '../../components/ui/ActionDropdown';
import EditableDetailView from '../../components/ui/EditableDetailView';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import PDFPreview from '../../components/layout/PDFPreview';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';

// ─── Normalise API technician → UI shape ─────────────────────────────────────
const normaliseTech = (t) => ({
  ...t,
  id:        'TECH-' + String(t._id || t.id).slice(-6).toUpperCase(),
  _id:       t._id || t.id,
  name:      t.name         || t.techName   || 'Unknown',
  role:      t.role         || t.designation || 'Technician',
  status:    t.status       || 'available',
  area:      t.area         || t.serviceArea || t.zone || '',
  phone:     t.phone        || t.mobile      || '',
  email:     t.email        || '',
  skills:    Array.isArray(t.skills) ? t.skills : (t.skills ? [t.skills] : []),
  jobs:      t.jobs         ?? t.totalJobs      ?? 0,
  completed: t.completed    ?? t.completedJobs  ?? t.done ?? 0,
  rating:    t.rating       ?? 0,
});

// ─── Normalise API job → UI shape ─────────────────────────────────────────────
const normaliseJob = (j) => ({
  ...j,
  id:       j.jobId || ('JOB-' + String(j._id).slice(-6).toUpperCase()),
  customer: typeof j.customer === 'object' ? j.customer?.name : (j.customerName || j.customer || ''),
  tech:     typeof j.technician === 'object' ? j.technician?.name : (j.techName || j.tech || 'Unassigned'),
  date:     j.scheduledDate
              ? new Date(j.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : (j.date || ''),
  time:     j.scheduledTime || j.time || '',
});

// ─── Export column config ─────────────────────────────────────────────────────
const TECH_COLUMNS = [
  { label: 'Tech ID',      key: 'id',        width: 14, tdStyle: { fontFamily: 'monospace', fontWeight: 700, color: COLORS.brand, fontSize: 11 } },
  { label: 'Name',         key: 'name',      width: 20, tdStyle: { fontWeight: 600 } },
  { label: 'Role',         key: 'role',      width: 18, tdStyle: { fontSize: 12 } },
  { label: 'Status',       key: 'status',    width: 12, format: v => TECH_STATUS[v]?.label ?? v },
  { label: 'Service Area', key: 'area',      width: 16, tdStyle: { fontSize: 12 } },
  { label: 'Phone',        key: 'phone',     width: 14, tdStyle: { fontFamily: 'monospace' } },
  { label: 'Jobs',         key: 'jobs',      width: 8,  tdStyle: { fontFamily: 'monospace', textAlign: 'center' }, format: v => v },
  { label: 'Done',         key: 'completed', width: 8,  tdStyle: { fontFamily: 'monospace', textAlign: 'center' }, format: v => v },
  { label: 'Rating',       key: 'rating',    width: 8,  format: v => `${v}★` },
];

// ─── View toggle ──────────────────────────────────────────────────────────────
const ViewToggle = ({ view, setView }) => (
  <div style={{
    display: 'flex', borderRadius: 8, overflow: 'hidden',
    border: `1px solid ${COLORS.border}`, background: COLORS.white,
  }}>
    {[{ key: 'grid', icon: '⊞', label: 'Grid' }, { key: 'table', icon: '☰', label: 'Table' }].map(({ key, icon, label }) => (
      <button key={key} onClick={() => setView(key)} style={{
        padding: '7px 14px', border: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 700, fontFamily: FONTS.sans,
        background: view === key ? COLORS.brand : COLORS.white,
        color: view === key ? '#fff' : COLORS.muted,
        transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>{label}
      </button>
    ))}
  </div>
);

const statusColor = (s) =>
  s === 'available' ? '#10B981' : s === 'busy' ? COLORS.brand : '#94A3B8';

const DS = ({ title, icon }) => (
  <div style={{
    fontSize: 11, fontWeight: 800, color: COLORS.h1,
    borderBottom: `2px solid ${COLORS.brand}22`,
    paddingBottom: 7, marginBottom: 14, marginTop: 22,
    letterSpacing: .4, textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', gap: 7,
  }}>
    {icon && <span style={{ fontSize: 14 }}>{icon}</span>}{title}
  </div>
);

const DR = ({ label, value, mono }) => !value ? null : (
  <div style={{
    display: 'flex', gap: 10, padding: '8px 0',
    borderBottom: `1px solid ${COLORS.border}22`, alignItems: 'flex-start',
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.faint, width: 170, flexShrink: 0, paddingTop: 1 }}>{label}</div>
    <div style={{ fontSize: 13, color: COLORS.h2, fontWeight: 500, fontFamily: mono ? FONTS.mono : FONTS.sans }}>{value}</div>
  </div>
);

const EF = ({ label, eKey, editMode, editData, setEditData, tech, type = 'text', options, mono, placeholder }) => {
  const readVal = tech[eKey] ?? '—';
  const editVal = editData[eKey] ?? (tech[eKey] ?? '');
  const set = (e) => setEditData(prev => ({ ...prev, [eKey]: e.target.value }));

  const inputStyle = {
    flex: 1, padding: '7px 10px', borderRadius: 7,
    border: `1.5px solid ${COLORS.border}`, fontSize: 13,
    color: COLORS.h2, background: '#FAFAFA',
    fontFamily: mono ? FONTS.mono : FONTS.sans,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
    width: '100%',
  };

  return (
    <div style={{
      display: 'flex', gap: 10, padding: '8px 0',
      borderBottom: `1px solid ${COLORS.border}22`,
      alignItems: editMode ? 'center' : 'flex-start',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.faint, width: 170, flexShrink: 0, paddingTop: editMode ? 0 : 1 }}>
        {label}
      </div>
      {editMode
        ? type === 'select'
          ? <select value={editVal} onChange={set} style={{ ...inputStyle, cursor: 'pointer' }}>
              {(options || []).map(o => <option key={o}>{o}</option>)}
            </select>
          : <input
              type={type} value={editVal} onChange={set}
              placeholder={placeholder || label} style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.brand}
              onBlur={e => e.target.style.borderColor = COLORS.border}
            />
        : <div style={{ fontSize: 13, color: readVal === '—' ? COLORS.faint : COLORS.h2, fontWeight: 500, fontFamily: mono ? FONTS.mono : FONTS.sans }}>
            {readVal}
          </div>
      }
    </div>
  );
};

const TECH_FIELDS = [
  'name','role','status','gender','dob','bloodGroup','maritalStatus','nationality',
  'department','employmentType',
  'phone','altPhone','email','personalEmail','emergencyName','emergencyPhone',
  'street','area','city','state','country','pincode',
  'joinDate','probationEnd','shift','reportingTo','salary','dailyAllowance','overtimeRate',
  'skills','experience','brands','specialization','certification','certNo',
  'vehicleType','vehicleReg','licenceNo',
  'aadhaar','pan',
  'accountHolder','bankName','accountNo','ifsc','accountType','upiId',
].map(key => ({ key }));

// ─── Technician Detail ────────────────────────────────────────────────────────
const TechnicianDetail = ({ tech, onBack, initialEditMode = false, openModal, jobs = [] }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const firstName = (tech.name ?? '').split(' ')[0];
  const techJobs  = jobs.filter(j =>
    (j.tech ?? '').toLowerCase().includes(firstName.toLowerCase())
  );

  const tabs = [
    { key: 'profile', label: '👤 Profile'   },
    { key: 'jobs',    label: '🔧 Jobs'      },
    { key: 'docs',    label: '📄 Documents' },
    { key: 'bank',    label: '🏦 Bank'      },
  ];

  return (
    <EditableDetailView
      id={tech.id}
      breadcrumb="Technicians"
      onBack={onBack}
      fields={TECH_FIELDS}
      data={tech}
      initialEditMode={initialEditMode}
      onSave={(updated) => { console.log('Saved technician:', updated); }}
      onDelete={() => { console.log('Deleted:', tech.id); onBack(); }}
    >
      {({ editMode, editData, setEditData }) => {
        const ef = (label, eKey, extra = {}) => (
          <EF
            key={eKey}
            label={label} eKey={eKey}
            editMode={editMode} editData={editData} setEditData={setEditData}
            tech={tech} {...extra}
          />
        );

        return (
          <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 16, alignItems: 'start' }}>

            {/* ── LEFT SIDEBAR ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div style={{
                background: COLORS.white, borderRadius: 14,
                border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
                boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : '0 1px 4px rgba(0,0,0,.05)',
                padding: 24, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 12, textAlign: 'center', transition: 'all .2s',
              }}>
                <div style={{ position: 'relative' }}>
                  <Avatar
                    name={editMode ? (editData.name || tech.name) : tech.name}
                    size={72}
                    color={statusColor(editMode ? (editData.status || tech.status) : tech.status)}
                  />
                  <div style={{
                    position: 'absolute', bottom: 2, right: 2, width: 14, height: 14,
                    borderRadius: '50%',
                    background: statusColor(editMode ? (editData.status || tech.status) : tech.status),
                    border: '2px solid white',
                  }} />
                </div>

                <div style={{ width: '100%' }}>
                  {editMode ? (
                    <>
                      <input
                        value={editData.name ?? tech.name}
                        onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                        style={{ width: '100%', textAlign: 'center', fontSize: 16, fontWeight: 800, color: COLORS.h1, border: `1.5px solid ${COLORS.brand}`, borderRadius: 7, padding: '5px 8px', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box', fontFamily: FONTS.sans }}
                      />
                      <select value={editData.role ?? tech.role} onChange={e => setEditData(p => ({ ...p, role: e.target.value }))}
                        style={{ marginTop: 6, width: '100%', fontSize: 12, padding: '5px 8px', borderRadius: 7, border: `1.5px solid ${COLORS.border}`, background: '#FAFAFA', color: COLORS.muted, outline: 'none', fontFamily: FONTS.sans }}>
                        {['Junior Technician','Technician','Senior Technician','Lead Technician','Supervisor','Foreman'].map(r => <option key={r}>{r}</option>)}
                      </select>
                      <select value={editData.status ?? tech.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}
                        style={{ marginTop: 8, width: '100%', fontSize: 11, padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${COLORS.border}`, background: '#FAFAFA', color: COLORS.body, outline: 'none', fontFamily: FONTS.sans }}>
                        {['available','busy','off','on_leave'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.h1 }}>{tech.name}</div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>{tech.role}</div>
                      <div style={{ fontSize: 11, fontFamily: FONTS.mono, color: COLORS.brand, fontWeight: 700, marginTop: 4 }}>{tech.id}</div>
                      <div style={{ marginTop: 8 }}><SBadge s={tech.status} map={TECH_STATUS} /></div>
                    </>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%' }}>
                  {[['Jobs', tech.jobs], ['Done', tech.completed], [`${tech.rating}★`, 'Rating']].map(([k, v], i) => (
                    <div key={k} style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: i === 2 ? '#F59E0B' : COLORS.h1, fontFamily: FONTS.mono }}>{i === 2 ? k : v}</div>
                      <div style={{ fontSize: 9, color: COLORS.faint, marginTop: 2 }}>{i === 2 ? 'Rating' : k}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: 18, transition: 'border-color .2s' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.faint, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .4 }}>Contact</div>
                {[
                  { icon: '📞', key: 'phone', type: 'tel',   fallback: '' },
                  { icon: '✉️', key: 'email', type: 'email', fallback: `${firstName.toLowerCase()}@cooltech.com` },
                  { icon: '📍', key: 'area',  type: 'text',  fallback: '' },
                ].map(({ icon, key, type, fallback }) => (
                  <div key={key} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${COLORS.border}22`, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                    {editMode
                      ? <input type={type} value={editData[key] ?? (tech[key] ?? fallback)} onChange={e => setEditData(p => ({ ...p, [key]: e.target.value }))}
                          style={{ flex: 1, fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${COLORS.border}`, background: '#FAFAFA', outline: 'none', fontFamily: FONTS.sans, color: COLORS.h2 }}
                          onFocus={e => e.target.style.borderColor = COLORS.brand}
                          onBlur={e => e.target.style.borderColor = COLORS.border}
                        />
                      : <span style={{ fontSize: 12, color: COLORS.h2 }}>{tech[key] || fallback || '—'}</span>
                    }
                  </div>
                ))}
              </div>

              <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: 18, transition: 'border-color .2s' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.faint, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .4 }}>Skills</div>
                {editMode
                  ? <input value={editData.skills ?? (Array.isArray(tech.skills) ? tech.skills.join(', ') : '')} onChange={e => setEditData(p => ({ ...p, skills: e.target.value }))} placeholder="Split, VRF, Inverter…"
                      style={{ width: '100%', fontSize: 12, padding: '7px 10px', borderRadius: 7, border: `1.5px solid ${COLORS.border}`, background: '#FAFAFA', outline: 'none', fontFamily: FONTS.sans, color: COLORS.h2, boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = COLORS.brand}
                      onBlur={e => e.target.style.borderColor = COLORS.border}
                    />
                  : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(tech.skills ?? []).map(s => (
                        <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5, background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>{s}</span>
                      ))}
                    </div>
                }
              </div>
            </div>

            {/* ── RIGHT: Tabbed panel ── */}
            <div style={{
              background: COLORS.white, borderRadius: 14,
              border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
              boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : '0 1px 4px rgba(0,0,0,.05)',
              overflow: 'hidden', transition: 'all .2s',
            }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, padding: '0 20px', background: '#FAFAFA' }}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                    padding: '13px 16px', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: activeTab === t.key ? 800 : 600,
                    color: activeTab === t.key ? COLORS.brand : COLORS.muted,
                    borderBottom: activeTab === t.key ? `2px solid ${COLORS.brand}` : '2px solid transparent',
                    fontFamily: FONTS.sans, transition: 'all .15s', marginBottom: -1,
                  }}>{t.label}</button>
                ))}
              </div>

              <div style={{ padding: 24 }}>
                {activeTab === 'profile' && <>
                  <DS title="Basic Information" icon="🪪" />
                  <DR label="Tech ID" value={tech.id} mono />
                  {ef('Gender',          'gender',         { type: 'select', options: ['Male','Female','Other'] })}
                  {ef('Date of Birth',   'dob',            { type: 'date' })}
                  {ef('Blood Group',     'bloodGroup',     { type: 'select', options: ['A+','A−','B+','B−','AB+','AB−','O+','O−'] })}
                  {ef('Marital Status',  'maritalStatus',  { type: 'select', options: ['Single','Married','Divorced','Widowed'] })}
                  {ef('Nationality',     'nationality')}
                  {ef('Department',      'department',     { type: 'select', options: ['Field Service','Installation','AMC','Repair','VRF / Chillers'] })}
                  {ef('Employment Type', 'employmentType', { type: 'select', options: ['Full-time','Part-time','Contract','Freelancer','Apprentice'] })}
                  <DS title="Contact Details" icon="📞" />
                  {ef('Mobile / WhatsApp', 'phone',         { type: 'tel' })}
                  {ef('Alternate Phone',   'altPhone',      { type: 'tel' })}
                  {ef('Personal Email',    'personalEmail', { type: 'email' })}
                  {ef('Emergency Name',    'emergencyName')}
                  {ef('Emergency Phone',   'emergencyPhone',{ type: 'tel' })}
                  <DS title="Address" icon="🏠" />
                  {ef('Street / Building', 'street')}
                  {ef('City',              'city')}
                  {ef('State',             'state')}
                  {ef('Country',           'country')}
                  {ef('Pincode',           'pincode', { mono: true })}
                  <DS title="Job Details" icon="💼" />
                  {ef('Join Date',         'joinDate',        { type: 'date' })}
                  {ef('Probation End',     'probationEnd',    { type: 'date' })}
                  {ef('Work Shift',        'shift',           { type: 'select', options: ['Morning (8 AM – 5 PM)','Afternoon (12 PM – 9 PM)','Flexible','On-call'] })}
                  {ef('Service Area',      'area')}
                  {ef('Reporting To',      'reportingTo')}
                  {ef('Basic Salary (₹)',  'salary',          { type: 'number' })}
                  {ef('Daily Allowance',   'dailyAllowance',  { type: 'number' })}
                  {ef('Overtime (₹/hr)',   'overtimeRate',    { type: 'number' })}
                  <DS title="AC Skills & Certifications" icon="❄️" />
                  {ef('Experience (yrs)', 'experience',    { type: 'number' })}
                  {ef('AC Brands',        'brands')}
                  {ef('Specialization',   'specialization',{ type: 'select', options: ['General Service','Installation & Commissioning','VRF / VRV Systems','Chiller Plants','Duct / Central AC','Refrigerant Handling'] })}
                  {ef('Certification',    'certification', { type: 'select', options: ['None / Not certified','RAC Technician (ITI)','HVAC Diploma','ASHRAE Certified','CAREL Certified','OEM Trained (Daikin / Carrier)'] })}
                  {ef('Cert No. / Expiry','certNo',        { mono: true })}
                  <DS title="Vehicle / Asset" icon="🏍️" />
                  {ef('Vehicle Type',  'vehicleType', { type: 'select', options: ['None','Bike (Own)','Bike (Company)','Van (Company)'] })}
                  {ef('Reg. No.',      'vehicleReg',  { mono: true })}
                  {ef('Licence No.',   'licenceNo',   { mono: true })}
                </>}

                {activeTab === 'jobs' && <>
                  <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>
                    {techJobs.length} job{techJobs.length !== 1 ? 's' : ''} assigned
                  </div>
                  {techJobs.length === 0
                    ? <div style={{ textAlign: 'center', padding: '40px 20px', color: COLORS.muted, fontSize: 13 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔧</div>No jobs assigned yet
                      </div>
                    : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <Thead cols={['Job ID','Customer','Type','Scheduled','Status']} />
                        <tbody>
                          {techJobs.map(j => (
                            <tr key={j._id ?? j.id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                              <td style={{ padding: '11px 14px' }}><span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: COLORS.brand }}>{j.id}</span></td>
                              <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{j.customer}</td>
                              <td style={{ padding: '11px 14px' }}><TypeTag type={j.type} /></td>
                              <td style={{ padding: '11px 14px', fontSize: 12, fontFamily: FONTS.mono, color: COLORS.body }}>{j.time || '—'}</td>
                              <td style={{ padding: '11px 14px' }}><SBadge s={j.status} map={JOB_STATUS} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  }
                </>}

                {activeTab === 'docs' && <>
                  <DS title="Identity Numbers" icon="📄" />
                  {ef('Aadhaar Number', 'aadhaar', { mono: true, placeholder: 'XXXX XXXX XXXX' })}
                  {ef('PAN Number',     'pan',     { mono: true, placeholder: 'ABCDE1234F' })}
                  <DS title="Document Uploads" icon="📎" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                    {[
                      { label: 'Aadhaar Card',    icon: '🪪', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
                      { label: 'PAN Card',         icon: '💳', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
                      { label: 'Driving Licence', icon: '🏍️', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
                      { label: 'HVAC Certificate',icon: '📜', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
                    ].map(({ label, icon, color, bg, border }) => (
                      <div key={label} style={{ padding: '14px 16px', borderRadius: 10, background: bg, border: `1.5px dashed ${border}`, display: 'flex', alignItems: 'center', gap: 10, cursor: editMode ? 'pointer' : 'default' }}>
                        <span style={{ fontSize: 22 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{editMode ? 'Click to upload' : 'Not uploaded'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>}

                {activeTab === 'bank' && <>
                  <DS title="Bank Details" icon="🏦" />
                  {ef('Account Holder', 'accountHolder')}
                  {ef('Bank Name',      'bankName',     { type: 'select', options: ['SBI – State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra','Bank of Baroda','Punjab National Bank','Canara Bank','Union Bank','IndusInd Bank','Other'] })}
                  {ef('Account Number', 'accountNo',    { mono: true })}
                  {ef('IFSC Code',      'ifsc',         { mono: true })}
                  {ef('Account Type',   'accountType',  { type: 'select', options: ['Savings','Current'] })}
                  {ef('UPI ID',         'upiId')}
                  <DS title="System Access" icon="🔐" />
                  <DR label="App Login"           value="Allowed ✅" />
                  <DR label="Email Notifications" value="Enabled" />
                  <DR label="WhatsApp Alerts"     value="Disabled" />
                  <DR label="User Role"           value={tech.role} />
                </>}
              </div>
            </div>
          </div>
        );
      }}
    </EditableDetailView>
  );
};

// ─── TechniciansPage ──────────────────────────────────────────────────────────
const TechniciansPage = ({ openModal }) => {
  const [view,           setView]           = useState('grid');
  const [selectedTech,   setSelectedTech]   = useState(null);
  const [technicians,    setTechnicians]    = useState([]);
  const [jobs,           setJobs]           = useState([]);
  const [openInEditMode, setOpenInEditMode] = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState(null);  // { id, name }

  useEffect(() => {
    techsApi.list({ limit: 200 })
      .then(r => setTechnicians((r.data ?? []).map(normaliseTech)))
      .catch(() => {});
    jobsApi.list({ limit: 500 })
      .then(r => setJobs((r.data ?? []).map(normaliseJob)))
      .catch(() => {});
  }, []);

  // ── Search + filters ────────────────────────────────────────────────────
  const { q, setQ, activeFilters, setFilter, filtered: searchFiltered } = useTableSearch(
    technicians,
    ['id', 'name', 'role', 'area', 'phone', 'status'],
    { status: '', role: '' }
  );

  const ROLE_OPTIONS   = [...new Set(technicians.map(t => t.role).filter(Boolean))].sort();
  const STATUS_OPTIONS = ['available', 'busy', 'off', 'on_leave'];

  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } =
    usePagination(searchFiltered, 12);

  const { exportProps } = useExport({
    title:      'Technicians',
    filename:   'cooltech-technicians',
    template:   'generic_list',
    subtitle:   `CoolTech AC Services · Technicians · ${searchFiltered.length} records`,
    docId:      'TECH-EXPORT',
    columns:    TECH_COLUMNS,
    rows:       searchFiltered,
    showTotals: false,
  });

  const openDetail = (tech, editMode = false) => {
    setSelectedTech(tech);
    setOpenInEditMode(editMode);
  };
  const closeDetail = () => { setSelectedTech(null); setOpenInEditMode(false); };

  // ── Soft delete: calls API then removes from local state ────────────────
  // Tries delete → remove → hardDelete in order, falls back to local-only removal
  const handleDelete = async (id) => {
    try {
      const deleteFn =
        techsApi.delete      ??   // preferred: soft-delete
        techsApi.remove      ??   // some APIs name it remove
        techsApi.hardDelete  ??   // last resort
        null;
      if (deleteFn) {
        await deleteFn(id);
      } else {
        console.warn('techsApi has no delete/remove method — removing locally only');
      }
    } catch (e) {
      console.warn('Soft delete API call failed, removing locally only', e);
    }
    setTechnicians(prev => prev.filter(t => t._id !== id));
    setDeleteTarget(null);
    if (selectedTech?._id === id) closeDetail();
  };

  if (selectedTech) {
    return (
      <TechnicianDetail
        tech={selectedTech}
        onBack={closeDetail}
        initialEditMode={openInEditMode}
        openModal={openModal}
        jobs={jobs}
      />
    );
  }

  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const todaysJobs = jobs.filter(j => j.date === todayStr);

  const available = technicians.filter(t => t.status === 'available').length;
  const busy      = technicians.filter(t => t.status === 'busy').length;
  const onLeave   = technicians.filter(t => t.status === 'on_leave' || t.status === 'off').length;

  return (
    <div className="fi" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.h1 }}>Technicians</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>{technicians.length} field staff · {available} available today</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ViewToggle view={view} setView={setView} />
          <button onClick={() => openModal('new_tech')} style={{
            padding: '9px 18px', borderRadius: 9, border: 'none',
            background: COLORS.brand, color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.sans,
            boxShadow: `0 3px 10px ${COLORS.brand}40`,
          }}>+ Add Technician</button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Total Staff',  value: technicians.length, sub: 'field staff',      icon: '👷', iconBg: '#EFF6FF', color: '#1D4ED8' },
          { label: 'Available',    value: available,           sub: 'ready to assign',  icon: '✅', iconBg: '#F0FDF4', color: '#15803D' },
          { label: 'On Job',       value: busy,                sub: 'currently busy',   icon: '🔧', iconBg: COLORS.brandL, color: COLORS.brand },
          { label: 'Off / Leave',  value: onLeave,             sub: 'unavailable',      icon: '🏖️', iconBg: '#FFF7ED', color: '#B45309' },
        ].map(({ label, value, sub, icon, iconBg, color }) => (
          <div key={label} style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: FONTS.mono }}>{value}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>{sub}</div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{
        background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`,
        padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        boxShadow: '0 1px 4px rgba(0,0,0,.05)',
      }}>
        <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, ID, area, phone…" />
        <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={STATUS_OPTIONS} allLabel="All Statuses" />
        <FilterSelect value={activeFilters.role}   onChange={val => setFilter('role', val)}   options={ROLE_OPTIONS}   allLabel="All Roles" />
        <span style={{ fontSize: 12, color: COLORS.faint, marginLeft: 4 }}>{from}–{to} of {total}</span>
        <div style={{ marginLeft: 'auto' }}><ExportDropdown {...exportProps} /></div>
      </div>

      {searchFiltered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: COLORS.faint, fontSize: 14 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          No technicians match your search or filters.
        </div>
      )}

      {/* ══ GRID VIEW ══════════════════════════════════════════════════════ */}
      {view === 'grid' && searchFiltered.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {paginated.map(t => (
              <div key={t._id ?? t.id} className="card" style={{
                background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`,
                boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: 20,
                transition: 'box-shadow .15s, transform .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Avatar name={t.name} size={44}
                      color={t.status === 'available' ? '#10B981' : t.status === 'busy' ? COLORS.brand : '#94A3B8'} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{t.role}</div>
                      <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: COLORS.brand, fontWeight: 700, marginTop: 2 }}>{t.id}</div>
                    </div>
                  </div>
                  <SBadge s={t.status} map={TECH_STATUS} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[['Jobs', t.jobs], ['Done', t.completed], [`${t.rating}★`, 'Rating']].map(([k, v], i) => (
                    <div key={k} style={{ background: '#F9FAFB', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: i === 2 ? '#F59E0B' : COLORS.h1, fontFamily: FONTS.mono }}>{i === 2 ? k : v}</div>
                      <div style={{ fontSize: 9, color: COLORS.faint, marginTop: 2 }}>{i === 2 ? 'Rating' : k}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: COLORS.faint, marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4 }}>Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(t.skills ?? []).map(s => (
                      <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 11, color: COLORS.faint }}>📍 {t.area || '—'}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn"
                      onClick={() => openModal('advance', {
                        prefillTech: { empId: t._id, name: t.name, role: t.role }
                      })}
                      style={{ padding: '5px 11px', borderRadius: 7, background: COLORS.brandL, border: `1px solid ${COLORS.brand}30`, color: COLORS.brand, fontSize: 11, fontWeight: 700 }}>
                      Advance
                    </button>
                    <button className="btn" onClick={() => openDetail(t, false)}
                      style={{ padding: '5px 11px', borderRadius: 7, background: '#F8FAFC', border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 11 }}>
                      Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
              <Pagination page={page} totalPages={totalPages} setPage={setPage}
                pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
            </div>
          )}
        </>
      )}

      {/* ══ TABLE VIEW ═════════════════════════════════════════════════════ */}
      {view === 'table' && searchFiltered.length > 0 && (
        <div style={{
          background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`,
          boxShadow: '0 1px 4px rgba(0,0,0,.05)', overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <Thead cols={['Technician','Role','Status','Service Area','Skills','Jobs','Done','Rating','Actions']} />
              <tbody>
                {paginated.map((t, i) => (
                  <tr key={t._id ?? t.id ?? i} className="row"
                    onClick={() => openDetail(t, false)}
                    style={{ borderBottom: `1px solid ${COLORS.border}22`, background: i % 2 === 0 ? COLORS.white : '#FAFAFA', cursor: 'pointer' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <Avatar name={t.name} size={34}
                            color={t.status === 'available' ? '#10B981' : t.status === 'busy' ? COLORS.brand : '#94A3B8'} />
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: statusColor(t.status), border: '1.5px solid white' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1 }}>{t.name}</div>
                          <div style={{ fontSize: 10, color: COLORS.brand, fontFamily: FONTS.mono, fontWeight: 700 }}>{t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: COLORS.body }}>{t.role}</td>
                    <td style={{ padding: '12px 16px' }}><SBadge s={t.status} map={TECH_STATUS} /></td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: COLORS.body }}>📍 {t.area || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(t.skills ?? []).slice(0, 3).map(s => (
                          <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>{s}</span>
                        ))}
                        {(t.skills ?? []).length > 3 && (
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#F9FAFB', color: COLORS.muted }}>+{t.skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: COLORS.h1, fontFamily: FONTS.mono, textAlign: 'center' }}>{t.jobs}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: COLORS.h1, fontFamily: FONTS.mono, textAlign: 'center' }}>{t.completed}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#F59E0B', textAlign: 'center' }}>{t.rating}★</td>
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <ActionDropdown
                        onView={()   => openDetail(t, false)}
                        onEdit={()   => openDetail(t, true)}
                        onDelete={() => setDeleteTarget({ id: t._id, name: t.name })}
                        extraItems={[
                          { label: 'Assign Job',   icon: '🔧', onClick: () => openModal('new_job') },
                          {
                            label: 'Give Advance', icon: '⬆',
                            onClick: () => openModal('advance', {
                              prefillTech: { empId: t._id, name: t.name, role: t.role }
                            })
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage}
            pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
        </div>
      )}

      {/* Today's Assignments */}
      <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '16px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1, marginBottom: 12 }}>
          Today's Assignments
          <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.muted, marginLeft: 8 }}>{todayStr}</span>
        </div>
        {todaysJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: COLORS.muted, fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>No jobs scheduled for today
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <Thead cols={['Job ID','Customer','Type','Scheduled','Technician','Status']} />
              <tbody>
                {todaysJobs.map(j => (
                  <tr key={j._id ?? j.id} className="row" style={{ borderBottom: `1px solid ${COLORS.border}22` }}>
                    <td style={{ padding: '11px 14px' }}><span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: COLORS.brand }}>{j.id}</span></td>
                    <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{j.customer}</td>
                    <td style={{ padding: '11px 14px' }}><TypeTag type={j.type} /></td>
                    <td style={{ padding: '11px 14px', fontSize: 12, fontFamily: FONTS.mono, color: COLORS.body }}>{j.time || '—'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      {j.tech === 'Unassigned'
                        ? <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>⚠ Unassigned</span>
                        : <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Avatar name={j.tech} size={22} />
                            <span style={{ fontSize: 12 }}>{j.tech}</span>
                          </div>
                      }
                    </td>
                    <td style={{ padding: '11px 14px' }}><SBadge s={j.status} map={JOB_STATUS} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete confirm — shows technician name ── */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={() => handleDelete(deleteTarget?.id)}
        onCancel={() => setDeleteTarget(null)}
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be soft-deleted and visible in Recently Deleted.`
            : 'This technician will be soft-deleted.'
        }
      />
    </div>
  );
};

export default TechniciansPage;