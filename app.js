/* Story Video Builder — single-file MVP. Vanilla JS + localStorage. */
"use strict";

const STEPS = [
  ["Search","Research Tools"],
  ["Shortlist","Selection Tools"],
  ["Story Build","Story Builder"],
  ["Script","Script Studio"],
  ["Scenes","Scene Builder"],
  ["Production","Production Tools"],
  ["Publish","Publish Center"],
  ["Tracker","Video Tracker"],
];

/* ---------- state ---------- */
const KEY = "svb.state.v1";
const blank = () => ({
  step: 0,
  ytKey: "",
  search: { q:"elephants for kids", age:"3-10", tone:"", style:"", lang:"", duration:"", pop:"", adv:{} },
  results: [],        // last search result cards
  shortlist: [],      // {id,title,thumb,use:{facts,narration,visuals,hook},scores:{},notes,timestamps}
  story: { facts:"", tone:"playful", learn:"story", outline:"" },
  script: { length:"medium", age:"3-10", brief:"", body:"", dur:"" },
  scenes: [],         // {narration,purpose,vtype,clip,replacement,image,overlay,timing,orig}
  production: { editBrief:"", cuts:"", subs:"", music:"", pacing:"", transitions:"", thumb:"", titles:"", desc:"", tags:"" },
  publish: { checks:{}, meta:"" },
  tracker: { title:"", date:"", views:"", ctr:"", avd:"", comments:"", worked:"", improve:"" },
});
let S = load();
function load(){ try{ return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY))||{}); }catch{ return blank(); } }
function save(){ localStorage.setItem(KEY, JSON.stringify(S)); flashSaved(); }
let saveT; function flashSaved(){ const h=el("saveHint"); if(!h)return; h.textContent="Saved ✓"; clearTimeout(saveT); saveT=setTimeout(()=>h.textContent="Saved",1200); }

