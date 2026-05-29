import { JOB_STATUS, INV_STATUS } from '../../constants/statusMaps';
import { contractsApi, customersApi, invoicesApi, jobsApi, ticketsApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import { jobs, invoices, tickets, contracts, customers, CON_STATUS, TKT_STATUS, PORTAL_CLIENTS } from '../../data/mockData';

// ─── ClientPortalPage ───────────────────────────────────────────────────────────────

const ClientPortalPage=()=>{
  const [viewAs,setViewAs]=useState("C002");
  const client=PORTAL_CLIENTS.find(c=>c.id===viewAs);
  const clientJobs=jobs.filter(j=>j.customer===customers.find(c=>c.id===viewAs)?.name);
  const clientInvoices=invoices.filter(i=>i.customer===customers.find(c=>c.id===viewAs)?.name);
  const clientTickets=tickets.filter(t=>t.customer===customers.find(c=>c.id===viewAs)?.name);
  const clientContracts=contracts.filter(c=>c.customer===customers.find(c2=>c2.id===viewAs)?.name);
  const customerObj=customers.find(c=>c.id===viewAs);
  return(
    <div className="fu">
      {/* Admin banner */}
      <div style={{background:"#1A1A2E",borderRadius:12,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:16}}>👁</span>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:700,color:"#FDBA74"}}>Admin Preview Mode — Client Portal</div>
          <div style={{fontSize:11,color:"#64748B"}}>You are previewing what the customer sees when they log in to their portal.</div>
        </div>
        <select value={viewAs} onChange={e=>setViewAs(e.target.value)} style={{padding:"6px 12px",borderRadius:7,border:"1px solid #2A2A4A",background:"#252540",color:"#94A3B8",fontSize:12}}>
          {PORTAL_CLIENTS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {/* Portal UI */}
      <div style={{background:"#F8FAFC",borderRadius:16,border:`1px solid ${COLORS.border}`,overflow:"hidden"}}>
        {/* Portal header */}
        <div style={{background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,padding:"20px 24px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:12,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"white"}}>{client?.avatar}</div>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:"white"}}>{client?.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.75)"}}>{client?.contact} · {client?.email}</div>
          </div>
          <div style={{marginLeft:"auto",textAlign:"right"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>Customer Since</div>
            <div style={{fontSize:13,fontWeight:700,color:"white"}}>{customerObj?.lastService}</div>
          </div>
        </div>
        {/* Portal stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,borderBottom:`1px solid ${COLORS.border}`}}>
          {[
            {label:"Total Jobs",value:customerObj?.totalJobs||0,icon:"🔧"},
            {label:"Total Spent",value:`₹${((customerObj?.totalSpent||0)/1000).toFixed(0)}K`,icon:"💰"},
            {label:"AC Units",value:customerObj?.units||0,icon:"❄️"},
            {label:"AMC Active",value:customerObj?.amc?"Yes":"No",icon:"📋"},
          ].map((s,i)=>(
            <div key={s.label} style={{padding:"16px 20px",borderRight:i<3?`1px solid ${COLORS.border}`:"none",textAlign:"center",background:COLORS.white}}>
              <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:20,fontWeight:800,color:COLORS.h1}}>{s.value}</div>
              <div style={{fontSize:11,color:COLORS.faint}}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Portal content */}
        <div style={{padding:"20px 24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {/* Recent jobs */}
          <div style={{background:COLORS.white,borderRadius:12,border:`1px solid ${COLORS.border}`,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${COLORS.border}`,fontSize:13,fontWeight:700,color:COLORS.h1}}>Recent Service Visits</div>
            {clientJobs.length>0
              ?clientJobs.map(j=>(
                <div key={j.id} style={{padding:"11px 16px",borderBottom:`1px solid ${COLORS.border}22`,display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:JOB_STATUS[j.status]?.dot||"#94A3B8",flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:COLORS.h2}}>{j.type} – {j.ac}</div>
                    <div style={{fontSize:10,color:COLORS.faint}}>{j.date} · {j.tech}</div>
                  </div>
                  <SBadge s={j.status} map={JOB_STATUS}/>
                </div>
              ))
              :<div style={{padding:"20px",textAlign:"center",fontSize:12,color:COLORS.faint}}>No jobs yet</div>
            }
          </div>
          {/* Invoices */}
          <div style={{background:COLORS.white,borderRadius:12,border:`1px solid ${COLORS.border}`,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${COLORS.border}`,fontSize:13,fontWeight:700,color:COLORS.h1}}>Invoices</div>
            {clientInvoices.length>0
              ?clientInvoices.map(i=>(
                <div key={i.id} style={{padding:"11px 16px",borderBottom:`1px solid ${COLORS.border}22`,display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:COLORS.h2}}>{i.id}</div>
                    <div style={{fontSize:10,color:COLORS.faint}}>{i.date} · Due {i.due}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,fontWeight:800,color:COLORS.brand,fontFamily:FONTS.mono}}>₹{i.total.toLocaleString()}</div>
                    <SBadge s={i.status} map={INV_STATUS}/>
                  </div>
                </div>
              ))
              :<div style={{padding:"20px",textAlign:"center",fontSize:12,color:COLORS.faint}}>No invoices</div>
            }
          </div>
          {/* Tickets */}
          <div style={{background:COLORS.white,borderRadius:12,border:`1px solid ${COLORS.border}`,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${COLORS.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:700,color:COLORS.h1}}>Support Tickets</span>
              <button style={{fontSize:11,fontWeight:700,color:COLORS.brand,background:COLORS.brandL,border:`1px solid ${COLORS.brand}30`,borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>+ Raise Ticket</button>
            </div>
            {clientTickets.length>0
              ?clientTickets.map(t=>(
                <div key={t.id} style={{padding:"11px 16px",borderBottom:`1px solid ${COLORS.border}22`,display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:COLORS.h2}}>{t.subject.slice(0,40)}…</div>
                    <div style={{fontSize:10,color:COLORS.faint}}>{t.id} · {t.updated}</div>
                  </div>
                  <span className="badge" style={{background:TKT_STATUS[t.status]?.bg,color:TKT_STATUS[t.status]?.color}}>{TKT_STATUS[t.status]?.label}</span>
                </div>
              ))
              :<div style={{padding:"20px",textAlign:"center",fontSize:12,color:COLORS.faint}}>No open tickets</div>
            }
          </div>
          {/* Contracts */}
          <div style={{background:COLORS.white,borderRadius:12,border:`1px solid ${COLORS.border}`,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${COLORS.border}`,fontSize:13,fontWeight:700,color:COLORS.h1}}>Contracts & AMC</div>
            {clientContracts.length>0
              ?clientContracts.map(c=>(
                <div key={c.id} style={{padding:"11px 16px",borderBottom:`1px solid ${COLORS.border}22`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <div style={{fontSize:12,fontWeight:700,color:COLORS.h1}}>{c.title}</div>
                    <span className="badge" style={{background:CON_STATUS[c.status]?.bg,color:CON_STATUS[c.status]?.color}}>{CON_STATUS[c.status]?.label}</span>
                  </div>
                  <div style={{fontSize:11,color:COLORS.faint}}>₹{c.value.toLocaleString()} · {c.startDate||"Pending"} – {c.endDate||"TBD"}</div>
                  {!c.signed&&<button style={{marginTop:6,fontSize:11,fontWeight:700,background:COLORS.brand,color:"white",border:"none",borderRadius:6,padding:"4px 12px",cursor:"pointer"}}>✍ Sign Contract</button>}
                </div>
              ))
              :<div style={{padding:"20px",textAlign:"center",fontSize:12,color:COLORS.faint}}>No contracts</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── 12. REPORTS (upgraded with live charts) ─────────────────────────── */

export default ClientPortalPage;
