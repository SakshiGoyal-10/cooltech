// ─── SVG Charts ──────────────────────────────────────────────────────────────
import { COLORS, FONTS } from '../../constants/tokens';

export const RevenueChart=({data})=>{
  const W=380,H=80,PB=20,PT=8;
  const iw=W,ih=H-PT-PB,max=Math.max(...data.map(d=>d.v))*1.08;
  const bw=(iw/data.length)*.55,gap=iw/data.length;
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      {data.map((d,i)=>{const bh=(d.v/max)*ih,x=i*gap+(gap-bw)/2,y=PT+ih-bh,isL=i===data.length-1;return(
        <g key={i}><rect x={x} y={y} width={bw} height={bh} rx={3} fill={isL?COLORS.brand:"#FED7AA"} opacity={isL?1:.85}/>
        <text x={x+bw/2} y={H-4} textAnchor="middle" fill={COLORS.faint} fontSize={9} fontFamily={FONTS.sans}>{d.m}</text></g>
      );})}
    </svg>
  );
};
export const Donut=({data,size=120})=>{
  const cx=size/2,cy=size/2,r=size/2-14;
  let c=0;const tot=data.reduce((s,d)=>s+d.pct,0);
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:"block"}}>
      {data.map((d,i)=>{
        const s1=((c/tot)*360-90)*Math.PI/180,e=(c+=d.pct),s2=((e/tot)*360-90)*Math.PI/180;
        const x1=cx+r*Math.cos(s1+.04),y1=cy+r*Math.sin(s1+.04),x2=cx+r*Math.cos(s2-.04),y2=cy+r*Math.sin(s2-.04);
        return <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${d.pct/tot>.5?1:0} 1 ${x2} ${y2}`} fill="none" stroke={d.color} strokeWidth={13} strokeLinecap="round"/>;
      })}
      <text x={cx} y={cy-3} textAnchor="middle" fill={COLORS.h1} fontSize={18} fontWeight="800" fontFamily={FONTS.sans}>110</text>
      <text x={cx} y={cy+13} textAnchor="middle" fill={COLORS.muted} fontSize={9} fontFamily={FONTS.sans}>this month</text>
    </svg>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   PAGE: DASHBOARD  (upgraded)
══════════════════════════════════════════════════════════════════════════ */