/* ---------- helpers ---------- */
const el = id => document.getElementById(id);
const esc = s => (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function bind(node){
  node.querySelectorAll("[data-model]").forEach(inp=>{
    const path = inp.dataset.model;
    const v = getPath(path);
    if(inp.type==="checkbox") inp.checked=!!v; else if(v!=null) inp.value=v;
    inp.addEventListener("input",()=>{ setPath(path, inp.type==="checkbox"?inp.checked:inp.value); save(); });
  });
}
function getPath(p){ return p.split(".").reduce((o,k)=>o?.[k], S); }
function setPath(p,val){ const ks=p.split("."); let o=S; for(let i=0;i<ks.length-1;i++){ o[ks[i]] ??= {}; o=o[ks[i]]; } o[ks.at(-1)]=val; }

/* ---------- shell ---------- */
function renderStepper(){
  el("stepper").innerHTML = STEPS.map((s,i)=>{
    const cls = i===S.step?"active":(i<S.step?"done":"");
    return `<div class="step ${cls}" data-go="${i}"><span class="n">${i<S.step?"✓":i+1}</span>${s[0]}</div>`;
  }).join("");
  el("stepper").querySelectorAll("[data-go]").forEach(n=>n.onclick=()=>go(+n.dataset.go));
}
function go(i){ S.step=Math.max(0,Math.min(STEPS.length-1,i)); save(); render(); window.scrollTo(0,0); }
el("backBtn").onclick=()=>go(S.step-1);
el("nextBtn").onclick=()=>go(S.step+1);

function render(){
  renderStepper();
  const [name,mod]=STEPS[S.step];
  el("panel").innerHTML = `<h2>${S.step+1}. ${name}</h2><p class="sub">${mod}</p>` + views[S.step]();
  bind(el("panel"));
  wire[S.step]?.();
  el("backBtn").disabled = S.step===0;
  el("nextBtn").textContent = S.step===STEPS.length-1 ? "Finish" : "Next →";
  el("helper").innerHTML = HELP[S.step];
}

/* advanced disclosure helper */
const adv = (label,inner)=>`<details class="adv"><summary>${label}</summary><div style="margin-top:12px">${inner}</div></details>`;
const group = (label,inner)=>`<div class="group"><div class="glabel">${label}</div>${inner}</div>`;
const field = (label,path,type="text",opts)=>{
  if(type==="select") return `<div class="field"><label>${label}</label><select data-model="${path}">${opts.map(o=>`<option value="${o}">${o||"—"}</option>`).join("")}</select></div>`;
  if(type==="textarea") return `<div class="field"><label>${label}</label><textarea data-model="${path}" placeholder="${opts||""}"></textarea></div>`;
  return `<div class="field"><label>${label}</label><input data-model="${path}" placeholder="${opts||""}"></div>`;
};

/* =================== STEP VIEWS =================== */
const views = [step1,step2,step3,step4,step5,step6,step7,step8];
const wire  = [w1,null,w3,w4,w5,null,w7,null];

/* ---- 1 SEARCH ---- */
function step1(){
  const s=S.search;
  return group("Research Tools", `
    <div class="row">
      ${field("Search: keyword / URL / channel / topic","search.q")}
    </div>
    <div class="row">
      ${field("Age group","search.age","select",["","0-3","3-10","6-12","8-14"])}
      ${field("Tone","search.tone","select",["","calm","playful","curious","magical","documentary-light"])}
      ${field("Narration/Educational style","search.style","select",["","storytelling","facts","Q&A","adventure","fun-facts"])}
    </div>
    <div class="row">
      ${field("Language","search.lang","select",["","English","Hindi","Spanish","French"])}
      ${field("Duration","search.duration","select",["","short (<4m)","medium (4-20m)","long (>20m)"])}
      ${field("Popularity","search.pop","select",["","any","rising","popular","most viewed"])}
    </div>
    ${adv("Advanced filters", `<div class="row">
      ${field("Hook style","search.adv.hook","select",["","question","surprise","story","challenge"])}
      ${field("Pacing","search.adv.pacing","select",["","slow","medium","fast"])}
      ${field("Humor","search.adv.humor","select",["","none","light","high"])}
    </div><div class="row">
      ${field("Curiosity","search.adv.curiosity","select",["","low","medium","high"])}
      ${field("Fact density","search.adv.factdensity","select",["","low","medium","high"])}
      ${field("Visual style","search.adv.visual","select",["","animation","live","mixed"])}
    </div><div class="row">
      ${field("Difficulty","search.adv.difficulty","select",["","easy","medium","hard"])}
    </div>`)}
    <div class="row" style="margin-top:6px">
      <button class="btn primary" id="doSearch">🔎 Search YouTube</button>
      <button class="btn ghost sm" id="setKey">${S.ytKey?"API key set ✓":"Add API key"}</button>
    </div>
    ${S.ytKey?"":`<div class="ph">No YouTube API key yet — showing sample results. Click <b>Add API key</b> for live search (official YouTube Data API v3).</div>`}
    <div id="results" class="cards" style="margin-top:14px"></div>
  `);
}
function w1(){
  el("doSearch").onclick=doSearch;
  el("setKey").onclick=()=>{ const k=prompt("Paste YouTube Data API v3 key (stored locally only):",S.ytKey||""); if(k!=null){ S.ytKey=k.trim(); save(); render(); } };
  renderResults();
}
function renderResults(){
  const box=el("results"); if(!box) return;
  if(!S.results.length){ box.innerHTML=`<div class="empty">No results yet — run a search.</div>`; return; }
  box.innerHTML = S.results.map(r=>{
    const picked = S.shortlist.some(x=>x.id===r.id);
    return `<div class="card ${picked?"selected":""}">
      <div class="thumb">${r.thumb?`<img src="${r.thumb}" alt="">`:"▶"}</div>
      <div class="body">
        <div class="t">${esc(r.title)}</div>
        <div class="meta">${esc(r.channel||"")} · ${r.duration||"—"} · transcript: ${r.transcript?"yes":"?"}</div>
        <div class="tags">${(r.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>
        <div class="note">${esc(r.note||"")}</div>
        <button class="btn ${picked?"acc2":"primary"} sm" data-pick="${r.id}">${picked?"Shortlisted ✓":"+ Shortlist"}</button>
      </div></div>`;
  }).join("");
  box.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>togglePick(b.dataset.pick));
}
function togglePick(id){
  const i=S.shortlist.findIndex(x=>x.id===id);
  if(i>=0) S.shortlist.splice(i,1);
  else { const r=S.results.find(x=>x.id===id); if(r) S.shortlist.push({id,title:r.title,thumb:r.thumb,channel:r.channel,use:{},scores:{},notes:"",timestamps:""}); }
  save(); renderResults();
}
async function doSearch(){
  const box=el("results"); box.innerHTML=`<div class="empty">Searching…</div>`;
  const s=S.search;
  if(S.ytKey){
    try{
      const dur = s.duration?.startsWith("short")?"short":s.duration?.startsWith("long")?"long":s.duration?"medium":"";
      const u=new URL("https://www.googleapis.com/youtube/v3/search");
      u.search=new URLSearchParams({key:S.ytKey,part:"snippet",type:"video",safeSearch:"strict",maxResults:"12",q:`${s.q} ${s.style||""} kids`,videoDuration:dur||"any",order:s.pop==="most viewed"?"viewCount":"relevance",relevanceLanguage:(s.lang||"en").slice(0,2).toLowerCase()});
      const res=await fetch(u); const j=await res.json();
      if(j.error) throw new Error(j.error.message);
      S.results=(j.items||[]).map(it=>({
        id:it.id.videoId, title:it.snippet.title, channel:it.snippet.channelTitle,
        thumb:it.snippet.thumbnails?.medium?.url, duration:"—", transcript:false,
        tags:[s.age,s.tone,s.style].filter(Boolean),
        note:it.snippet.description?.slice(0,90)||""
      }));
    }catch(e){ box.innerHTML=`<div class="ph">Live search failed: ${esc(e.message)}. Showing samples.</div>`; S.results=samples(s); }
  } else { S.results=samples(s); }
  save(); renderResults();
}
function samples(s){
  const topic=(s.q||"topic").split(" ")[0];
  const base=[
    ["The Amazing World of "+topic,"KidLearn TV","6:12",["storytelling","calm","facts"],"Strong narration, good fact pacing — useful for facts + narration."],
    [topic+" for Kids! Fun Facts","Little Explorers","4:03",["fun-facts","playful"],"Snappy hooks; useful for hook ideas."],
    ["Why "+topic+" Are Special","NatureTots","8:47",["documentary-light","curious"],"Great visuals; useful for B-roll inspiration."],
    ["Meet the "+topic+" — Story Time","Bedtime Learn","10:20",["magical","story"],"Story arc reference; child-safe tone."],
    ["10 Surprising "+topic+" Facts","QuizKids","5:30",["Q&A","facts"],"Fact density high; verify accuracy before reuse."],
    ["Baby "+topic+" Adventure","TinyTales","3:15",["adventure","playful"],"Simple language; good for ages 3-6."],
  ];
  return base.map((b,i)=>({id:"sample-"+i,title:b[0],channel:b[1],duration:b[2],transcript:i%2===0,tags:b[3],note:b[4],thumb:""}));
}

