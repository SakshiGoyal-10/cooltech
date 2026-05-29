import { useState, useEffect } from 'react';
import { customersApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import {WA_TEMPLATES, customers, SM_CHANNELS} from '../../data/mockData';

// ─── WhatsAppPage ───────────────────────────────────────────────────────────────

const WhatsAppPage=()=>{
  const [tab,setTab]=useState("templates");
  const totalSent=WA_TEMPLATES.reduce((s,t)=>s+t.sent,0);
  const totalRead=WA_TEMPLATES.reduce((s,t)=>s+t.read,0);
  const avgRead=totalSent>0?Math.round((totalRead/totalSent)*100):0;
  return(
    <div className="fi" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:20,fontWeight:800,color:COLORS.h1}}>WhatsApp Marketing</div>
        <div style={{fontSize:13,color:COLORS.muted,marginTop:2}}>{customers.length} contacts · Business API connected</div></div>
        <button className="btn" onClick={()=>setTab("broadcast")} style={{padding:"9px 22px",borderRadius:9,background:"linear-gradient(135deg,#25D366,#128C7E)",color:"white",fontSize:13,fontWeight:700,boxShadow:"0 3px 10px #25D36640"}}>📤 Send Blast</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <KCard label="Total Sent"    value={totalSent.toLocaleString()} sub="all templates"       icon="📤" iconBg="#F0FDF4" color="#25D366" delay=""/>
        <KCard label="Avg Read Rate" value={avgRead+"%"}               sub="industry avg 60%"     icon="👁" iconBg="#EFF6FF" color="#0369A1" delay="1"/>
        <KCard label="Leads via WA"  value={SM_CHANNELS.find(c=>c.id==="wa")?.leads||0} sub="this month" icon="🎯" iconBg="#FFF7ED" color="#EA580C" delay="2"/>
        <KCard label="Active Templates" value={WA_TEMPLATES.filter(t=>t.status==="active").length} sub="running" icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="3"/>
      </div>
      <div style={{display:"flex",gap:0,background:COLORS.white,borderRadius:10,border:"1px solid #E5E7EB",padding:3,width:"fit-content"}}>
        {[["templates","Templates"],["broadcast","Broadcast"],["contacts","Contacts"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"6px 16px",borderRadius:8,fontSize:12,fontWeight:600,background:tab===k?"#F0FDF4":"transparent",color:tab===k?"#25D366":COLORS.muted,border:"none",cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {tab==="templates"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {WA_TEMPLATES.map(tmpl=>(
            <div key={tmpl.id} style={{background:COLORS.white,borderRadius:12,border:"1px solid #E5E7EB",padding:"16px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5}}>
                    <div style={{width:28,height:28,borderRadius:7,background:"#F0FDF4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💬</div>
                    <span style={{fontSize:14,fontWeight:700,color:COLORS.h1}}>{tmpl.name}</span>
                    <span style={{fontFamily:"Fira Code,monospace",fontSize:10,color:COLORS.faint}}>{tmpl.id}</span>
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99,background:"#F0FDF4",color:"#16A34A"}}>● Active</span>
                  </div>
                  <div style={{fontSize:11,color:COLORS.muted}}>Trigger: <strong style={{color:COLORS.h2}}>{tmpl.trigger}</strong></div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button className="btn" onClick={()=>setTab("broadcast")} style={{padding:"5px 12px",borderRadius:7,background:"#F0FDF4",border:"1px solid #BBF7D0",color:"#16A34A",fontSize:11,fontWeight:700}}>Send Now</button>
                  <button className="btn" onClick={()=>setTab("broadcast")} style={{padding:"5px 12px",borderRadius:7,background:"#FFF7ED",border:"1px solid #EA580C30",color:"#EA580C",fontSize:11,fontWeight:700}}>Edit</button>
                </div>
              </div>
              <div style={{background:"#F0FDF4",borderRadius:9,padding:"11px 14px",marginBottom:12,borderLeft:"3px solid #25D366"}}>
                <div style={{fontSize:12,color:"#166534",lineHeight:1.7,fontStyle:"italic"}}>{tmpl.message}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {[["Sent",tmpl.sent,"#64748B"],["Delivered",tmpl.delivered,"#0369A1"],["Read",tmpl.read,"#16A34A"],["Clicked",tmpl.clicks,"#EA580C"]].map(([k,v,c])=>(
                  <div key={k} style={{background:COLORS.bg,borderRadius:7,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:15,fontWeight:800,color:c,fontFamily:"Fira Code,monospace"}}>{v.toLocaleString()}</div>
                    <div style={{fontSize:10,color:COLORS.faint,marginTop:2}}>{k}</div>
                    <div style={{fontSize:10,color:c,fontWeight:600}}>{tmpl.sent>0?Math.round((v/tmpl.sent)*100):0}%</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==="broadcast"&&(
        <div style={{background:COLORS.white,borderRadius:14,border:"1px solid #E5E7EB",padding:24,boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
          <div style={{fontSize:14,fontWeight:700,color:COLORS.h1,marginBottom:18}}>Send Broadcast Message</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div><div style={{fontSize:12,fontWeight:600,color:COLORS.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>Target Audience</div>
            <select style={{width:"100%",padding:"10px 13px",borderRadius:8,border:"1px solid #E5E7EB",fontSize:13,background:COLORS.white}}>
              <option>All Customers ({customers.length})</option>
              <option>AMC Customers</option><option>Commercial Customers</option>
              <option>Residential Customers</option><option>Due for Service</option>
            </select></div>
            <div><div style={{fontSize:12,fontWeight:600,color:COLORS.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>Use Template</div>
            <select style={{width:"100%",padding:"10px 13px",borderRadius:8,border:"1px solid #E5E7EB",fontSize:13,background:COLORS.white}}>
              <option>Select a template...</option>
              {WA_TEMPLATES.map(t=><option key={t.id}>{t.name}</option>)}
            </select></div>
          </div>
          <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:COLORS.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>Message</div>
          <textarea placeholder="Type your WhatsApp message..." style={{width:"100%",padding:"11px 13px",borderRadius:8,border:"1px solid #E5E7EB",fontSize:13,fontFamily:"Plus Jakarta Sans,sans-serif",resize:"vertical",minHeight:110}}/></div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn" onClick={()=>setTab("contacts")} style={{flex:1,padding:"12px",borderRadius:9,background:"linear-gradient(135deg,#25D366,#128C7E)",color:"white",fontSize:13,fontWeight:700,boxShadow:"0 4px 12px #25D36640"}}>📤 Send to {customers.length} Contacts</button>
            <button className="btn" onClick={()=>setTab("contacts")} style={{padding:"12px 16px",borderRadius:9,background:COLORS.bg,border:"1px solid #E5E7EB",color:COLORS.muted,fontSize:13}}>Schedule</button>
          </div>
        </div>
      )}
      {tab==="contacts"&&(
        <div style={{background:COLORS.white,borderRadius:14,border:"1px solid #E5E7EB",boxShadow:"0 1px 4px rgba(0,0,0,.05)",overflow:"clip"}}>
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",borderRadius:0}}><table style={{width:"100%",borderCollapse:"collapse"}}>
            <Thead cols={["Customer","Phone","Type","AMC","Opt-in","Last Message",""]}/>
            <tbody>{customers.map((c,i)=>(
              <tr key={c.id} className="row" style={{borderBottom:"1px solid #E5E7EB22"}}>
                <td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:9}}><Avatar name={c.name} size={30}/><div style={{fontSize:13,fontWeight:700,color:COLORS.h1}}>{c.name}</div></div></td>
                <td style={{padding:"12px 14px",fontFamily:"Fira Code,monospace",fontSize:12,color:COLORS.muted}}>{c.phone}</td>
                <td style={{padding:"12px 14px"}}><TypeTag type={c.type}/></td>
                <td style={{padding:"12px 14px"}}>{c.amc?<span style={{fontSize:11,fontWeight:700,color:"#16A34A"}}>✅ AMC</span>:<span style={{fontSize:11,color:COLORS.faint}}>—</span>}</td>
                <td style={{padding:"12px 14px"}}><span style={{fontSize:11,fontWeight:700,color:"#25D366"}}>✅ Opted In</span></td>
                <td style={{padding:"12px 14px",fontSize:11,color:COLORS.muted}}>{c.lastService}</td>
                <td style={{padding:"12px 14px"}}><button className="btn" onClick={()=>setTab("broadcast")} style={{padding:"4px 10px",borderRadius:6,background:"#F0FDF4",border:"1px solid #BBF7D0",color:"#25D366",fontSize:11,fontWeight:700}}>Message</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   PAGE: REVIEWS & REPUTATION
══════════════════════════════════════════════════════════════════════════ */

export default WhatsAppPage;
