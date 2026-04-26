import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API = "https://hiresenseai-xp0u.onrender.com";

// ── Themes ───────────────────────────────────────────────────────────────────
const themes = {
  dark: {
    bgPrimary:"#08080f",bgSecondary:"#0c0c18",bgCard:"#10101e",bgCardHover:"#151525",
    bgInput:"#0a0a16",border:"rgba(139,92,246,0.12)",borderActive:"rgba(139,92,246,0.45)",
    textPrimary:"#f0eeff",textSecondary:"#b8b0d8",textMuted:"#5a5380",
    accentMain:"#7c3aed",accentLight:"#a78bfa",accentTeal:"#06b6d4",
    accentAmber:"#f59e0b",accentRed:"#f43f5e",glow:"rgba(124,58,237,0.22)",
  },
  light: {
    bgPrimary:"#f5f3ff",bgSecondary:"#ede9fe",bgCard:"#ffffff",bgCardHover:"#faf8ff",
    bgInput:"#f9f8ff",border:"rgba(109,40,217,0.15)",borderActive:"rgba(109,40,217,0.45)",
    textPrimary:"#13003d",textSecondary:"#3b1fa8",textMuted:"#8b80b0",
    accentMain:"#6d28d9",accentLight:"#7c3aedgit",accentTeal:"#0891b2",
    accentAmber:"#d97706",accentRed:"#e11d48",glow:"rgba(109,40,217,0.15)",
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const scoreColor = (score, t) => {
  if (score >= 80) return t.accentLight;
  if (score >= 60) return t.accentTeal;
  if (score >= 40) return t.accentAmber;
  return t.accentRed;
};
const interestColor = (level, t) => ({
  high:t.accentLight, medium:t.accentTeal, low:t.accentAmber, none:t.accentRed
}[level] || t.textMuted);
const interestLabel = (level) => ({
  high:"Actively Looking", medium:"Open to Offers", low:"Passive", none:"Not Looking"
}[level] || level);
const recoBadge = (rec) => ({
  "Strong Hire":   {bg:"rgba(167,139,250,0.15)",color:"#a78bfa",border:"rgba(167,139,250,0.35)"},
  "Potential Hire":{bg:"rgba(6,182,212,0.12)",  color:"#06b6d4",border:"rgba(6,182,212,0.3)"},
  "Consider":      {bg:"rgba(245,158,11,0.1)",  color:"#f59e0b",border:"rgba(245,158,11,0.28)"},
  "Weak Match":    {bg:"rgba(244,63,94,0.09)",  color:"#f43f5e",border:"rgba(244,63,94,0.25)"},
}[rec] || {bg:"rgba(128,128,128,0.1)",color:"#888",border:"transparent"});

const interestRatingLabel = (score) => {
  if (!score) return null;
  if (score >= 75) return { text: "Strong Interest", color: "#10b981" };
  if (score >= 55) return { text: "Moderate Interest", color: "#f59e0b" };
  if (score >= 35) return { text: "Weak Interest", color: "#f97316" };
  return { text: "Not Interested", color: "#f43f5e" };
};

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size=54, stroke=4.5, color, label }) {
  const r    = (size-stroke*2)/2;
  const circ = 2*Math.PI*r;
  const offset = circ-(score/100)*circ;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)",filter:`drop-shadow(0 0 5px ${color}88)`}}/>
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={size*0.22} fontFamily="JetBrains Mono,monospace" fontWeight="700"
          style={{transform:`rotate(90deg)`,transformOrigin:`${size/2}px ${size/2}px`}}>
          {score}
        </text>
      </svg>
      {label&&<span style={{fontSize:8.5,color:"var(--text-muted)",letterSpacing:"0.09em",fontFamily:"JetBrains Mono,monospace"}}>{label}</span>}
    </div>
  );
}