/* ---- 2 SHORTLIST ---- */
const USES=["facts","narration","visuals","hook"];
const SCORES=[["info","Information quality"],["narr","Narration quality"],["vis","Visual usefulness"],["kid","Child-friendliness"],["orig","Originality safety"]];
const ADVSCORES=[["hook","Hook strength"],["pace","Pacing"],["accuracy","Fact accuracy"]];
function step2(){
  if(!S.shortlist.length) return group("Selection Tools", `<div class="empty">Nothing shortlisted yet. Go to Search and add sources.</div>`);
  return group("Selection Tools",
    `<p class="note">Compare sources side-by-side, tag how you'll use each, and score them.</p>` +
    S.shortlist.map((x,i)=>`
    <div class="item">
      <div class="ihead"><div class="it">${esc(x.title)}</div>
        <button class="btn ghost sm" data-rm="${i}">Remove</button></div>
      <div class="meta note">${esc(x.channel||"")}</div>
      <div class="row" style="margin-top:10px">
        ${USES.map(u=>`<label class="pill" style="cursor:pointer"><input type="checkbox" data-model="shortlist.${i}.use.${u}" style="width:auto;margin-right:6px">${u}</label>`).join("")}
      </div>
      ${SCORES.map(sc=>scoreRow(i,sc)).join("")}
      ${adv("Advanced scoring", ADVSCORES.map(sc=>scoreRow(i,sc)).join(""))}
      <div class="row" style="margin-top:10px">
        ${field("Useful timestamps","shortlist."+i+".timestamps","text","e.g. 1:20 fact, 3:05 hook")}
      </div>
      ${field("Notes","shortlist."+i+".notes","textarea","Why is this source useful?")}
    </div>`).join("")
  );
}
function scoreRow(i,[k,label]){
  const v=S.shortlist[i].scores?.[k]??3;
  return `<div class="scorebar"><label>${label}</label>
    <span><input type="range" min="1" max="5" value="${v}" data-model="shortlist.${i}.scores.${k}" style="width:140px"> <b>${v}</b></span></div>`;
}
document.addEventListener("input",e=>{ // live score label + range refresh
  if(e.target.type==="range"){ const b=e.target.parentElement.querySelector("b"); if(b)b.textContent=e.target.value; }
});
// remove handler (delegated on panel re-render)
function w2(){}

/* ---- 3 STORY BUILD ---- */
function step3(){
  return group("Story Builder", `
    ${field("Clustered facts (paste/collect from sources; dedupe repeats)","story.facts","textarea","- Elephants are the largest land animal\n- They use trunks to drink and grab food\n...")}
    <div class="row">
      ${field("Tone","story.tone","select",["calm","playful","curious","magical","documentary-light"])}
      ${field("Learning style","story.learn","select",["story","facts","Q&A","adventure","fun-facts"])}
    </div>
    <div class="row"><button class="btn primary" id="genOutline">✨ Generate story outline</button></div>
    ${field("Story outline (hook → what → where → types → surprising → scary-but-safe → funny ending → recap)","story.outline","textarea","")}
  `);
}
function w3(){
  el("genOutline").onclick=()=>{
    const topic=(S.search.q||"the topic").split(" ")[0];
    const t=S.story.tone, l=S.story.learn;
    S.story.outline =
`HOOK: A ${t} question — "Did you know ${topic} can do something amazing?"
WHAT IT IS: Simple ${l}-style intro to ${topic}.
WHERE FOUND: Where ${topic} live, shown with friendly visuals.
TYPES: The main kinds of ${topic}, one fun detail each.
SURPRISING FACTS: 2-3 "wow" facts pulled from your clustered facts.
SCARY BUT CHILD-SAFE: One gentle "careful!" fact, kept reassuring.
FUNNY ENDING: A giggle moment to finish.
RECAP: 3 things we learned today.`;
    setPath("story.outline",S.story.outline); save(); render();
  };
}

/* ---- 4 SCRIPT ---- */
function step4(){
  return group("Script Studio", `
    <div class="row">
      ${field("Length","script.length","select",["short","medium","long"])}
      ${field("Simplify for age","script.age","select",["3-6","3-10","6-12","8-14"])}
    </div>
    ${field("Narration brief (voice, mood, pace)","script.brief","textarea","Warm, calm storyteller voice; slow pace; friendly.")}
    <div class="row"><button class="btn primary" id="genScript">✨ Draft original script</button>
      <span class="note" id="durOut"></span></div>
    ${field("Script (intro / body / outro, with [pause] and *emphasis* markers)","script.body","textarea","")}
    ${adv("Alternate hooks & TTS", `
      <p class="note">Alternate opening hooks:</p>
      <ul class="note"><li>Question hook</li><li>Surprise-fact hook</li><li>Mini-story hook</li></ul>
      <div class="ph">TTS narration is a <b>placeholder</b> in MVP — export the script and use your own TTS/voiceover tool. Real TTS can be wired later.</div>`)}
  `);
}
function w4(){
  updateDur();
  el("genScript").onclick=()=>{
    const topic=(S.search.q||"the topic").split(" ")[0];
    const n=S.script.length==="short"?"short":S.script.length==="long"?"long":"medium";
    S.script.body =
`[INTRO]
(warm) Hello little explorers! *${topic}*... are you ready? [pause]
Today we discover something amazing about ${topic}!

[BODY]
${(S.story.outline||"").split("\n").filter(Boolean).map(l=>"— "+l.replace(/^[A-Z ]+:\s*/,"")).join("\n[pause]\n")}

[OUTRO]
(gentle) And that's the magic of ${topic}! [pause]
Can *you* remember three things we learned? See you next time! 👋`;
    setPath("script.body",S.script.body); save(); render();
  };
}
function updateDur(){
  const words=(S.script.body||"").trim().split(/\s+/).filter(Boolean).length;
  const sec=Math.round(words/2.3); // ~140 wpm kid narration
  S.script.dur=sec?`~${Math.floor(sec/60)}m ${sec%60}s (${words} words)`:"";
  const o=el("durOut"); if(o)o.textContent=S.script.dur;
}

/* ---- 5 SCENE BUILDER ---- */
function step5(){
  return group("Scene Builder", `
    <div class="row"><button class="btn primary" id="genScenes">✨ Build scenes from script</button>
      <button class="btn ghost" id="addScene">+ Add scene</button></div>
    <div id="sceneList"></div>
  `);
}
function w5(){
  el("genScenes").onclick=()=>{
    const lines=(S.script.body||"").split("\n").filter(l=>l.trim()&&!l.startsWith("[")&&!/^\(/.test(l));
    S.scenes=lines.slice(0,10).map(l=>({narration:l.replace(/[*_]/g,"").trim(),purpose:"explain",vtype:"animation",clip:"",replacement:"Custom animation instead of source clip",image:"friendly illustration",overlay:"",timing:"5s",orig:"ok"}));
    if(!S.scenes.length) S.scenes=[emptyScene()];
    save(); renderScenes();
  };
  el("addScene").onclick=()=>{ S.scenes.push(emptyScene()); save(); renderScenes(); };
  renderScenes();
}
const emptyScene=()=>({narration:"",purpose:"",vtype:"animation",clip:"",replacement:"",image:"",overlay:"",timing:"5s",orig:"ok"});
function renderScenes(){
  const box=el("sceneList"); if(!box)return;
  if(!S.scenes.length){ box.innerHTML=`<div class="empty">No scenes yet.</div>`; return; }
  box.innerHTML=S.scenes.map((sc,i)=>`
    <div class="scene">
      <h4>Scene ${i+1}
        <span>${origPill(sc.orig)} <button class="btn ghost sm" data-del="${i}">✕</button></span></h4>
      ${field("Narration line","scenes."+i+".narration","textarea")}
      <div class="row">
        ${field("Scene purpose","scenes."+i+".purpose","select",["","hook","explain","surprise","recap","fun"])}
        ${field("Visual type","scenes."+i+".vtype","select",["animation","live clip","image","text card","B-roll"])}
        ${field("Timing","scenes."+i+".timing")}
      </div>
      <div class="row">
        ${field("Source clip suggestion","scenes."+i+".clip","text","(reference only)")}
        ${field("Replacement visual (originality)","scenes."+i+".replacement","text","original visual to use instead")}
      </div>
      <div class="row">
        ${field("Image / animation idea","scenes."+i+".image")}
        ${field("Text overlay","scenes."+i+".overlay")}
        ${field("Originality","scenes."+i+".orig","select",["ok","review","risk"])}
      </div>
    </div>`).join("");
  bind(box);
  box.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{ S.scenes.splice(+b.dataset.del,1); save(); renderScenes(); });
}
const origPill=v=>v==="risk"?`<span class="pill bad">⚠ risk</span>`:v==="review"?`<span class="pill warn">review</span>`:`<span class="pill ok">original</span>`;

/* ---- 6 PRODUCTION ---- */
function step6(){
  return group("Production Tools", `
    ${field("Edit brief","production.editBrief","textarea","Overall editing direction for the editor.")}
    <div class="row">
      ${field("Cut suggestions","production.cuts","textarea","Where to trim / tighten.")}
      ${field("Subtitle plan","production.subs","textarea","Caption style, timing.")}
    </div>
    <div class="row">
      ${field("Music / sound notes","production.music","textarea","Gentle background, sfx cues.")}
      ${field("Pacing notes","production.pacing","textarea")}
      ${field("Transition notes","production.transitions","textarea")}
    </div>
    ${adv("Metadata & packaging", `
      ${field("Thumbnail brief","production.thumb","textarea","Bright, one big character, big face, 3-4 words.")}
      ${field("Title ideas (one per line)","production.titles","textarea")}
      ${field("Description draft","production.desc","textarea")}
      ${field("Tags draft (comma separated)","production.tags","text")}
    `)}
    <div class="row" style="margin-top:8px"><button class="btn acc2" id="exportPkg">⬇ Export editor package (JSON)</button></div>
  `);
}
function w6(){}

/* ---- 7 PUBLISH ---- */
const CHECKS=[
  ["orig","Originality: script & narration are original (not copied)"],
  ["src","Source usage reviewed — references only, no reupload"],
  ["kid","Kid-content: safe, accurate, age-appropriate, COPPA 'made for kids' set"],
  ["meta","Metadata reviewed (title, description, tags)"],
  ["thumb","Thumbnail reviewed"],
  ["visuals","Replacement/original visuals used where flagged"],
];
function step7(){
  const o=originalityScore();
  return group("Publish Center", `
    <h4 style="margin:0 0 4px">Originality check</h4>
    <div class="meter"><span style="width:${o.pct}%"></span></div>
    <p class="note">${o.pct}% — ${o.msg}</p>
    ${o.flags.length?`<div class="ph">${o.flags.map(esc).join("<br>")}</div>`:""}
    <div style="margin:16px 0">
      ${CHECKS.map(([k,l])=>`<div class="check"><input type="checkbox" data-model="publish.checks.${k}"><span>${l}</span></div>`).join("")}
    </div>
    ${field("Final metadata review notes","publish.meta","textarea")}
    <div class="group" style="margin-top:16px">
      <div class="glabel">YouTube upload</div>
      <div class="ph">Upload is a <b>placeholder</b> in MVP. Architecture: YouTube Data API v3 <code>videos.insert</code> via official Google OAuth 2.0 (scope <code>youtube.upload</code>) through a small backend — no scraping, no unofficial upload. Wire this after MVP.</div>
      <button class="btn" id="connectYT" disabled>🔗 Connect YouTube (coming soon)</button>
      <button class="btn primary" id="prepUpload">📦 Prepare upload package</button>
    </div>
  `);
}
function w7(){
  el("prepUpload").onclick=()=>download("upload-prep.json",{
    title:(S.production.titles||"").split("\n")[0]||S.tracker.title||"Untitled",
    description:S.production.desc, tags:(S.production.tags||"").split(",").map(t=>t.trim()).filter(Boolean),
    madeForKids:true, script:S.script.body, scenes:S.scenes, originality:originalityScore()
  });
}
function originalityScore(){
  let pct=40, flags=[];
  if((S.script.body||"").length>200) pct+=25; else flags.push("• Script looks thin — write an original full script.");
  if((S.story.outline||"").length>100) pct+=10;
  const risky=S.scenes.filter(s=>s.orig==="risk").length;
  const noRepl=S.scenes.filter(s=>s.clip&&!s.replacement).length;
  if(!S.scenes.length) flags.push("• No scenes built yet.");
  if(risky) flags.push(`• ${risky} scene(s) flagged as originality risk.`);
  if(noRepl) flags.push(`• ${noRepl} scene(s) use a source clip with no replacement visual.`);
  pct += Math.max(0, 25 - risky*8 - noRepl*5);
  pct=Math.max(0,Math.min(100,pct));
  const msg = pct>=80?"Looks original — good to review & publish.":pct>=55?"Needs a few originality fixes.":"Too close to sources — transform more before publishing.";
  return {pct,msg,flags};
}

