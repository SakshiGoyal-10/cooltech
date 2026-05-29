import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import { GOOGLE_REVIEWS } from '../../data/mockData';

// ─── ReviewsPage ───────────────────────────────────────────────────────────────

const ReviewsPage=()=>{
  const avgRating=(GOOGLE_REVIEWS.reduce((s,r)=>s+r.rating,0)/GOOGLE_REVIEWS.length).toFixed(1);
  const unreplied=GOOGLE_REVIEWS.filter(r=>!r.replied).length;
  const stars=[5,4,3,2,1].map(s=>({s,count:GOOGLE_REVIEWS.filter(r=>r.rating===s).length}));
  return(
    <div className="fi" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:20,fontWeight:800,color:COLORS.h1}}>Reviews & Reputation</div>
        <div style={{fontSize:13,color:COLORS.muted,marginTop:2}}>Google My Business · Monitor and respond to reviews</div></div>
        <div style={{display:"flex",gap:8}}>
          {unreplied>0&&<button className="btn" onClick={()=>document.querySelector('[data-reply-needed]')?.scrollIntoView({behavior:'smooth'})} style={{padding:"9px 16px",borderRadius:9,background:"#FFFBEB",border:"1px solid #FDE68A",color:"#B45309",fontSize:12,fontWeight:700}}>⚠ {unreplied} Unreplied</button>}
          <button className="btn" onClick={()=>navigator.clipboard?.writeText('https://g.page/cooltech-ac-services/review').catch(()=>{})} style={{padding:"9px 18px",borderRadius:9,background:"#F0FDF4",border:"1px solid #BBF7D0",color:"#16A34A",fontSize:12,fontWeight:700}}>🔗 Share Review Link</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:16}}>
        <div style={{background:COLORS.white,borderRadius:14,border:"1px solid #E5E7EB",padding:20,boxShadow:"0 1px 4px rgba(0,0,0,.05)",textAlign:"center",height:"fit-content"}}>
          <div style={{width:48,height:48,borderRadius:13,background:"#FEF2F2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 12px"}}>G</div>
          <div style={{fontSize:11,color:COLORS.muted,marginBottom:6}}>Google Rating</div>
          <div style={{fontSize:48,fontWeight:800,color:"#EA4335",fontFamily:"Fira Code,monospace",lineHeight:1}}>{avgRating}</div>
          <div style={{fontSize:16,color:"#F59E0B",marginTop:4,letterSpacing:4}}>{"★".repeat(Math.round(avgRating))}</div>
          <div style={{fontSize:11,color:COLORS.muted,marginTop:4}}>{GOOGLE_REVIEWS.length} reviews</div>
          <div style={{marginTop:14}}>
            {stars.map(({s,count})=>(
              <div key={s} style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                <span style={{fontSize:10,color:COLORS.muted,width:8}}>{s}</span>
                <span style={{fontSize:9,color:"#F59E0B"}}>★</span>
                <div style={{flex:1,height:5,background:"#F1F5F9",borderRadius:3,overflow:"hidden"}}><div style={{width:`${(count/GOOGLE_REVIEWS.length)*100}%`,height:"100%",background:"#F59E0B",borderRadius:3}}/></div>
                <span style={{fontSize:10,color:COLORS.muted,width:12}}>{count}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #E5E7EB"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              <div style={{background:"#F0FDF4",borderRadius:7,padding:"7px"}}><div style={{fontSize:14,fontWeight:800,color:"#16A34A"}}>{GOOGLE_REVIEWS.filter(r=>r.replied).length}</div><div style={{fontSize:9,color:COLORS.faint}}>Replied</div></div>
              <div style={{background:"#FEF2F2",borderRadius:7,padding:"7px"}}><div style={{fontSize:14,fontWeight:800,color:"#DC2626"}}>{unreplied}</div><div style={{fontSize:9,color:COLORS.faint}}>Pending</div></div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {GOOGLE_REVIEWS.map(review=>(
            <div key={review.id} style={{background:COLORS.white,borderRadius:12,border:`1px solid ${!review.replied?"#FDE68A":"#E5E7EB"}`,padding:"16px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <Avatar name={review.author} size={36} color="#EA4335"/>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:COLORS.h1}}>{review.author}</div>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginTop:2}}>
                      <span style={{fontSize:13,color:"#F59E0B"}}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span>
                      <span style={{fontSize:11,color:COLORS.faint}}>{review.date}</span>
                    </div>
                  </div>
                </div>
                {!review.replied&&<span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:99,background:"#FFFBEB",color:"#B45309",border:"1px solid #FDE68A"}}>⏳ Reply Needed</span>}
              </div>
              <p style={{fontSize:13,color:COLORS.body,lineHeight:1.7,marginBottom:10}}>"{review.text}"</p>
              {review.replied&&review.reply?(
                <div style={{padding:"10px 13px",borderRadius:8,background:"#F0FDF4",border:"1px solid #BBF7D0",marginBottom:8}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#16A34A",marginBottom:4}}>✅ Your Reply (CoolTech AC Services)</div>
                  <div style={{fontSize:12,color:"#166534",lineHeight:1.6}}>{review.reply}</div>
                </div>
              ):(
                <div>
                  <textarea placeholder="Write a professional reply..." style={{width:"100%",padding:"9px 12px",borderRadius:7,border:"1px solid #E5E7EB",fontSize:12,fontFamily:"Plus Jakarta Sans,sans-serif",resize:"none",height:65,background:COLORS.bg}}/>
                  <div style={{display:"flex",gap:6,marginTop:6}}>
                    {["Thank you for the review!","We apologize for the inconvenience.","We're glad you chose CoolTech!"].map(t=>(
                      <span key={t} style={{fontSize:10,padding:"3px 8px",borderRadius:5,background:"#EFF6FF",color:"#0369A1",cursor:"pointer"}}>{t.slice(0,24)}...</span>
                    ))}
                  </div>
                  <button className="btn" onClick={(e)=>{const ta=e.target.closest('div').querySelector('textarea');if(ta&&ta.value.trim()){ta.closest('[data-review]')?.setAttribute('data-replied','true')}}} style={{marginTop:8,padding:"6px 16px",borderRadius:7,background:"#EA4335",color:"white",fontSize:12,fontWeight:700}}>Post Reply</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   PAGE: CONTENT LIBRARY
══════════════════════════════════════════════════════════════════════════ */

export default ReviewsPage;