function MiniBar({ label, value, color, animated=false }) {
  return (
    <div style={{marginBottom:4}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:9,color:"var(--text-muted)",letterSpacing:"0.06em"}}>{label}</span>
        <span style={{fontSize:9,color,fontFamily:"JetBrains Mono,monospace",fontWeight:700}}>{value}%</span>
      </div>
      <div style={{height:3,borderRadius:99,background:"rgba(139,92,246,0.1)",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${value}%`,background:color,borderRadius:99,
          transition:"width 0.9s cubic-bezier(.4,0,.2,1)",
          boxShadow:animated?`0 0 8px ${color}`:undefined}}/>
      </div>
    </div>
  );
}

function Chip({ label, type="default" }) {
  const s = {
    default:{bg:"rgba(139,92,246,0.07)",color:"var(--text-muted)",  border:"rgba(139,92,246,0.12)"},
    matched:{bg:"rgba(167,139,250,0.12)",color:"var(--accent-light)",border:"rgba(167,139,250,0.3)"},
    missing:{bg:"rgba(244,63,94,0.08)", color:"var(--accent-red)",  border:"rgba(244,63,94,0.22)"},
  }[type]||{bg:"rgba(139,92,246,0.07)",color:"var(--text-muted)",border:"rgba(139,92,246,0.12)"};
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:99,
      fontSize:10,fontWeight:500,background:s.bg,color:s.color,
      border:`1px solid ${s.border}`,marginRight:4,marginBottom:4,whiteSpace:"nowrap"}}>
      {type==="matched"&&<span style={{fontSize:6}}>◆</span>}{label}
    </span>
  );
}

// ── Live Interest Indicator ───────────────────────────────────────────────────
function LiveInterestIndicator({ score, history, compact=false }) {
  if (score == null) return null;

  const prev   = history?.length > 1 ? history[history.length-2]?.score : null;
  const delta  = prev != null ? score - prev : 0;
  const rating = interestRatingLabel(score);

  const trendIcon  = delta > 3 ? "↑" : delta < -3 ? "↓" : "→";
  const trendColor = delta > 3 ? "#10b981" : delta < -3 ? "#f43f5e" : "#f59e0b";

  const barColor = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#f43f5e";

  if (compact) {
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",
        padding:"5px 10px",borderRadius:9,
        background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)"}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:17,fontFamily:"JetBrains Mono,monospace",fontWeight:800,color:barColor,lineHeight:1}}>{score}</span>
          <span style={{fontSize:14,color:trendColor,fontWeight:700,lineHeight:1}}>{trendIcon}</span>
        </div>
        <span style={{fontSize:7.5,color:"#10b981",letterSpacing:"0.07em",marginTop:2}}>LIVE INTEREST</span>
      </div>
    );
  }

  return (
    <div style={{padding:"10px 13px",borderRadius:10,
      background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:9,color:"#10b981",letterSpacing:"0.08em",fontFamily:"JetBrains Mono,monospace"}}>
            ⚡ LIVE INTEREST SIGNAL
          </span>
          {rating&&(
            <span style={{padding:"1px 7px",borderRadius:99,fontSize:9,fontWeight:600,
              background:`${rating.color}18`,color:rating.color,border:`1px solid ${rating.color}35`}}>
              {rating.text}
            </span>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          {delta !== 0 && (
            <span style={{fontSize:10,color:trendColor,fontWeight:700,fontFamily:"JetBrains Mono,monospace"}}>
              {delta > 0 ? "+" : ""}{Math.round(delta)} {trendIcon}
            </span>
          )}
          <span style={{fontSize:15,fontFamily:"JetBrains Mono,monospace",fontWeight:800,color:barColor}}>{score}%</span>
        </div>
      </div>
      <div style={{height:5,borderRadius:99,background:"rgba(16,185,129,0.12)",overflow:"hidden",marginBottom:6}}>
        <div style={{height:"100%",borderRadius:99,
          width:`${score}%`,
          background:`linear-gradient(90deg,#10b981,${score>=70?"#06b6d4":score>=45?"#f59e0b":"#f43f5e"})`,
          transition:"width 0.7s cubic-bezier(.4,0,.2,1)",
          boxShadow:`0 0 8px ${barColor}60`}}/>
      </div>
      {history?.length > 1 && (
        <div style={{display:"flex",alignItems:"flex-end",gap:2,height:20,marginBottom:5}}>
          {history.slice(-12).map((h, i) => {
            const ht = Math.max(2, Math.round((h.score / 100) * 20));
            const c  = h.score>=70?"#10b981":h.score>=45?"#f59e0b":"#f43f5e";
            return (
              <div key={i} style={{ width:5, height:ht, borderRadius:2, background:c,
                opacity: 0.4 + (i / 12) * 0.6,
                transition:"height 0.4s ease" }}/>
            );
          })}
        </div>
      )}
      <div style={{fontSize:8.5,color:"var(--text-muted)",lineHeight:1.5}}>
        {score>=75 ? "✅ Strong interest detected — good candidate to proceed with" :
         score>=55 ? "⚠️ Moderate interest — worth more conversation before deciding" :
         score>=35 ? "🔶 Weak interest signal — candidate needs more convincing" :
                     "❌ Low interest — candidate likely not open to this opportunity"}
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ stats, dark, onToggle, shortlistCount, onShowShortlist }) {
  return (
    <header style={{background:"var(--bg-secondary)",borderBottom:"1px solid var(--border)",
      padding:"0 24px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",
      position:"sticky",top:0,zIndex:100,backdropFilter:"blur(16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:11}}>
        <div style={{width:38,height:38,borderRadius:11,flexShrink:0,
          background:"linear-gradient(135deg,#7c3aed,#06b6d4)",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 0 22px rgba(124,58,237,0.4)"}}>
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <path d="M11 8v3l2 2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:17,
            letterSpacing:"-0.03em",color:"var(--text-primary)",lineHeight:1}}>
            HireSense{" "}
            <span style={{background:"linear-gradient(90deg,#a78bfa,#f59e0b)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>AI</span>
          </div>
          <div style={{fontSize:9,color:"var(--text-muted)",fontFamily:"JetBrains Mono,monospace",
            letterSpacing:"0.12em",marginTop:1}}>TALENT SCOUTING AGENT</div>
        </div>
      </div>
      <div style={{display:"flex",gap:18,alignItems:"center"}}>
        {stats&&[
          {label:"POOL",  value:stats.total,               color:"var(--text-secondary)"},
          {label:"ACTIVE",value:stats.byInterest?.high||0, color:"var(--accent-light)"},
          {label:"OPEN",  value:stats.byInterest?.medium||0,color:"var(--accent-teal)"},
        ].map(s=>(
          <div key={s.label} style={{textAlign:"center"}}>
            <div style={{fontFamily:"JetBrains Mono,monospace",fontWeight:800,fontSize:18,color:s.color,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:8.5,color:"var(--text-muted)",marginTop:2,letterSpacing:"0.1em"}}>{s.label}</div>
          </div>
        ))}
        {shortlistCount>0&&(
          <button onClick={onShowShortlist} style={{padding:"5px 13px",borderRadius:99,fontSize:10,fontWeight:700,
            background:"rgba(16,185,129,0.14)",color:"#10b981",border:"1px solid rgba(16,185,129,0.35)",
            cursor:"pointer",fontFamily:"JetBrains Mono,monospace",display:"flex",alignItems:"center",gap:5}}>
            📋 SHORTLIST
            <span style={{background:"rgba(16,185,129,0.25)",borderRadius:99,padding:"0 6px"}}>{shortlistCount}</span>
          </button>
        )}
        <div style={{padding:"4px 12px",borderRadius:99,fontSize:9,fontWeight:700,
          background:"rgba(124,58,237,0.14)",color:"var(--accent-light)",
          border:"1px solid rgba(139,92,246,0.3)",fontFamily:"JetBrains Mono,monospace"}}>● LIVE</div>
        <button onClick={onToggle} style={{width:44,height:25,borderRadius:99,
          border:"1px solid var(--border)",background:"rgba(124,58,237,0.1)",
          cursor:"pointer",position:"relative",flexShrink:0}}>
          <div style={{width:19,height:19,borderRadius:50,
            background:"linear-gradient(135deg,var(--accent-main),var(--accent-teal))",
            position:"absolute",top:2,left:dark?2:21,transition:"left 0.3s cubic-bezier(.4,0,.2,1)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>
            {dark?"🌙":"☀️"}
          </div>
        </button>
      </div>
    </header>
  );
}

function SummaryBar({ candidates }) {
  if (!candidates.length) return null;
  const strong    = candidates.filter(c=>c.finalScore>=80).length;
  const potential = candidates.filter(c=>c.finalScore>=60&&c.finalScore<80).length;
  const assessed  = candidates.filter(c=>c.conversationInterestScore!=null).length;
  const avgMatch  = Math.round(candidates.reduce((a,c)=>a+c.matchScore,0)/candidates.length);
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,
      padding:"10px 20px",background:"var(--bg-secondary)",borderBottom:"1px solid var(--border)"}}>
      {[
        {label:"TOTAL MATCHES",value:candidates.length,color:"var(--text-secondary)"},
        {label:"STRONG HIRE",  value:strong,           color:"var(--accent-light)"},
        {label:"POTENTIAL",    value:potential,         color:"var(--accent-teal)"},
        {label:"ASSESSED",     value:assessed,          color:"#10b981"},
        {label:"AVG MATCH",    value:`${avgMatch}%`,   color:"var(--accent-amber)"},
      ].map(s=>(
        <div key={s.label} style={{padding:"9px 14px",background:"var(--bg-card)",
          borderRadius:10,border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontFamily:"JetBrains Mono,monospace",fontWeight:800,fontSize:22,color:s.color,lineHeight:1}}>{s.value}</div>
          <div style={{fontSize:9,color:"var(--text-muted)",letterSpacing:"0.08em",lineHeight:1.5}}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── JD Panel ─────────────────────────────────────────────────────────────────
function JDPanel({ onAnalyze, loading, jdInfo }) {
  const [jd, setJd] = useState("");
  const examples = [
    "We are looking for a Senior React Developer with 4+ years experience in Node.js, TypeScript, and AWS. Must have MongoDB and Docker.",
    "Python Data Scientist with 3+ years. TensorFlow, PyTorch, Machine Learning. PostgreSQL and GCP preferred.",
    "Full Stack Java Developer, Spring Boot, MySQL, React. 5+ years. AWS and Docker required.",
    "DevOps Engineer with Kubernetes, Docker, Terraform, Jenkins, CI/CD. Azure or GCP, 4+ years.",
    "MERN Stack Developer with 3+ years experience. MongoDB, Express.js, React, Node.js. TypeScript preferred.",
    "Software Developer with 2+ years. Open to Java, Python or JavaScript developers. Team player required.",
  ];
  return (
    <div style={{padding:16,borderBottom:"1px solid var(--border)",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11}}>
        <div style={{width:26,height:26,borderRadius:7,background:"rgba(124,58,237,0.15)",
          border:"1px solid rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="12" height="12" fill="none" stroke="var(--accent-light)" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <span style={{fontFamily:"Outfit,sans-serif",fontWeight:700,fontSize:11,
          letterSpacing:"0.08em",color:"var(--text-primary)"}}>JOB DESCRIPTION</span>
      </div>
      <textarea value={jd} onChange={e=>setJd(e.target.value)}
        placeholder={"Paste job description here…\n\nInclude skills, experience, and role details."}
        style={{width:"100%",minHeight:128,padding:"11px 13px",background:"var(--bg-input)",
          border:"1px solid var(--border)",borderRadius:9,color:"var(--text-primary)",
          fontFamily:"Space Grotesk,sans-serif",fontSize:12,lineHeight:1.75,resize:"vertical",outline:"none",
          transition:"border-color 0.2s"}}
        onFocus={e=>e.target.style.borderColor="var(--border-active)"}
        onBlur={e=>e.target.style.borderColor="var(--border)"}/>
      <div style={{marginTop:10,marginBottom:12}}>
        <div style={{fontSize:9,color:"var(--text-muted)",marginBottom:6,letterSpacing:"0.08em"}}>QUICK EXAMPLES</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {["React+Node","Python ML","Java Stack","DevOps","MERN","Software Dev"].map((l,i)=>(
            <button key={i} onClick={()=>setJd(examples[i])} style={{
              padding:"3px 10px",borderRadius:99,fontSize:10,cursor:"pointer",
              background:"rgba(124,58,237,0.09)",color:"var(--accent-light)",
              border:"1px solid rgba(139,92,246,0.22)",fontFamily:"Space Grotesk,sans-serif"}}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <button onClick={()=>onAnalyze(jd)} disabled={loading||!jd.trim()} style={{
        width:"100%",padding:"11px",
        background:loading?"rgba(124,58,237,0.2)":"linear-gradient(135deg,#7c3aed,#06b6d4)",
        color:"white",border:"none",borderRadius:9,cursor:loading?"not-allowed":"pointer",
        fontFamily:"Outfit,sans-serif",fontWeight:700,fontSize:12,letterSpacing:"0.06em",
        boxShadow:loading?"none":"0 0 22px rgba(124,58,237,0.3)",transition:"all 0.2s"}}>
        {loading
          ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span className="spinner"/>ANALYZING…</span>
          :"⚡ ANALYZE & RANK CANDIDATES"}
      </button>
      {jdInfo&&(
        <div style={{marginTop:11,padding:12,background:"rgba(124,58,237,0.06)",
          border:"1px solid rgba(139,92,246,0.18)",borderRadius:9}} className="anim-fade">
          <div style={{fontSize:9,color:"var(--text-muted)",marginBottom:7,letterSpacing:"0.08em"}}>EXTRACTED FROM JD</div>
          {jdInfo.roleTitle&&(
            <div style={{fontSize:11,color:"var(--text-secondary)",marginBottom:7}}>
              <span style={{color:"var(--text-muted)"}}>Role: </span>
              <span style={{color:"var(--accent-light)",fontWeight:700}}>{jdInfo.roleTitle}</span>
              {jdInfo.requiredExperience>0&&
                <span style={{color:"var(--text-muted)",marginLeft:8}}>· {jdInfo.requiredExperience}+ yrs</span>}
            </div>
          )}
          <div style={{display:"flex",flexWrap:"wrap"}}>
            {(jdInfo.skills||[]).map((s,i)=><Chip key={i} label={s} type="matched"/>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Candidate Card ────────────────────────────────────────────────────────────
function CandidateCard({ c, selected, onClick, rank, t, shortlisted, onShortlist }) {
  const color  = scoreColor(c.finalScore, t);
  const icolor = interestColor(c.interestLevel, t);
  const live   = c.conversationInterestScore;
  const liveColor = live ? (live>=70?"#10b981":live>=45?"#f59e0b":"#f43f5e") : null;

  return (
    <div onClick={onClick} className={`cand-item${selected?" cand-selected":""}`}
      style={{animationDelay:`${Math.min(rank*0.035,0.5)}s`}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:20,textAlign:"center",flexShrink:0}}>
          {rank<3
            ?<span style={{fontSize:14}}>{["🥇","🥈","🥉"][rank]}</span>
            :<span style={{fontSize:9,color:"var(--text-muted)",fontFamily:"JetBrains Mono,monospace"}}>{rank+1}</span>}
        </div>
        <div style={{width:34,height:34,borderRadius:9,flexShrink:0,background:`${color}18`,
          border:`1.5px solid ${color}38`,display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:12,color}}>
          {c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:12.5,color:"var(--text-primary)",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
          <div style={{fontSize:10,color:"var(--text-muted)"}}>{c.experience}y · {c.location}</div>
        </div>
        <button onClick={e=>{e.stopPropagation();onShortlist(c);}}
          style={{background:"none",border:"none",cursor:"pointer",fontSize:15,padding:"2px 4px",
            color:shortlisted?"#f59e0b":"rgba(139,92,246,0.3)",transition:"color 0.2s"}}>
          {shortlisted?"★":"☆"}
        </button>
        <div style={{padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:800,
          background:`${color}14`,color,border:`1px solid ${color}32`,
          fontFamily:"JetBrains Mono,monospace",flexShrink:0}}>{c.finalScore}</div>
      </div>
      <div style={{marginTop:9}}>
        <MiniBar label="MATCH"    value={c.matchScore}    color={scoreColor(c.matchScore,t)}/>
        <MiniBar label="INTEREST" value={c.interestScore} color={icolor}/>
        {live!=null&&(
          <MiniBar label="⚡ LIVE INTEREST" value={live} color={liveColor} animated/>
        )}
      </div>
      <div style={{marginTop:7,display:"flex",flexWrap:"wrap",alignItems:"center"}}>
        {c.matchedSkills?.slice(0,3).map((s,i)=><Chip key={i} label={s} type="matched"/>)}
        {(c.matchedSkills?.length||0)>3&&<Chip label={`+${c.matchedSkills.length-3}`}/>}
        {live!=null&&(
          <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:99,
            fontSize:9.5,fontWeight:600,background:`${liveColor}18`,color:liveColor,
            border:`1px solid ${liveColor}35`,marginRight:4,marginBottom:4}}>
            ⚡ {interestRatingLabel(live)?.text}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Candidates Column ─────────────────────────────────────────────────────────
function CandidatesColumn({ candidates, selected, onSelect, loading, t, shortlist, onShortlist }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("finalScore");

  const filtered = candidates
    .filter(c=>{
      if(filter==="strong")    return c.finalScore>=80;
      if(filter==="potential") return c.finalScore>=60&&c.finalScore<80;
      if(filter==="active")    return c.interestLevel==="high";
      if(filter==="assessed")  return c.conversationInterestScore!=null;
      return true;
    })
    .filter(c=>!search||c.name.toLowerCase().includes(search.toLowerCase())||
      c.skills.some(s=>s.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>{
      if(sortBy==="conversationInterestScore"){
        return (b.conversationInterestScore??-1)-(a.conversationInterestScore??-1);
      }
      return b[sortBy]-a[sortBy];
    });

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{padding:"12px 12px 10px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
          <div style={{width:26,height:26,borderRadius:7,background:"rgba(124,58,237,0.15)",
            border:"1px solid rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="12" height="12" fill="none" stroke="var(--accent-light)" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span style={{fontFamily:"Outfit,sans-serif",fontWeight:700,fontSize:11,
            letterSpacing:"0.07em",color:"var(--text-primary)"}}>MATCHED CANDIDATES</span>
          <span style={{marginLeft:"auto",padding:"1px 9px",borderRadius:99,fontSize:9,
            background:"rgba(124,58,237,0.14)",color:"var(--accent-light)",
            border:"1px solid rgba(139,92,246,0.3)",fontFamily:"JetBrains Mono,monospace",fontWeight:700}}>
            {filtered.length}
          </span>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or skill…"
          style={{width:"100%",padding:"7px 11px",borderRadius:8,marginBottom:8,
            background:"var(--bg-input)",border:"1px solid var(--border)",color:"var(--text-primary)",
            fontSize:11,outline:"none",fontFamily:"Space Grotesk,sans-serif",transition:"border-color 0.2s"}}
          onFocus={e=>e.target.style.borderColor="var(--border-active)"}
          onBlur={e=>e.target.style.borderColor="var(--border)"}/>
        <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
          {[{id:"all",l:"All"},{id:"strong",l:"Strong"},{id:"potential",l:"Potential"},
            {id:"active",l:"Active"},{id:"assessed",l:"⚡ Assessed"}].map(f=>(
            <button key={f.id} onClick={()=>setFilter(f.id)} style={{
              padding:"2px 9px",borderRadius:99,fontSize:9.5,cursor:"pointer",
              fontFamily:"Space Grotesk,sans-serif",transition:"all 0.15s",
              background:filter===f.id?"rgba(124,58,237,0.18)":"rgba(139,92,246,0.05)",
              color:filter===f.id?"var(--accent-light)":"var(--text-muted)",
              border:`1px solid ${filter===f.id?"rgba(139,92,246,0.4)":"var(--border)"}`
            }}>{f.l}</button>
          ))}
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{
          width:"100%",padding:"5px 9px",borderRadius:7,fontSize:10,
          background:"var(--bg-input)",border:"1px solid var(--border)",
          color:"var(--text-secondary)",outline:"none",cursor:"pointer",fontFamily:"Space Grotesk,sans-serif"}}>
          <option value="finalScore">Sort: Final Score</option>
          <option value="matchScore">Sort: Skill Match</option>
          <option value="interestScore">Sort: Base Interest</option>
          <option value="conversationInterestScore">Sort: ⚡ Live Interest</option>
          <option value="experience">Sort: Experience</option>
        </select>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
        {loading&&[...Array(5)].map((_,i)=>(
          <div key={i} className="skeleton" style={{height:120,borderRadius:10,marginBottom:8,animationDelay:`${i*0.08}s`}}/>
        ))}
        {!loading&&candidates.length===0&&(
          <div style={{textAlign:"center",padding:"50px 16px",color:"var(--text-muted)"}}>
            <div style={{fontSize:36,marginBottom:10}}>🎯</div>
            <div style={{fontSize:12,fontFamily:"Outfit,sans-serif",fontWeight:600,
              color:"var(--text-secondary)",marginBottom:6}}>No candidates yet</div>
            <div style={{fontSize:11,lineHeight:1.65}}>Paste a JD and click Analyze to discover matches</div>
          </div>
        )}
        {!loading&&candidates.length>0&&filtered.length===0&&(
          <div style={{textAlign:"center",padding:"40px 16px",color:"var(--text-muted)",fontSize:12}}>
            No candidates match this filter
          </div>
        )}
        {!loading&&filtered.map((c,i)=>(
          <CandidateCard key={c.id} c={c} rank={i}
            selected={selected?.id===c.id} onClick={()=>onSelect(c)} t={t}
            shortlisted={shortlist.some(s=>s.id===c.id)} onShortlist={onShortlist}/>
        ))}
      </div>
    </div>
  );
}

// ── Profile Panel ─────────────────────────────────────────────────────────────
function ProfilePanel({ candidate, onStartChat, onShortlist, shortlisted, t }) {
  const [outreach, setOutreach] = useState("");
  const [outLoading, setOutLoading] = useState(false);
  const color  = scoreColor(candidate.finalScore, t);
  const icolor = interestColor(candidate.interestLevel, t);
  const reco   = recoBadge(candidate.recommendation);
  const live   = candidate.conversationInterestScore;
  const liveHistory = candidate.interestHistory || [];

  const getOutreach = async () => {
    setOutLoading(true);
    try {
      const res = await axios.post(`${API}/outreach`,{candidate,jobTitle:candidate.currentRole});
      setOutreach(res.data.message);
    } catch {
      setOutreach(`Hi ${candidate.name.split(" ")[0]}, your ${candidate.skills[0]} expertise caught our attention! We have an exciting ${candidate.currentRole} opportunity — would you be open to a quick chat?`);
    }
    setOutLoading(false);
  };

  return (
    <div style={{height:"100%",overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:14}}>
      {/* Hero */}
      <div style={{padding:18,borderRadius:14,background:`linear-gradient(135deg,${color}0d,${color}04)`,
        border:`1px solid ${color}28`}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
          <div style={{width:58,height:58,borderRadius:16,flexShrink:0,background:`${color}1c`,
            border:`2px solid ${color}40`,display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:22,color}}>
            {candidate.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:19,
              color:"var(--text-primary)",marginBottom:3}}>{candidate.name}</div>
            <div style={{fontSize:12,color:"var(--text-secondary)",marginBottom:10}}>
              {candidate.currentRole} · {candidate.experience} yrs · {candidate.location}
            </div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{padding:"3px 11px",borderRadius:99,fontSize:10,fontWeight:700,
                background:reco.bg,color:reco.color,border:`1px solid ${reco.border}`}}>
                {candidate.recommendation}
              </span>
              <span style={{padding:"3px 11px",borderRadius:99,fontSize:10,
                background:`${icolor}14`,color:icolor,border:`1px solid ${icolor}32`}}>
                {interestLabel(candidate.interestLevel)}
              </span>
              <button onClick={()=>onShortlist(candidate)} style={{
                padding:"3px 11px",borderRadius:99,fontSize:10,fontWeight:700,cursor:"pointer",
                background:shortlisted?"rgba(245,158,11,0.15)":"rgba(139,92,246,0.08)",
                color:shortlisted?"#f59e0b":"var(--text-muted)",
                border:`1px solid ${shortlisted?"rgba(245,158,11,0.4)":"var(--border)"}`,transition:"all 0.2s"}}>
                {shortlisted?"★ Shortlisted":"☆ Add to Shortlist"}
              </button>
            </div>
          </div>
          <ScoreRing score={candidate.finalScore} size={62} color={color} label="FINAL"/>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="rcard">
        <div className="rcard-title">SCORE BREAKDOWN</div>
        <div style={{display:"grid",gridTemplateColumns:live!=null?"1fr 1fr 1fr":"1fr 1fr",gap:10,marginBottom:13}}>
          <div style={{textAlign:"center",padding:"12px 8px",background:"rgba(139,92,246,0.05)",borderRadius:10}}>
            <ScoreRing score={candidate.matchScore} size={58} color={scoreColor(candidate.matchScore,t)} label="SKILL MATCH"/>
          </div>
          <div style={{textAlign:"center",padding:"12px 8px",background:"rgba(139,92,246,0.05)",borderRadius:10}}>
            <ScoreRing score={candidate.interestScore} size={58} color={icolor} label="BASE INTEREST"/>
          </div>
          {live!=null&&(
            <div style={{textAlign:"center",padding:"12px 8px",
              background:"rgba(16,185,129,0.06)",borderRadius:10,border:"1px solid rgba(16,185,129,0.2)"}}>
              <ScoreRing score={live} size={58} color={live>=70?"#10b981":live>=45?"#f59e0b":"#f43f5e"} label="⚡ LIVE"/>
            </div>
          )}
        </div>
        {live!=null&&(
          <LiveInterestIndicator score={live} history={liveHistory}/>
        )}
        <div style={{marginTop:live!=null?10:0,fontSize:12,color:"var(--text-secondary)",fontStyle:"italic",
          padding:"10px 13px",background:"rgba(139,92,246,0.05)",borderRadius:9,
          borderLeft:`3px solid ${icolor}`,lineHeight:1.65}}>"{candidate.response}"</div>
      </div>

      {/* Skills */}
      <div className="rcard">
        <div className="rcard-title">SKILLS ANALYSIS</div>
        {candidate.matchedSkills?.length>0&&(
          <div style={{marginBottom:10}}>
            <div style={{fontSize:9,color:"var(--text-muted)",marginBottom:5,letterSpacing:"0.05em"}}>✓ MATCHED</div>
            <div>{candidate.matchedSkills.map((s,i)=><Chip key={i} label={s} type="matched"/>)}</div>
          </div>
        )}
        {candidate.missingSkills?.length>0&&(
          <div style={{marginBottom:10}}>
            <div style={{fontSize:9,color:"var(--text-muted)",marginBottom:5,letterSpacing:"0.05em"}}>✗ MISSING</div>
            <div>{candidate.missingSkills.map((s,i)=><Chip key={i} label={s} type="missing"/>)}</div>
          </div>
        )}
        <div>
          <div style={{fontSize:9,color:"var(--text-muted)",marginBottom:5,letterSpacing:"0.05em"}}>ALL SKILLS</div>
          <div>{candidate.skills.map((s,i)=><Chip key={i} label={s}/>)}</div>
        </div>
      </div>

      {/* Details */}
      <div className="rcard">
        <div className="rcard-title">PROFILE DETAILS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            {icon:"🎓",label:"Education",  value:candidate.college},
            {icon:"📍",label:"Location",   value:candidate.location},
            {icon:"💰",label:"Expected CTC",value:candidate.expectedSalary},
            {icon:"⏱️",label:"Availability",value:candidate.availability},
            {icon:"📧",label:"Email",      value:candidate.email},
            {icon:"📱",label:"Phone",      value:candidate.phone},
          ].map((item,i)=>(
            <div key={i} style={{padding:"9px 11px",background:"rgba(139,92,246,0.05)",
              borderRadius:9,border:"1px solid rgba(139,92,246,0.08)"}}>
              <div style={{fontSize:9,color:"var(--text-muted)",marginBottom:3,letterSpacing:"0.05em"}}>
                {item.icon} {item.label.toUpperCase()}
              </div>
              <div style={{fontSize:11,color:"var(--text-secondary)",wordBreak:"break-all",lineHeight:1.45}}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outreach */}
      <div className="rcard">
        <div className="rcard-title">AI OUTREACH MESSAGE</div>
        {outreach&&(
          <div style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.75,
            padding:"11px 13px",background:"rgba(124,58,237,0.06)",borderRadius:9,
            border:"1px solid rgba(139,92,246,0.18)",marginBottom:10}}>{outreach}</div>
        )}
        <button onClick={getOutreach} disabled={outLoading} style={{
          width:"100%",padding:"9px",borderRadius:9,fontSize:12,
          background:"rgba(124,58,237,0.1)",color:"var(--accent-light)",
          border:"1px solid rgba(139,92,246,0.25)",cursor:outLoading?"not-allowed":"pointer",
          fontWeight:600,fontFamily:"Space Grotesk,sans-serif",transition:"all 0.2s"}}>
          {outLoading?"⚡ Generating…":outreach?"🔄 Regenerate":"✨ Generate Outreach Message"}
        </button>
      </div>

      <button onClick={onStartChat} style={{
        width:"100%",padding:"15px",
        background:"linear-gradient(135deg,#7c3aed,#06b6d4)",
        color:"white",border:"none",borderRadius:11,
        fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:13,letterSpacing:"0.05em",
        cursor:"pointer",boxShadow:"0 0 28px rgba(124,58,237,0.35)",transition:"all 0.2s"}}>
        💬 START OUTREACH SIMULATION
      </button>
    </div>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────
function ChatPanel({ candidate, onBack, t, onInterestUpdate }) {
  const [messages, setMessages]   = useState([{
    from:"system",
    text:`📤 Outreach session started with ${candidate.name} (${candidate.currentRole}, ${candidate.experience} yrs). Assess their genuine interest through conversation. Interest updates live after each reply.`
  }]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sessionId]               = useState(()=>`${candidate.id}_${Date.now()}`);
  const [liveScore, setLiveScore] = useState(candidate.conversationInterestScore);
  const [history, setHistory]     = useState(candidate.interestHistory || []);
  const [aiMode, setAiMode]       = useState(null);
  const endRef                    = useRef(null);
  const color                     = scoreColor(candidate.finalScore, t);

  const outreachQs = [
    `Hi ${candidate.name.split(" ")[0]}, I came across your profile and wanted to reach out. Are you open to exploring new opportunities?`,
    `We have a ${candidate.currentRole} role that matches your ${candidate.skills[0]} background. Would that interest you?`,
    `What would it take for you to consider a move right now?`,
    `Tell me about your experience with ${candidate.skills[0]} — any recent projects?`,
    `Our budget is in the ${candidate.expectedSalary} range — does that work for you?`,
    `What's your availability looking like? Are you ${candidate.availability.toLowerCase()}?`,
  ];

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const send = async (text) => {
    const msg = (text||input).trim();
    if(!msg||loading) return;
    setInput("");

    const updated = [...messages, {from:"user",text:msg}];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await axios.post(`${API}/chat`,{message:msg,candidate,sessionId});
      const { reply, conversationInterestScore, interestHistory, aiPowered } = res.data;

      if(aiPowered !== undefined) setAiMode(aiPowered);

      if(conversationInterestScore != null) {
        setLiveScore(conversationInterestScore);
        setHistory(interestHistory || []);
        onInterestUpdate(candidate.id, conversationInterestScore, interestHistory);
      }

      setMessages([...updated,{from:"bot",text:reply}]);
    } catch(err) {
      console.error("Chat error:",err);
      setMessages([...updated,{from:"bot",text:"Connection issue — make sure the backend is running on port 5000."}]);
    }
    setLoading(false);
  };

  // REMOVED THE UNUSED liveColor VARIABLE HERE

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",padding:18}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:13,
        borderBottom:"1px solid var(--border)",marginBottom:12,flexShrink:0}}>
        <button onClick={onBack} style={{padding:"4px 12px",borderRadius:8,fontSize:11,
          background:"rgba(139,92,246,0.08)",color:"var(--text-secondary)",
          border:"1px solid var(--border)",cursor:"pointer",fontFamily:"Space Grotesk,sans-serif"}}>← Back</button>
        <div style={{width:34,height:34,borderRadius:9,flexShrink:0,background:`${color}1c`,
          border:`1.5px solid ${color}38`,display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:12,color}}>
          {candidate.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:13.5,color:"var(--text-primary)"}}>{candidate.name}</div>
          <div style={{fontSize:10,color:"var(--text-muted)"}}>
            Outreach Simulation · {candidate.currentRole}
            {aiMode===true&&<span style={{marginLeft:6,color:"#10b981",fontSize:9}}>● AI Active</span>}
            {aiMode===false&&<span style={{marginLeft:6,color:"#f59e0b",fontSize:9}}>● Smart Fallback</span>}
          </div>
        </div>
        {liveScore!=null&&(
          <LiveInterestIndicator score={liveScore} history={history} compact/>
        )}
        <span style={{padding:"3px 10px",borderRadius:99,fontSize:9,fontWeight:700,
          background:"rgba(124,58,237,0.14)",color:"var(--accent-light)",
          border:"1px solid rgba(139,92,246,0.3)",fontFamily:"JetBrains Mono,monospace"}}>● LIVE</span>
      </div>

      {/* Outreach script presets */}
      {messages.filter(m=>m.from==="user").length===0&&(
        <div style={{marginBottom:12,flexShrink:0}}>
          <div style={{fontSize:9,color:"var(--text-muted)",marginBottom:7,letterSpacing:"0.08em"}}>
            📤 OUTREACH SCRIPT — click to send
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {outreachQs.map((q,i)=>(
              <button key={i} onClick={()=>send(q)} style={{
                padding:"4px 11px",borderRadius:99,fontSize:10.5,cursor:"pointer",
                background:"rgba(124,58,237,0.09)",color:"var(--accent-light)",
                border:"1px solid rgba(139,92,246,0.22)",fontFamily:"Space Grotesk,sans-serif"}}>
                {q.length>50?q.slice(0,50)+"…":q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingRight:4}}>
        {messages.map((msg,i)=>(
          <div key={i} style={{display:"flex",
            justifyContent:msg.from==="user"?"flex-end":"flex-start",
            animation:"fadeIn 0.22s ease forwards"}}>
            {msg.from==="system"?(
              <div style={{width:"100%",padding:"9px 13px",borderRadius:9,
                background:"rgba(124,58,237,0.07)",border:"1px solid rgba(139,92,246,0.18)",
                fontSize:11,color:"var(--text-muted)",textAlign:"center",fontStyle:"italic"}}>{msg.text}</div>
            ):(
              <div style={{maxWidth:"80%",padding:"11px 14px",borderRadius:13,
                background:msg.from==="user"?"linear-gradient(135deg,#7c3aed,#06b6d4)":"var(--bg-card-hover)",
                color:msg.from==="user"?"white":"var(--text-primary)",
                border:msg.from==="user"?"none":"1px solid var(--border)",
                fontSize:13,lineHeight:1.65,
                borderBottomRightRadius:msg.from==="user"?3:13,
                borderBottomLeftRadius:msg.from==="bot"?3:13,
                boxShadow:msg.from==="user"?"0 4px 18px rgba(124,58,237,0.3)":"none"}}>
                {msg.from==="bot"&&(
                  <div style={{fontSize:8.5,color:"var(--accent-light)",marginBottom:4,
                    fontFamily:"JetBrains Mono,monospace",letterSpacing:"0.08em"}}>
                    {candidate.name.split(" ")[0].toUpperCase()}
                  </div>
                )}
                {msg.text}
                {msg.from==="bot"&&msg.delta!=null&&Math.abs(msg.delta)>2&&(
                  <div style={{fontSize:9,marginTop:5,color:msg.delta>0?"#10b981":"#f43f5e",
                    fontFamily:"JetBrains Mono,monospace"}}>
                    {msg.delta>0?`↑ Interest +${msg.delta}`:`↓ Interest ${msg.delta}`}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"6px 13px"}}>
            {[0,0.18,0.36].map((d,i)=>(
              <div key={i} className="typing-dot" style={{animationDelay:`${d}s`}}/>
            ))}
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Live Interest Bar at bottom of chat */}
      {liveScore!=null&&(
        <div style={{marginTop:10,flexShrink:0}}>
          <LiveInterestIndicator score={liveScore} history={history}/>
        </div>
      )}

      {/* Input */}
      <div style={{display:"flex",gap:9,marginTop:10,flexShrink:0}}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder={`Send outreach message to ${candidate.name.split(" ")[0]}…`}
          style={{flex:1,padding:"11px 14px",borderRadius:9,
            background:"var(--bg-input)",border:"1px solid var(--border)",
            color:"var(--text-primary)",fontSize:13,outline:"none",
            fontFamily:"Space Grotesk,sans-serif",transition:"border-color 0.2s"}}
          onFocus={e=>e.target.style.borderColor="var(--border-active)"}
          onBlur={e=>e.target.style.borderColor="var(--border)"}/>
        <button onClick={()=>send()} disabled={loading||!input.trim()} style={{
          padding:"11px 20px",borderRadius:9,
          background:loading?"rgba(124,58,237,0.18)":"linear-gradient(135deg,#7c3aed,#06b6d4)",
          color:"white",border:"none",cursor:loading?"not-allowed":"pointer",
          fontWeight:700,fontSize:13,fontFamily:"Outfit,sans-serif",
          boxShadow:loading?"none":"0 0 16px rgba(124,58,237,0.35)",transition:"all 0.2s"}}>
          {loading?"…":"Send"}
        </button>
      </div>
    </div>
  );
}

// ── Shortlist Modal ───────────────────────────────────────────────────────────
function ShortlistPanel({ shortlist, onClose, onRemove, jdInfo, t }) {
  const [exporting, setExporting] = useState(false);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await axios.post(`${API}/shortlist/export`,
        {candidates:shortlist,jobTitle:jdInfo?.roleTitle||"Candidates"},
        {responseType:"blob"}
      );
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href=url;
      a.download=`HireSense_Shortlist_${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      const rows = shortlist.map((c,i)=>
        [i+1,c.name,c.currentRole,c.experience,c.location,c.matchScore,
         c.interestScore,c.conversationInterestScore??"N/A",c.finalScore,c.recommendation,c.email].join(",")
      );
      const blob = new Blob([["#,Name,Role,Exp,Location,Match,Interest,Live,Final,Reco,Email",...rows].join("\n")],{type:"text/csv"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url;
      a.download=`HireSense_Shortlist_${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(8px)"}}>
      <div style={{width:"min(920px,95vw)",maxHeight:"85vh",display:"flex",flexDirection:"column",
        background:"var(--bg-secondary)",borderRadius:18,border:"1px solid rgba(139,92,246,0.3)",
        boxShadow:"0 8px 60px rgba(0,0,0,0.6)"}}>
        <div style={{padding:"18px 22px",borderBottom:"1px solid var(--border)",
          display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:20,color:"var(--text-primary)"}}>
              📋 Recruiter Shortlist
            </div>
            <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>
              {shortlist.length} candidates · {shortlist.filter(c=>c.conversationInterestScore!=null).length} assessed via outreach
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={exportCSV} disabled={exporting||!shortlist.length} style={{
              padding:"9px 20px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",
              background:"linear-gradient(135deg,#10b981,#06b6d4)",color:"white",border:"none",
              boxShadow:"0 0 20px rgba(16,185,129,0.3)",fontFamily:"Outfit,sans-serif"}}>
              {exporting?"⏳ Exporting…":"⬇ Export CSV"}
            </button>
            <button onClick={onClose} style={{padding:"9px 16px",borderRadius:9,fontSize:12,cursor:"pointer",
              background:"rgba(139,92,246,0.1)",color:"var(--text-secondary)",
              border:"1px solid var(--border)",fontFamily:"Space Grotesk,sans-serif"}}>✕ Close</button>
          </div>
        </div>
        <div style={{overflowY:"auto",padding:18,flex:1}}>
          {!shortlist.length?(
            <div style={{textAlign:"center",padding:"60px",color:"var(--text-muted)"}}>
              <div style={{fontSize:40,marginBottom:12}}>⭐</div>
              <div style={{fontSize:14,color:"var(--text-secondary)",marginBottom:6}}>No candidates shortlisted yet</div>
              <div style={{fontSize:12}}>Click ☆ on any candidate card to add them here</div>
            </div>
          ):(
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:"1px solid var(--border)"}}>
                  {["#","Candidate","Role","Exp","Match","Base Interest","⚡ Live Interest","Final","Recommendation","Action"].map(h=>(
                    <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:9,
                      color:"var(--text-muted)",letterSpacing:"0.08em",fontFamily:"JetBrains Mono,monospace",fontWeight:700}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shortlist.slice().sort((a,b)=>b.finalScore-a.finalScore).map((c,i)=>{
                  const col  = scoreColor(c.finalScore,t);
                  const reco = recoBadge(c.recommendation);
                  const live = c.conversationInterestScore;
                  const lc   = live ? (live>=70?"#10b981":live>=45?"#f59e0b":"#f43f5e") : null;
                  return (
                    <tr key={c.id} style={{borderBottom:"1px solid rgba(139,92,246,0.06)"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(139,92,246,0.04)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"10px",fontSize:11,color:"var(--text-muted)",fontFamily:"JetBrains Mono,monospace"}}>{i+1}</td>
                      <td style={{padding:"10px"}}>
                        <div style={{fontWeight:600,fontSize:12.5,color:"var(--text-primary)"}}>{c.name}</div>
                        <div style={{fontSize:9.5,color:"var(--text-muted)"}}>{c.location} · {c.expectedSalary}</div>
                      </td>
                      <td style={{padding:"10px",fontSize:11,color:"var(--text-secondary)"}}>{c.currentRole}</td>
                      <td style={{padding:"10px",fontSize:11,color:"var(--text-secondary)",fontFamily:"JetBrains Mono,monospace"}}>{c.experience}y</td>
                      <td style={{padding:"10px"}}><span style={{fontSize:14,fontWeight:800,color:scoreColor(c.matchScore,t),fontFamily:"JetBrains Mono,monospace"}}>{c.matchScore}</span></td>
                      <td style={{padding:"10px"}}><span style={{fontSize:14,fontWeight:800,color:interestColor(c.interestLevel,t),fontFamily:"JetBrains Mono,monospace"}}>{c.interestScore}</span></td>
                      <td style={{padding:"10px"}}>
                        {live!=null
                          ?<span style={{fontSize:14,fontWeight:800,color:lc,fontFamily:"JetBrains Mono,monospace"}}>{live}</span>
                          :<span style={{fontSize:10,color:"var(--text-muted)",fontStyle:"italic"}}>Not assessed</span>}
                      </td>
                      <td style={{padding:"10px"}}><span style={{fontSize:16,fontWeight:900,color:col,fontFamily:"JetBrains Mono,monospace"}}>{c.finalScore}</span></td>
                      <td style={{padding:"10px"}}>
                        <span style={{padding:"3px 9px",borderRadius:99,fontSize:9.5,fontWeight:700,
                          background:reco.bg,color:reco.color,border:`1px solid ${reco.border}`}}>
                          {c.recommendation}
                        </span>
                      </td>
                      <td style={{padding:"10px"}}>
                        <button onClick={()=>onRemove(c.id)} style={{padding:"3px 9px",borderRadius:7,fontSize:10,cursor:"pointer",
                          background:"rgba(244,63,94,0.09)",color:"#f43f5e",border:"1px solid rgba(244,63,94,0.25)"}}>Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {shortlist.length>0&&(
          <div style={{padding:"12px 22px",borderTop:"1px solid var(--border)",
            display:"flex",gap:24,flexShrink:0}}>
            {[
              {label:"Strong Hire",value:shortlist.filter(c=>c.recommendation==="Strong Hire").length,color:"var(--accent-light)"},
              {label:"Potential",  value:shortlist.filter(c=>c.recommendation==="Potential Hire").length,color:"var(--accent-teal)"},
              {label:"Avg Final",  value:Math.round(shortlist.reduce((a,c)=>a+c.finalScore,0)/shortlist.length),color:"var(--accent-amber)"},
              {label:"Avg Live",   value:(()=>{
                const a=shortlist.filter(c=>c.conversationInterestScore!=null);
                return a.length?Math.round(a.reduce((s,c)=>s+c.conversationInterestScore,0)/a.length):"N/A";
              })(),color:"#10b981"},
            ].map(s=>(
              <div key={s.label}>
                <div style={{fontFamily:"JetBrains Mono,monospace",fontWeight:800,fontSize:18,color:s.color}}>{s.value}</div>
                <div style={{fontSize:9,color:"var(--text-muted)",letterSpacing:"0.07em"}}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyRight({ hasCandidates }) {
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",gap:20,padding:40}}>
      <div style={{width:80,height:80,borderRadius:24,
        background:"linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.06))",
        border:"1px solid rgba(139,92,246,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🎯</div>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:20,color:"var(--text-secondary)",marginBottom:9}}>
          {hasCandidates?"Select a Candidate":"Ready to Scout Talent"}
        </div>
        <div style={{fontSize:13,lineHeight:1.75,maxWidth:340,color:"var(--text-muted)"}}>
          {hasCandidates
            ?"Click any candidate from the center column to view their full profile and start outreach."
            :"Paste a job description on the left and click Analyze to discover matching candidates."}
        </div>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
        {["⚡ AI Powered","📊 Dual Scoring","💬 Live Interest Tracking","📋 Shortlist Export"].map((f,i)=>(
          <div key={i} style={{padding:"6px 14px",borderRadius:9,fontSize:11,
            background:"var(--bg-card)",border:"1px solid var(--border)",color:"var(--text-secondary)"}}>{f}</div>
        ))}
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark]             = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [view, setView]             = useState("profile");
  const [loading, setLoading]       = useState(false);
  const [jdInfo, setJdInfo]         = useState(null);
  const [stats, setStats]           = useState(null);
  const [shortlist, setShortlist]   = useState([]);
  const [showShortlist, setShowShortlist] = useState(false);

  const t = themes[dark?"dark":"light"];

  useEffect(()=>{
    const r   = document.documentElement;
    const vars = {
      "--bg-primary":t.bgPrimary,"--bg-secondary":t.bgSecondary,
      "--bg-card":t.bgCard,"--bg-card-hover":t.bgCardHover,
      "--bg-input":t.bgInput,"--border":t.border,"--border-active":t.borderActive,
      "--text-primary":t.textPrimary,"--text-secondary":t.textSecondary,"--text-muted":t.textMuted,
      "--accent-main":t.accentMain,"--accent-light":t.accentLight,
      "--accent-teal":t.accentTeal,"--accent-amber":t.accentAmber,"--accent-red":t.accentRed,"--glow":t.glow,
    };
    Object.entries(vars).forEach(([k,v])=>r.style.setProperty(k,v));
    document.body.style.background = t.bgPrimary;
    document.body.style.color      = t.textPrimary;
  },[dark,t]);

  useEffect(()=>{
    axios.get(`${API}/candidates`).then(r=>setStats(r.data)).catch(()=>{});
  },[]);

  const handleAnalyze = useCallback(async (jd)=>{
    if(!jd.trim()) return;
    setLoading(true); setCandidates([]); setSelected(null);
    setView("profile"); setJdInfo(null); setShortlist([]);
    try {
      const res = await axios.post(`${API}/analyze`,{jd});
      setCandidates(res.data.candidates||[]);
      setJdInfo(res.data.jdInfo);
    } catch {
      alert("Server error. Make sure backend is running on port 5000.");
    }
    setLoading(false);
  },[]);

  const handleShortlist = useCallback((candidate)=>{
    setShortlist(prev=>{
      const exists = prev.some(s=>s.id===candidate.id);
      return exists ? prev.filter(s=>s.id!==candidate.id) : [...prev, candidate];
    });
  },[]);

  const handleInterestUpdate = useCallback((candidateId, score, history)=>{
    const update = c => c.id===candidateId
      ? {...c, conversationInterestScore:score, interestHistory:history||[]}
      : c;
    setCandidates(prev=>prev.map(update));
    setSelected(prev=>prev?.id===candidateId ? update(prev) : prev);
    setShortlist(prev=>prev.map(update));
  },[]);

  const handleSelectCandidate = useCallback((c)=>{
    setCandidates(prev=>{
      const fresh = prev.find(p=>p.id===c.id)||c;
      setSelected(fresh);
      return prev;
    });
    setView("profile");
  },[]);

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",
      overflow:"hidden",background:"var(--bg-primary)",transition:"background 0.3s"}}>
      <Header stats={stats} dark={dark} onToggle={()=>setDark(d=>!d)}
        shortlistCount={shortlist.length} onShowShortlist={()=>setShowShortlist(true)}/>
      {candidates.length>0&&<SummaryBar candidates={candidates}/>}

      <div style={{flex:1,display:"grid",gridTemplateColumns:"275px 295px 1fr",overflow:"hidden"}}>
        {/* Col 1 — JD */}
        <div style={{borderRight:"1px solid var(--border)",overflowY:"auto",
          background:"var(--bg-secondary)",display:"flex",flexDirection:"column"}}>
          <JDPanel onAnalyze={handleAnalyze} loading={loading} jdInfo={jdInfo}/>
          {!loading&&!candidates.length&&(
            <div style={{padding:"28px 18px",textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:11}}>📋</div>
              <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.75}}>
                Enter a JD above and click Analyze.<br/>Matched candidates appear in the center.
              </div>
            </div>
          )}
        </div>

        {/* Col 2 — Candidates */}
        <div style={{borderRight:"1px solid var(--border)",overflow:"hidden",
          background:"var(--bg-primary)",display:"flex",flexDirection:"column"}}>
          <CandidatesColumn
            candidates={candidates} selected={selected}
            onSelect={handleSelectCandidate} loading={loading} t={t}
            shortlist={shortlist} onShortlist={handleShortlist}/>
        </div>

        {/* Col 3 — Profile / Chat */}
        <div style={{overflow:"hidden",background:"var(--bg-primary)",display:"flex",flexDirection:"column"}}>
          {selected
            ? view==="profile"
              ? <div className="anim-fade" style={{flex:1,overflow:"hidden"}}>
                  <ProfilePanel candidate={selected} onStartChat={()=>setView("chat")}
                    onShortlist={handleShortlist} shortlisted={shortlist.some(s=>s.id===selected.id)} t={t}/>
                </div>
              : <div className="anim-fade" style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                  <ChatPanel candidate={selected} onBack={()=>setView("profile")} t={t}
                    onInterestUpdate={handleInterestUpdate}/>
                </div>
            : <EmptyRight hasCandidates={candidates.length>0}/>}
        </div>
      </div>

      {showShortlist&&(
        <ShortlistPanel shortlist={shortlist} onClose={()=>setShowShortlist(false)}
          onRemove={id=>setShortlist(prev=>prev.filter(c=>c.id!==id))}
          jdInfo={jdInfo} t={t}/>
      )}
    </div>
  );
}