/* ---- 8 TRACKER ---- */
function step8(){
  return group("Video Tracker", `
    <p class="note">Log published video performance to guide the next one.</p>
    <div class="row">
      ${field("Video title","tracker.title")}
      ${field("Publish date","tracker.date","text","YYYY-MM-DD")}
    </div>
    <div class="row">
      ${field("Views","tracker.views")}
      ${field("CTR %","tracker.ctr")}
      ${field("Avg view duration","tracker.avd","text","e.g. 2m 10s")}
    </div>
    ${field("Comments note (themes, feedback)","tracker.comments","textarea")}
    <div class="row">
      ${field("What worked","tracker.worked","textarea")}
      ${field("What to improve next","tracker.improve","textarea")}
    </div>
  `);
}

/* ---------- export ---------- */
function download(name,obj){
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href);
}
document.addEventListener("click",e=>{ if(e.target.id==="exportPkg") download("editor-package.json",{search:S.search,shortlist:S.shortlist,story:S.story,script:S.script,scenes:S.scenes,production:S.production}); });

/* delegated remove for shortlist */
document.addEventListener("click",e=>{ const b=e.target.closest?.("[data-rm]"); if(b){ S.shortlist.splice(+b.dataset.rm,1); save(); render(); } });

/* ---------- helper panels ---------- */
const HELP=[
  `<h4>Tips</h4><ul><li>Search broadly, then filter by age & style.</li><li>Add an API key for live results.</li><li>Shortlist 3–5 strong sources.</li></ul>`,
  `<h4>Score for</h4><ul><li>Info quality</li><li>Narration</li><li>Visual usefulness</li><li>Child-friendliness</li><li>Originality safety</li></ul>`,
  `<h4>Story arc</h4><ul><li>Hook → What → Where</li><li>Types → Surprising</li><li>Safe-scary → Funny → Recap</li></ul>`,
  `<h4>Script</h4><ul><li>Original wording only.</li><li>Use [pause] & *emphasis*.</li><li>Watch the duration estimate.</li></ul>`,
  `<h4>Scenes</h4><ul><li>Prefer replacement visuals.</li><li>Flag anything too close to a source.</li></ul>`,
  `<h4>Production</h4><ul><li>Write a clear edit brief.</li><li>Export the package for your editor.</li></ul>`,
  `<h4>Publish</h4><ul><li>Pass originality check first.</li><li>Set "Made for kids".</li><li>Official OAuth upload only.</li></ul>`,
  `<h4>Tracker</h4><ul><li>Log CTR & retention.</li><li>Feed learnings into next video.</li></ul>`,
];

render();
