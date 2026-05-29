import { useState, useEffect } from 'react';
import { leadsApi } from '../services/api';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../components/ui/Form';
import RolesPermissions from './RolesPermissions';

// ─── SettingsPage ───────────────────────────────────────────────────────────────

const SettingsPage=({openModal})=>{
  const [tab,setTab]=useState("company");
  const TABS=[["company","🏢 Company"],["gst","🧾 GST & Tax"],["notifications","🔔 Notifications"],["Roles & Permissions","👤 Roles & Permissions"],["sms","📱 SMS / WhatsApp"],["appearance","🎨 Appearance"],["integrations","🔗 Integrations"],["backup","💾 Backup"]];
  return(
    <div className="fi" style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionHdr title="Settings" sub="Configure your platform"/>
      <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:16}}>
        <div style={{background:COLORS.white,borderRadius:14,border:`1px solid ${COLORS.border}`,padding:"10px 8px",boxShadow:"0 1px 4px rgba(0,0,0,.05)",height:"fit-content"}}>
          {TABS.map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",borderRadius:8,marginBottom:2,background:tab===k?COLORS.brandL:"transparent",color:tab===k?COLORS.brand:COLORS.muted,cursor:"pointer",border:`1px solid ${tab===k?COLORS.brand+"40":"transparent"}`,fontSize:13,fontWeight:tab===k?700:400,fontFamily:FONTS.sans}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{background:COLORS.white,borderRadius:14,border:`1px solid ${COLORS.border}`,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
          {tab==="company"&&(
            <div>
              <div style={{fontSize:15,fontWeight:700,color:COLORS.h1,marginBottom:20}}>Company Information</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {[["Company Name","CoolTech AC Services"],["Owner / Admin","Rajesh Patel"],["Phone","+91 98765 43210"],["Email","info@cooltech.com"],["Address","Bengaluru, Karnataka"],["GST Number","29AABCT1234A1Z5"]].map(([label,val])=>(
                  <div key={label}>
                    <div style={{fontSize:12,fontWeight:600,color:COLORS.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>{label}</div>
                    <input defaultValue={val} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${COLORS.border}`,fontSize:13,fontFamily:FONTS.sans,color:COLORS.h2,background:COLORS.bg}}/>
                  </div>
                ))}
              </div>
              <div style={{marginTop:16}}>
                <div style={{fontSize:12,fontWeight:600,color:COLORS.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>Company Logo</div>
                <div style={{border:`2px dashed ${COLORS.border}`,borderRadius:10,padding:"28px",textAlign:"center",cursor:"pointer",background:"#FAFAFA"}}>
                  <div style={{fontSize:24,marginBottom:8}}>🏢</div>
                  <div style={{fontSize:13,color:COLORS.muted}}>Click to upload logo · PNG, JPG up to 2MB</div>
                </div>
              </div>
              <button className="btn" onClick={()=>openModal("report",{title:"Company Settings Saved",format:"Update"})} style={{marginTop:20,padding:"11px 28px",borderRadius:9,background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,color:"white",fontSize:13,fontWeight:700,boxShadow:`0 4px 12px ${COLORS.brand}40`}}>Save Changes</button>
            </div>
          )}
          {tab==="gst"&&(
            <div>
              <div style={{fontSize:15,fontWeight:700,color:COLORS.h1,marginBottom:20}}>GST & Tax Configuration</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {[["GSTIN","29AABCT1234A1Z5"],["GST Rate (%)","18"],["PAN Number","AABCT1234A"],["HSN Code","998719"]].map(([label,val])=>(
                  <div key={label}>
                    <div style={{fontSize:12,fontWeight:600,color:COLORS.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>{label}</div>
                    <input defaultValue={val} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${COLORS.border}`,fontSize:13,fontFamily:FONTS.mono,color:COLORS.h2,background:COLORS.bg}}/>
                  </div>
                ))}
              </div>
              <div style={{marginTop:16,padding:"14px 16px",borderRadius:10,background:"#FFFBEB",border:"1px solid #FDE68A"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#92400E",marginBottom:4}}>Invoice Footer</div>
                <textarea defaultValue="Thank you for choosing CoolTech AC Services. Payment due within 10 days. GST @ 18% included." style={{width:"100%",padding:"10px 12px",borderRadius:7,border:`1px solid #FDE68A`,fontSize:13,fontFamily:FONTS.sans,color:COLORS.h2,resize:"vertical",minHeight:70,background:"white"}}/>
              </div>
              <button className="btn" onClick={()=>openModal("report",{title:"GST Settings Saved",format:"Update"})} style={{marginTop:16,padding:"11px 28px",borderRadius:9,background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,color:"white",fontSize:13,fontWeight:700}}>Save GST Settings</button>
            </div>
          )}
          {tab==="notifications"&&(
            <div>
              <div style={{fontSize:15,fontWeight:700,color:COLORS.h1,marginBottom:20}}>Notification Preferences</div>
              {[
                ["New job created",              true ],
                ["Job assigned to technician",   true ],
                ["Job completed",               true ],
                ["Invoice overdue reminder",     true ],
                ["AMC contract expiring soon",   true ],
                ["Complaint logged",            true ],
                ["Low inventory alert",         false ],
                ["Quotation approved / rejected",true ],
                ["Salary processed",            false ],
                ["Advance requested",           true ],
              ].map(([label,def])=>(
                <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${COLORS.border}`}}>
                  <span style={{fontSize:13,color:COLORS.h2}}>{label}</span>
                  <label className="toggle"><input type="checkbox" defaultChecked={def}/><span className="tog-sl"/></label>
                </div>
              ))}
            </div>
          )}
          {tab==="Roles & Permissions"&&(
            // <div>
            //   <div style={{fontSize:15,fontWeight:700,color:COLORS.h1,marginBottom:20}}>Admin Users & Permissions</div>
            //   <div style={{display:"flex",flexDirection:"column",gap:10}}>
            //     {[{name:"Rajesh Patel",email:"rajesh@cooltech.com",role:"Super Admin"},{name:"Rekha Sharma",email:"rekha@cooltech.com",role:"Manager"},{name:"Priya Singh",email:"priya@cooltech.com",role:"Accountant"}].map(u=>(
            //       <div key={u.email} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:`1px solid ${COLORS.border}`,background:COLORS.bg}}>
            //         <Avatar name={u.name} size={36}/>
            //         <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:COLORS.h1}}>{u.name}</div><div style={{fontSize:12,color:COLORS.muted}}>{u.email}</div></div>
            //         <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,background:COLORS.brandL,color:COLORS.brand}}>{u.role}</span>
            //         <button className="btn" onClick={()=>openModal("new_admin")} style={{padding:"5px 12px",borderRadius:7,background:COLORS.white,border:`1px solid ${COLORS.border}`,color:COLORS.muted,fontSize:11}}>Edit</button>
            //       </div>
            //     ))}
            //     <button className="btn" onClick={()=>openModal("new_admin")} style={{padding:"10px",borderRadius:9,background:COLORS.brandL,border:`1px solid ${COLORS.brand}30`,color:COLORS.brand,fontSize:13,fontWeight:700,width:"100%"}}>+ Add Admin User</button>
            //   </div>
            // </div>
            <RolesPermissions />
          )}
          {tab==="sms"&&(
            <div>
              <div style={{fontSize:15,fontWeight:700,color:COLORS.h1,marginBottom:20}}>SMS & WhatsApp Automation</div>
              {[
                ["Send SMS on job assignment","Send job details to customer automatically",true],
                ["Send completion SMS","Notify customer when job is marked complete",true],
                ["Send invoice via WhatsApp","Share PDF invoice on WhatsApp after job",false],
                ["AMC renewal reminder SMS","Alert customer 30 days before contract end",true],
                ["Payment due reminder","Auto-remind customer before invoice due date",true],
              ].map(([t,d,def])=>(
                <div key={t} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"13px 0",borderBottom:`1px solid ${COLORS.border}`,gap:16}}>
                  <div><div style={{fontSize:13,fontWeight:600,color:COLORS.h2}}>{t}</div><div style={{fontSize:11,color:COLORS.muted,marginTop:2}}>{d}</div></div>
                  <label className="toggle" style={{flexShrink:0}}><input type="checkbox" defaultChecked={def}/><span className="tog-sl"/></label>
                </div>
              ))}
              <div style={{marginTop:16}}>
                <div style={{fontSize:12,fontWeight:600,color:COLORS.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>SMS Template – Job Assignment</div>
                <textarea defaultValue={`Dear {customer}, your AC service has been scheduled for {date} at {time}. Technician: {tech}. CoolTech AC Services – {phone}`} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${COLORS.border}`,fontSize:12,fontFamily:FONTS.mono,color:COLORS.h2,resize:"vertical",minHeight:80,background:COLORS.bg}}/>
              </div>
            </div>
          )}
          {tab==="appearance"&&(
            <div>
              <div style={{fontSize:15,fontWeight:700,color:COLORS.h1,marginBottom:20}}>Appearance & Theme</div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:COLORS.h1,marginBottom:12}}>Brand Color</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {[["#EA580C","Orange (Default)"],["#2563EB","Blue"],["#16A34A","Green"],["#7C3AED","Purple"],["#DC2626","Red"],["#0891B2","Cyan"]].map(([c,n])=>(
                    <div key={c} onClick={()=>{}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:9,border:`2px solid ${c===COLORS.brand?c:COLORS.border}`,background:c===COLORS.brand?`${c}10`:COLORS.bg,cursor:"pointer"}}>
                      <div style={{width:18,height:18,borderRadius:"50%",background:c}}/>
                      <span style={{fontSize:12,fontWeight:600,color:c===COLORS.brand?c:COLORS.muted}}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:COLORS.h1,marginBottom:12}}>Sidebar Style</div>
                <div style={{display:"flex",gap:10}}>
                  {[["Dark (Default)","#1A1A2E"],["Light","#FFFFFF"],["Auto","system"]].map(([n,c])=>(
                    <div key={n} style={{padding:"10px 18px",borderRadius:9,border:`2px solid ${n.includes("Default")?COLORS.brand:COLORS.border}`,background:n.includes("Default")?COLORS.brandL:COLORS.bg,cursor:"pointer"}}>
                      <span style={{fontSize:12,fontWeight:600,color:n.includes("Default")?COLORS.brand:COLORS.muted}}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:COLORS.h1,marginBottom:12}}>Date & Currency Format</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div><div style={{fontSize:12,fontWeight:600,color:COLORS.muted,marginBottom:6}}>DATE FORMAT</div><FSelect><option>DD MMM, YYYY (Mar 3, 2026)</option><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option></FSelect></div>
                  <div><div style={{fontSize:12,fontWeight:600,color:COLORS.muted,marginBottom:6}}>CURRENCY</div><FSelect><option>₹ Indian Rupee (INR)</option><option>$ US Dollar (USD)</option></FSelect></div>
                </div>
              </div>
              <button className="btn" onClick={()=>openModal("report",{title:"Appearance Settings",format:"Update"})} style={{padding:"11px 28px",borderRadius:9,background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,color:"white",fontSize:13,fontWeight:700}}>Save Appearance</button>
            </div>
          )}
          {tab==="integrations"&&(
            <div>
              <div style={{fontSize:15,fontWeight:700,color:COLORS.h1,marginBottom:20}}>Integrations & Connected Apps</div>
              {[
                {name:"Google My Business",  desc:"Sync reviews and business info",           icon:"G",  color:"#EA4335", bg:"#FEF2F2", connected:true},
                {name:"WhatsApp Business API",desc:"Send automated customer messages",         icon:"WA", color:"#25D366", bg:"#F0FDF4", connected:true},
                {name:"Google Calendar",      desc:"Sync job schedules and reminders",          icon:"📅", color:"#0369A1", bg:"#EFF6FF", connected:false},
                {name:"Tally / Zoho Books",   desc:"Auto-sync invoices and payments",           icon:"💼", color:"#7C3AED", bg:"#F5F3FF", connected:false},
                {name:"SMS Gateway (MSG91)", desc:"Send automated SMS to customers",            icon:"📱", color:"#B45309", bg:"#FFFBEB", connected:true},
                {name:"Razorpay / PayU",      desc:"Accept online payments via invoice link",   icon:"💳", color:"#0369A1", bg:"#EFF6FF", connected:false},
                {name:"Google Drive",         desc:"Backup documents and photos",               icon:"🗂", color:"#16A34A", bg:"#F0FDF4", connected:false},
                {name:"Slack",                desc:"Get job alerts on your team Slack",         icon:"💬", color:"#4A154B", bg:"#F5F3FF", connected:false},
              ].map(intg=>(
                <div key={intg.name} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 16px",borderRadius:10,border:`1px solid ${intg.connected?intg.color+"40":COLORS.border}`,background:intg.connected?intg.bg:COLORS.bg,marginBottom:10}}>
                  <div style={{width:38,height:38,borderRadius:9,background:intg.connected?intg.color+"15":"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:intg.color,flexShrink:0}}>{intg.icon}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:COLORS.h1}}>{intg.name}</div><div style={{fontSize:12,color:COLORS.muted,marginTop:2}}>{intg.desc}</div></div>
                  {intg.connected
                    ?<span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,background:"#F0FDF4",color:"#16A34A",border:"1px solid #BBF7D0"}}>✓ Connected</span>
                    :<button className="btn" onClick={()=>openModal("report",{title:`Connect ${intg.name}`,format:"Auth"})} style={{padding:"6px 14px",borderRadius:8,background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,color:"white",fontSize:12,fontWeight:700}}>Connect</button>
                  }
                </div>
              ))}
            </div>
          )}
          {tab==="backup"&&(
            <div>
              <div style={{fontSize:15,fontWeight:700,color:COLORS.h1,marginBottom:20}}>Data Backup & Export</div>
              {[
                {label:"Last Backup",       value:"Mar 2, 2026 – 11:45 PM",color:"#16A34A"},
                {label:"Next Auto Backup",  value:"Mar 3, 2026 – 11:45 PM",color:COLORS.h2},
                {label:"Backup Frequency",  value:"Daily",color:COLORS.h2},
                {label:"Storage Used",      value:"2.4 GB of 10 GB",color:"#0369A1"},
              ].map(item=>(
                <div key={item.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${COLORS.border}`}}>
                  <span style={{fontSize:13,color:COLORS.muted}}>{item.label}</span>
                  <span style={{fontSize:13,fontWeight:700,color:item.color}}>{item.value}</span>
                </div>
              ))}
              <div style={{display:"flex",gap:10,marginTop:20}}>
                <button className="btn" onClick={()=>openModal("report",{title:"Backup Now",format:"Backup"})} style={{flex:1,padding:"12px",borderRadius:9,background:`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,color:"white",fontSize:13,fontWeight:700}}>⬇ Backup Now</button>
                <button className="btn" onClick={()=>openModal("report",{title:"Export All Data",format:"ZIP"})} style={{flex:1,padding:"12px",borderRadius:9,background:"#F0F9FF",border:"1px solid #BAE6FD",color:"#0369A1",fontSize:13,fontWeight:700}}>📤 Export All Data</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   PAGE: leads & CRM
══════════════════════════════════════════════════════════════════════════ */

export default SettingsPage;
