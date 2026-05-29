import { useState, useEffect } from 'react';
import { leadsApi } from '../../services/api';
import { leads } from '../../data/mockData';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, Avatar } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';

// ─── Local constants ──────────────────────────────────────────────────────────
const TEMP_CFG={
  hot:  {label:"Hot",  icon:"🔥", color:"#EF4444", bg:"#FEF2F2"},
  warm: {label:"Warm", icon:"☀️", color:"#F59E0B", bg:"#FFFBEB"},
  cold: {label:"Cold", icon:"❄️", color:"#3B82F6", bg:"#EFF6FF"},
};

// ─── CrmBar ───────────────────────────────────────────────────────────────────
const CrmBar=({label,value,max,color})=>{
  const pct=max>0?Math.round((value/max)*100):0;
  return(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:12,color:COLORS.h2,fontWeight:600}}>{label}</span>
        <span style={{fontSize:12,fontFamily:FONTS.mono,fontWeight:700,color}}>{value.toLocaleString()}</span>
      </div>
      <div style={{height:7,borderRadius:99,background:"#E2E8F0",overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:color,transition:"width .4s ease"}}/>
      </div>
    </div>
  );
};

// ─── CRMAnalyticsPage ─────────────────────────────────────────────────────────
const CRMAnalyticsPage=()=>{
  const wonLeads=leads.filter(l=>l.stage==="won");
  const lostLeads=leads.filter(l=>l.stage==="lost");
  const activeLeads=leads.filter(l=>!["won","lost"].includes(l.stage));
  const totalPipeline=activeLeads.reduce((s,l)=>s+l.value,0);
  const wonValue=wonLeads.reduce((s,l)=>s+l.value,0);
  const winRate=Math.round((wonLeads.length/(wonLeads.length+lostLeads.length))*100)||0;
  const sourceData=[
    {src:"Referral",count:1,value:64000},
    {src:"Google Ad",count:1,value:28000},
    {src:"LinkedIn",count:1,value:72000},
    {src:"Walk-in",count:1,value:9000},
    {src:"Instagram",count:1,value:12000},
    {src:"Cold Call",count:1,value:120000},
  ].sort((a,b)=>b.value-a.value);
  const stageOrder=["new","follow_up","proposal_sent","negotiation","won","lost"];
  const stageData=stageOrder.map(s=>({
    stage:s,
    label:s==="follow_up"?"Follow Up":s==="proposal_sent"?"Proposal Sent":s.charAt(0).toUpperCase()+s.slice(1),
    count:leads.filter(l=>l.stage===s).length,
    value:leads.filter(l=>l.stage===s).reduce((a,l)=>a+l.value,0),
  }));
  const repData=[
    {name:"Rajesh P.",leads:leads.filter(l=>l.assignedTo==="Rajesh P.").length,won:leads.filter(l=>l.assignedTo==="Rajesh P."&&l.stage==="won").length,value:leads.filter(l=>l.assignedTo==="Rajesh P."&&l.stage==="won").reduce((s,l)=>s+l.value,0)},
    {name:"Rekha S.",leads:leads.filter(l=>l.assignedTo==="Rekha S.").length,won:leads.filter(l=>l.assignedTo==="Rekha S."&&l.stage==="won").length,value:leads.filter(l=>l.assignedTo==="Rekha S."&&l.stage==="won").reduce((s,l)=>s+l.value,0)},
    {name:"Unassigned",leads:leads.filter(l=>l.assignedTo==="Unassigned").length,won:0,value:0},
  ];
  const STAGE_COLORS=["#3B82F6","#F59E0B","#8B5CF6","#EA580C","#22C55E","#EF4444"];
  return(
    <div className="fu">
      <div style={{marginBottom:16}}>
        <div style={{fontSize:20,fontWeight:800,color:COLORS.h1}}>CRM Analytics</div>
        <div style={{fontSize:13,color:COLORS.muted,marginTop:2}}>Sales funnel performance, win rates & revenue forecasting</div>
      </div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Pipeline Value",value:`₹${(totalPipeline/1000).toFixed(0)}K`,icon:"🎯",color:COLORS.brand,bg:COLORS.brandL,sub:`${activeLeads.length} active leads`},
          {label:"Won This Month",value:`₹${(wonValue/1000).toFixed(0)}K`,icon:"🏆",color:"#16A34A",bg:"#F0FDF4",sub:`${wonLeads.length} deals closed`},
          {label:"Win Rate",value:`${winRate}%`,icon:"📈",color:"#8B5CF6",bg:"#F5F3FF",sub:"closed deals"},
          {label:"Avg Deal Size",value:wonLeads.length?`₹${Math.round(wonValue/wonLeads.length/1000)}K`:"—",icon:"💰",color:"#3B82F6",bg:"#EFF6FF",sub:"per closed deal"},
        ].map(s=><KCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} iconBg={s.bg} sub={s.sub}/>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {/* Funnel */}
        <div style={{background:COLORS.white,borderRadius:14,border:`1px solid ${COLORS.border}`,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
          <div style={{fontSize:14,fontWeight:700,color:COLORS.h1,marginBottom:14}}>Pipeline Funnel</div>
          {stageData.map((s,i)=><CrmBar key={s.stage} label={s.label} value={s.count} max={Math.max(...stageData.map(d=>d.count),1)} color={STAGE_COLORS[i]}/>)}
        </div>
        {/* Source performance */}
        <div style={{background:COLORS.white,borderRadius:14,border:`1px solid ${COLORS.border}`,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
          <div style={{fontSize:14,fontWeight:700,color:COLORS.h1,marginBottom:14}}>Lead Sources by Value</div>
          {sourceData.map((s,i)=><CrmBar key={s.src} label={s.src} value={s.value} max={Math.max(...sourceData.map(d=>d.value),1)} color={STAGE_COLORS[i%STAGE_COLORS.length]}/>)}
          <div style={{marginTop:12,fontSize:11,color:COLORS.faint,padding:"10px 0",borderTop:`1px solid ${COLORS.border}`}}>Values shown in ₹ · Total: ₹{leads.reduce((s,l)=>s+l.value,0).toLocaleString()}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {/* Rep leaderboard */}
        <div style={{background:COLORS.white,borderRadius:14,border:`1px solid ${COLORS.border}`,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
          <div style={{fontSize:14,fontWeight:700,color:COLORS.h1,marginBottom:14}}>Sales Rep Performance</div>
          {repData.map((r,i)=>(
            <div key={r.name} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<repData.length-1?`1px solid ${COLORS.border}`:"none"}}>
              <div style={{width:32,height:32,borderRadius:8,background:i===0?`${COLORS.brand}18`:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:i===0?COLORS.brand:COLORS.muted,flexShrink:0}}>{i===0?"🥇":i===1?"🥈":"🥉"}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:COLORS.h1}}>{r.name}</div>
                <div style={{fontSize:11,color:COLORS.muted}}>{r.leads} leads · {r.won} won</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:800,color:COLORS.brand,fontFamily:FONTS.mono}}>₹{(r.value/1000).toFixed(0)}K</div>
                <div style={{fontSize:10,color:COLORS.faint}}>won value</div>
              </div>
            </div>
          ))}
        </div>
        {/* Forecast */}
        <div style={{background:COLORS.white,borderRadius:14,border:`1px solid ${COLORS.border}`,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
          <div style={{fontSize:14,fontWeight:700,color:COLORS.h1,marginBottom:14}}>Revenue Forecast</div>
          {[
            {label:"Conservative (40% conv.)",value:Math.round(totalPipeline*0.4),color:"#64748B"},
            {label:"Expected (65% conv.)",value:Math.round(totalPipeline*0.65),color:COLORS.brand},
            {label:"Optimistic (85% conv.)",value:Math.round(totalPipeline*0.85),color:"#22C55E"},
          ].map(f=>(
            <div key={f.label} style={{padding:"12px 0",borderBottom:`1px solid ${COLORS.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:12,color:COLORS.muted}}>{f.label}</span>
                <span style={{fontSize:13,fontWeight:800,color:f.color,fontFamily:FONTS.mono}}>₹{(f.value/1000).toFixed(0)}K</span>
              </div>
              <div style={{height:5,borderRadius:99,background:"#E2E8F0",overflow:"hidden"}}>
                <div style={{width:`${(f.value/Math.round(totalPipeline*0.85))*100}%`,height:"100%",background:f.color,borderRadius:99}}/>
              </div>
            </div>
          ))}
          <div style={{marginTop:12,background:COLORS.brandL,borderRadius:8,padding:"10px 12px",border:`1px solid ${COLORS.brand}30`}}>
            <div style={{fontSize:11,color:COLORS.muted,marginBottom:2}}>Already Won (Confirmed Revenue)</div>
            <div style={{fontSize:16,fontWeight:800,color:COLORS.brand,fontFamily:FONTS.mono}}>₹{(wonValue/1000).toFixed(0)}K</div>
          </div>
        </div>
      </div>
      {/* Lead temperature breakdown */}
      <div style={{marginTop:14,background:COLORS.white,borderRadius:14,border:`1px solid ${COLORS.border}`,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:14,fontWeight:700,color:COLORS.h1,marginBottom:14}}>Lead Temperature Overview</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {Object.entries(TEMP_CFG).map(([k,cfg])=>{
            const count=leads.filter(l=>l.temp===k).length;
            const val=leads.filter(l=>l.temp===k).reduce((s,l)=>s+l.value,0);
            return(
              <div key={k} style={{flex:1,minWidth:140,background:cfg.bg,borderRadius:12,padding:"16px 18px",border:`1px solid ${cfg.color}20`}}>
                <div style={{fontSize:24,marginBottom:6}}>{cfg.icon}</div>
                <div style={{fontSize:18,fontWeight:800,color:cfg.color}}>{count} <span style={{fontSize:12,fontWeight:400}}>leads</span></div>
                <div style={{fontSize:13,fontWeight:700,color:COLORS.h1}}>{cfg.label}</div>
                <div style={{fontSize:11,color:COLORS.muted,marginTop:3}}>₹{(val/1000).toFixed(0)}K pipeline value</div>
              </div>
            );
          })}
          <div style={{flex:2,minWidth:200,display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontSize:12,fontWeight:700,color:COLORS.muted,marginBottom:4}}>SCORING GUIDE</div>
            {[["80–100","Hot 🔥","Ready to close. Follow up within 24h.","#FEF2F2","#EF4444"],["40–79","Warm 🌤","Actively engaged. Follow up weekly.","#FFFBEB","#F59E0B"],["0–39","Cold ❄","Low engagement. Nurture with content.","#EFF6FF","#3B82F6"]].map(([r,t,d,bg,c])=>(
              <div key={r} style={{background:bg,borderRadius:8,padding:"8px 12px",display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:11,fontWeight:800,color:c,fontFamily:FONTS.mono,flexShrink:0}}>{r}</span>
                <div><div style={{fontSize:11,fontWeight:700,color:c}}>{t}</div><div style={{fontSize:10,color:COLORS.muted}}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMAnalyticsPage;