/* Story Video Builder — single-file MVP. Vanilla JS + localStorage. */
"use strict";

const STEPS = [
  ["Search","Research Tools"],
  ["Shortlist","Selection Tools"],
  ["Story Build","Story Builder"],
  ["Script","Script Studio"],
  ["Scenes","Scene Builder"],
  ["Production","Production Tools"],
  ["Studio","Video Studio"],
  ["Publish","Publish Center"],
  ["Tracker","Video Tracker"],
];

/* ---------- state ---------- */
const KEY = "svb.state.v1";
const blank = () => ({
  step: 0,
  ytKey: "",
  aiKey: "",
  search: { q:"elephants for kids", age:"3-10", tone:"", style:"", lang:"", duration:"", pop:"", adv:{} },
  results: [],        // last search result cards
  shortlist: [],      // {id,title,thumb,use:{facts,narration,visuals,hook},scores:{},notes,timestamps}
  story: { facts:"", tone:"playful", learn:"story", outline:"" },
  script: { length:"medium", age:"3-10", brief:"", body:"", dur:"", options:[], chosenStyle:"" },
  scenes: [],         // {narration,purpose,vtype,clip,replacement,image,overlay,timing,orig}
  production: { editBrief:"", cuts:"", subs:"", music:"", pacing:"", transitions:"", thumb:"", titles:"", desc:"", tags:"" },
  studio: { pixabayKey:"", color:{b:100,c:100,s:100,w:0}, kenburns:true, fps:30, res:"720", exported:false },
  narration: { tts:true, voice:"", audioName:"" },
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
const views = [step1,step2,step3,step4,step5,step6,stepStudio,step7,step8];
const wire  = [w1,null,w3,w4,w5,null,wStudio,w7,null];

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

/* ---- 4 SCRIPT (AI-assisted, 3 options + confirm) ---- */
const WORD_TARGET={short:150,medium:300,long:500};
function step4(){
  const opts=S.script.options||[];
  return group("Script Studio", `
    <div class="row">
      ${field("Length","script.length","select",["short","medium","long"])}
      ${field("Simplify for age","script.age","select",["3-6","3-10","6-12","8-14"])}
      <div class="field"><label>&nbsp;</label><button class="btn ghost" id="aiKey">${S.aiKey?"Gemini AI key set ✓":"Add Gemini AI key (free)"}</button></div>
    </div>
    <div class="row" style="margin:0 0 6px">
      <button class="btn primary" id="genScripts">✨ Generate 3 script options</button>
      <span class="note" id="genStatus"></span>
    </div>
    ${S.aiKey?"":`<div class="ph">No AI key yet — using built-in templates (uses your Story facts + outline). Add a free <b>Google Gemini</b> key for higher-quality, more varied writing.</div>`}
    ${(S.story.facts||S.story.outline)?"":`<div class="ph">Tip: fill <b>clustered facts</b> and generate an <b>outline</b> in Story Build (step 3) first — the script is written from those.</div>`}
    <div id="scriptOptions"></div>
    <div class="glabel" style="margin-top:18px">Confirmed script <span class="note" id="durOut"></span></div>
    ${field("","script.body","textarea","Pick an option above, or write/paste your own script here (intro / body / outro, with [pause] and *emphasis*).")}
    ${adv("Narration note", `<div class="ph">TTS in the Studio step reads this script for preview. For audio in the exported file, upload or record a voice track. Keep the script fully original.</div>`)}
  `);
}
function w4(){
  updateDur();
  el("aiKey").onclick=()=>{ const k=prompt("Free Google Gemini API key (aistudio.google.com/apikey). Stored locally only:",S.aiKey||""); if(k!=null){ S.aiKey=k.trim(); save(); render(); } };
  el("genScripts").onclick=generateScripts;
  const body=el("panel").querySelector('[data-model="script.body"]'); if(body) body.addEventListener("input",updateDur);
  renderScriptOptions();
}
function updateDur(){
  const words=(S.script.body||"").trim().split(/\s+/).filter(Boolean).length;
  const sec=Math.round(words/2.3); // ~140 wpm kid narration
  S.script.dur=sec?`~${Math.floor(sec/60)}m ${sec%60}s (${words} words)`:"";
  const o=el("durOut"); if(o)o.textContent=S.script.dur;
}
function renderScriptOptions(){
  const box=el("scriptOptions"); if(!box)return;
  const opts=S.script.options||[];
  if(!opts.length){ box.innerHTML=""; return; }
  box.innerHTML=`<div class="glabel" style="margin-top:14px">Choose a script (${opts.length} options)</div>`+opts.map((o,i)=>{
    const used=S.script.body && S.script.body===o.script;
    return `<div class="item ${used?"":""}" style="${used?"border-color:var(--acc2)":""}">
      <div class="ihead"><div class="it">${esc(o.style||("Option "+(i+1)))} ${used?'<span class="pill ok">✓ using</span>':''}</div>
        <button class="btn ${used?"acc2":"primary"} sm" data-use="${i}">${used?"In use ✓":"✓ Use this script"}</button></div>
      ${o.hook?`<div class="note" style="margin:6px 0"><b>Hook:</b> ${esc(o.hook)}</div>`:""}
      <textarea readonly style="min-height:150px;font-size:13px">${esc(o.script||"")}</textarea>
    </div>`;
  }).join("");
  box.querySelectorAll("[data-use]").forEach(b=>b.onclick=()=>useScript(+b.dataset.use));
}
function useScript(i){
  const o=S.script.options[i]; if(!o)return;
  S.script.body=o.script; S.script.chosenStyle=o.style; save(); render();
}
async function generateScripts(){
  const status=el("genStatus"); const btn=el("genScripts");
  const topic=topicWord(); const age=S.script.age; const len=S.script.length;
  const facts=(S.story.facts||"").trim(); const outline=(S.story.outline||"").trim();
  const tone=S.story.tone||"playful"; const learn=S.story.learn||"story";
  btn.disabled=true; status.textContent=S.aiKey?"Writing 3 scripts with AI…":"Building 3 options…";
  try{
    let opts;
    if(S.aiKey) opts=await aiScripts({topic,age,len,facts,outline,tone,learn});
    else opts=templateScripts({topic,len,outline,facts});
    if(!opts?.length) throw new Error("no options returned");
    S.script.options=opts.slice(0,3); save(); status.textContent="Done ✓ pick one below.";
    render();
  }catch(e){
    status.textContent="";
    S.script.options=templateScripts({topic,len,outline,facts}); save(); render();
    setTimeout(()=>{ const s=el("genStatus"); if(s)s.textContent=`AI failed (${e.message}) — showing template options.`; },30);
  }
  const b=el("genScripts"); if(b)b.disabled=false;
}
async function aiScripts({topic,age,len,facts,outline,tone,learn}){
  const words=WORD_TARGET[len]||300;
  const prompt=`You are a children's educational video scriptwriter. Write ORIGINAL narration scripts for kids aged ${age} about "${topic}".
Use ONLY the researched facts below as source material. Do NOT copy any existing video's wording — everything must be original, simple, and age-appropriate.
RESEARCHED FACTS:
${facts||"(none provided — use widely-known, accurate, kid-safe facts about "+topic+")"}
STORY OUTLINE (follow loosely):
${outline||"(none — invent a clear kid-friendly arc: hook, what it is, where found, types, surprising fact, gentle careful fact, funny bit, recap)"}
Tone: ${tone}. Learning style: ${learn}. Target length: about ${words} words each.
Write 3 DISTINCT options, each in a different storytelling style (e.g. playful adventure, calm bedtime, curious question-and-answer).
Each script needs: an intro hook, a body that teaches the facts as a story, and a warm outro. Use very simple words. Include [pause] markers and *emphasis* on key words.
Return ONLY JSON: an array of 3 objects with keys "style", "hook", "script".`;
  const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(S.aiKey)}`;
  const body={ contents:[{parts:[{text:prompt}]}], generationConfig:{ temperature:0.95, responseMimeType:"application/json",
    responseSchema:{ type:"ARRAY", items:{ type:"OBJECT", properties:{ style:{type:"STRING"}, hook:{type:"STRING"}, script:{type:"STRING"} }, required:["style","hook","script"] } } } };
  const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const j=await res.json();
  if(j.error) throw new Error(j.error.message||"API error");
  const txt=j.candidates?.[0]?.content?.parts?.[0]?.text; if(!txt) throw new Error("empty response");
  return JSON.parse(txt);
}
function templateScripts({topic,len,outline,facts}){
  const beats=(outline||"").split("\n").map(l=>l.replace(/^[A-Z ]+:\s*/,"").trim()).filter(Boolean);
  const factLines=(facts||"").split("\n").map(l=>l.replace(/^[-*]\s*/,"").trim()).filter(Boolean);
  const body=(beats.length?beats:factLines.length?factLines:[`${topic} are amazing`,`where ${topic} live`,`a surprising fact about ${topic}`,`what we learned`]);
  const T=topic.charAt(0).toUpperCase()+topic.slice(1);
  const mk=(style,intro,join,outro)=>({style,hook:intro.split("\n")[1]||intro,script:`[INTRO]\n${intro}\n\n[BODY]\n${body.map(b=>join(b)).join("\n[pause]\n")}\n\n[OUTRO]\n${outro}`});
  return [
    mk("Playful Adventure",
      `(excited) Hello little explorers! [pause]\nGet ready for an *amazing* adventure with ${topic}!`,
      b=>`Wow — ${b}!`,
      `(cheerful) What an adventure! [pause] Can *you* remember our favourite part about ${topic}? See you next time! 👋`),
    mk("Calm Bedtime",
      `(soft, gentle) Shhh… snuggle in. [pause]\nTonight, a quiet story about ${topic}.`,
      b=>`Softly now… ${b}.`,
      `(whisper) And so, our gentle ${topic} story ends. [pause] Sweet dreams, little one. 🌙`),
    mk("Curious Q&A",
      `(curious) Have you ever wondered about ${topic}? [pause]\nLet's find out together!`,
      b=>`Question: did you know… ${b}? *Yes!*`,
      `(warm) So many wonderful answers about ${topic}! [pause] What will *you* ask next time? 👋`),
  ];
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

/* ---- 7 STUDIO (video editor + export) ---- */
const MEDIA = {};          // sceneIdx -> {el, type, ready}
let AUDIO = null;          // {url, name} narration track (in-memory, not persisted)
let PREVIEW_RAF = null, RECORDING = false, previewAudio = null;
let micRec = null, micChunks = [];

const sceneDuration = sc => { const m=String(sc?.timing||"").match(/([\d.]+)/); return m?Math.max(1,+m[1]):5; };
const dims = () => S.studio.res==="1080"?[1920,1080]:[1280,720];
function topicWord(){ return ((S.search.q||S.story.facts||"nature").replace(/\b(for|to)\b.*/i,"").trim().split(/\s+/)[0]||"nature").replace(/[^\w]/g,"").toLowerCase(); }
function sceneKeyword(i){ const sc=S.scenes[i]||{}; return sc.asset?.kw || topicWord(); }
const slider=(label,path,min,max,val)=>`<div class="field"><label>${label} <b data-out="${path}">${val}</b></label><input type="range" min="${min}" max="${max}" value="${val}" data-model="${path}"></div>`;

function stepStudio(){
  if(!S.scenes.length) return group("Video Studio",`<div class="empty">No scenes yet. Go to <b>Scene Builder</b> (step 5) and build scenes first.</div>`);
  const c=S.studio.color;
  return group("Video Studio", `
    <div class="ph" style="border-color:var(--acc2);color:var(--acc2);background:rgba(0,208,163,.08)">
      ✅ Use only footage you're allowed to: your own uploads or free Pixabay clips/photos. Source YouTube videos stay research-only.</div>
    <div class="row"><button class="btn ghost sm" id="pixKey">${S.studio.pixabayKey?"Pixabay key set ✓":"Add Pixabay key (free footage)"}</button></div>

    <div class="glabel" style="margin-top:6px">Scene assets</div>
    <div id="assets"></div>

    <div class="glabel" style="margin-top:16px">Look &amp; grade</div>
    <div class="row">
      ${slider("Brightness","studio.color.b",50,150,c.b)}
      ${slider("Contrast","studio.color.c",50,150,c.c)}
      ${slider("Saturation","studio.color.s",0,200,c.s)}
      ${slider("Warmth","studio.color.w",0,80,c.w)}
    </div>
    <div class="row">
      <label class="pill" style="cursor:pointer"><input type="checkbox" data-model="studio.kenburns" style="width:auto;margin-right:6px">Pan/zoom (Ken Burns)</label>
      ${field("FPS","studio.fps","select",["24","30"])}
      ${field("Resolution","studio.res","select",["720","1080"])}
    </div>

    <div class="glabel" style="margin-top:16px">Narration</div>
    <div class="row">
      <label class="pill" style="cursor:pointer"><input type="checkbox" data-model="narration.tts" style="width:auto;margin-right:6px">Read script with TTS (preview)</label>
      <select data-model="narration.voice" id="voiceSel" style="max-width:240px"></select>
      <button class="btn sm" id="ttsPreview">🔊 Test voice</button>
    </div>
    <div class="row">
      <label class="btn sm" style="cursor:pointer">⬆ Upload voice track<input type="file" accept="audio/*" id="audioUp" hidden></label>
      <button class="btn sm" id="micRec">● Record narration</button>
      <span class="note" id="audioName">${S.narration.audioName?("🎵 "+esc(S.narration.audioName)):"no audio track"}</span>
    </div>
    <div class="note">TTS plays in the live preview. For sound in the <b>downloaded file</b>, upload or record a voice track (browser TTS can't be embedded).</div>

    <div class="glabel" style="margin-top:16px">Preview &amp; export</div>
    <canvas id="stCanvas" width="640" height="360" style="width:100%;max-width:640px;border-radius:12px;background:#0d0f1a;display:block"></canvas>
    <div class="row" style="margin-top:10px">
      <button class="btn" id="playBtn">▶ Preview</button>
      <button class="btn primary" id="exportBtn">🎬 Render &amp; download .webm</button>
    </div>
    <div class="ph" style="border-color:var(--warn)">Rendering runs in real time (a 60s video takes ~60s) and records the preview. Keep this tab visible while it renders.</div>
    <div class="note" id="exStatus"></div>
  `);
}
function wStudio(){
  el("pixKey").onclick=()=>{ const k=prompt("Free Pixabay API key (pixabay.com → sign up → https://pixabay.com/api/docs shows your key). Stored locally only:",S.studio.pixabayKey||""); if(k!=null){ S.studio.pixabayKey=k.trim(); save(); render(); } };
  renderAssets();
  populateVoices();
  el("ttsPreview").onclick=speakScript;
  el("audioUp").onchange=e=>{ const f=e.target.files[0]; if(f){ AUDIO={url:URL.createObjectURL(f),name:f.name}; S.narration.audioName=f.name; save(); el("audioName").textContent="🎵 "+f.name; } };
  el("micRec").onclick=e=>toggleRecord(e.target);
  el("playBtn").onclick=e=>previewPlay(e.target);
  el("exportBtn").onclick=e=>exportVideo(e.target);
  el("panel").querySelectorAll('input[type=range],select[data-model^="studio."],input[data-model="studio.kenburns"]').forEach(inp=>inp.addEventListener("input",()=>{ updateOuts(); drawStaticPreview(); }));
  ensureMedia().then(drawStaticPreview);
}
function updateOuts(){ el("panel")?.querySelectorAll("[data-out]").forEach(b=>{ const v=getPath(b.dataset.out); if(v!=null)b.textContent=v; }); }

/* --- assets --- */
function renderAssets(){
  const box=el("assets"); if(!box)return;
  box.innerHTML=S.scenes.map((sc,i)=>{
    const a=sc.asset||{}; const ready=MEDIA[i]?.ready;
    const thumb=a.thumb||(a.type==="image"?a.url:"");
    return `<div class="assetrow">
      <div class="athumb">${thumb?`<img src="${thumb}" alt="">`:"▶"}</div>
      <div class="ainfo">
        <b>Scene ${i+1}</b> <span class="note">${sceneDuration(sc)}s · ${esc((sc.overlay||sc.narration||"").slice(0,70))}</span>
        <div class="row" style="margin:8px 0 0">
          <input data-kw="${i}" placeholder="search keyword" value="${esc(a.kw||sceneKeyword(i))}" style="max-width:200px">
          <button class="btn sm" data-find="${i}">🔍 Free footage</button>
          <label class="btn sm" style="cursor:pointer">⬆ Upload<input type="file" accept="image/*,video/*" data-up="${i}" hidden></label>
          ${(a.url||ready)?`<span class="pill ok">${esc(a.source||"asset")} ✓</span>`:""}
        </div>
        <div class="picks" id="picks-${i}"></div>
      </div></div>`;
  }).join("");
  box.querySelectorAll("[data-find]").forEach(b=>b.onclick=()=>stockSearch(+b.dataset.find));
  box.querySelectorAll("[data-up]").forEach(inp=>inp.onchange=e=>{ const f=e.target.files[0]; if(f)uploadFile(+inp.dataset.up,f); });
  box.querySelectorAll("[data-kw]").forEach(inp=>inp.oninput=()=>{ setPath(`scenes.${inp.dataset.kw}.asset.kw`,inp.value); save(); });
}
async function stockSearch(i){
  const box=el("picks-"+i); const key=S.studio.pixabayKey.trim();
  const kw=(document.querySelector(`[data-kw="${i}"]`)?.value||sceneKeyword(i)).trim();
  setPath(`scenes.${i}.asset.kw`,kw); save();
  if(!key){ box.innerHTML=`<div class="ph">Add a free Pixabay key (button up top) to auto-find footage, or use <b>Upload</b>.</div>`; return; }
  box.innerHTML="Searching…";
  try{
    const u=`https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(kw)}&image_type=photo&safesearch=true&per_page=12`;
    const j=await (await fetch(u)).json();
    if(j.error) throw new Error(j.error);
    if(!j.hits?.length){ box.innerHTML=`<div class="note">No results — try another keyword.</div>`; return; }
    box.innerHTML=j.hits.map(h=>`<img class="pick" src="${h.previewURL}" data-full="${h.webformatURL}" data-thumb="${h.previewURL}" title="${esc(h.tags||"")}" alt="">`).join("");
    box.querySelectorAll(".pick").forEach(im=>im.onclick=()=>pickAsset(i,im.dataset.full,im.dataset.thumb,"image","pixabay"));
  }catch(e){ box.innerHTML=`<div class="ph">Footage search failed: ${esc(e.message)}. Use <b>Upload</b> instead.</div>`; }
}
async function pickAsset(i,url,thumb,type,source){
  const kw=S.scenes[i].asset?.kw||"";
  setPath(`scenes.${i}.asset`,{url,thumb,type,source,kw}); save();
  await loadMedia(i,url,type); renderAssets(); drawStaticPreview();
}
function uploadFile(i,file){
  const url=URL.createObjectURL(file); const type=file.type.startsWith("video")?"video":"image";
  const kw=S.scenes[i].asset?.kw||"";
  setPath(`scenes.${i}.asset`,{url:"",thumb:type==="image"?url:"",type,source:"upload",kw,name:file.name}); save();
  loadMedia(i,url,type).then(()=>{ renderAssets(); drawStaticPreview(); });
}
async function loadMedia(i,url,type){
  let src=url;
  if(/^https?:/.test(url)){ try{ const b=await (await fetch(url,{mode:"cors"})).blob(); src=URL.createObjectURL(b); }catch(e){} }
  return new Promise(res=>{
    if(type==="video"){
      const v=document.createElement("video"); v.muted=true; v.loop=true; v.playsInline=true;
      v.onloadeddata=()=>{ MEDIA[i]={el:v,type,ready:true}; v.play().catch(()=>{}); res(); };
      v.onerror=()=>{ MEDIA[i]={el:v,type,ready:false}; res(); }; v.src=src;
    } else {
      const im=new Image();
      im.onload=()=>{ MEDIA[i]={el:im,type,ready:true}; res(); };
      im.onerror=()=>{ MEDIA[i]={el:im,type,ready:false}; res(); }; im.src=src;
    }
  });
}
async function ensureMedia(){
  for(let i=0;i<S.scenes.length;i++){ const a=S.scenes[i].asset; if(a?.url && !MEDIA[i]?.ready) await loadMedia(i,a.url,a.type||"image"); }
}

/* --- narration --- */
function populateVoices(){
  const sel=el("voiceSel"); if(!sel)return;
  const fill=()=>{ const vs=speechSynthesis.getVoices().filter(v=>/en/i.test(v.lang)); sel.innerHTML=vs.map(v=>`<option value="${esc(v.name)}">${esc(v.name)} (${v.lang})</option>`).join("")||`<option>default</option>`; if(S.narration.voice)sel.value=S.narration.voice; };
  fill(); speechSynthesis.onvoiceschanged=fill;
}
function utter(text){ const u=new SpeechSynthesisUtterance((text||"").replace(/\[[^\]]*\]/g," ").replace(/[*_]/g,"")); const v=speechSynthesis.getVoices().find(v=>v.name===S.narration.voice); if(v)u.voice=v; u.rate=0.95; u.pitch=1.05; return u; }
function speakScript(){ try{ speechSynthesis.cancel(); speechSynthesis.speak(utter(S.script.body)); }catch(e){} }
function speakScene(i){ try{ speechSynthesis.cancel(); speechSynthesis.speak(utter(S.scenes[i].narration)); }catch(e){} }
async function toggleRecord(btn){
  if(micRec&&micRec.state==="recording"){ micRec.stop(); return; }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    micRec=new MediaRecorder(stream); micChunks=[];
    micRec.ondataavailable=e=>{ if(e.data.size)micChunks.push(e.data); };
    micRec.onstop=()=>{ const b=new Blob(micChunks,{type:"audio/webm"}); AUDIO={url:URL.createObjectURL(b),name:"mic-recording.webm"}; S.narration.audioName=AUDIO.name; save(); stream.getTracks().forEach(t=>t.stop()); el("audioName").textContent="🎵 "+AUDIO.name; btn.textContent="● Record narration"; };
    micRec.start(); btn.textContent="■ Stop recording";
  }catch(e){ alert("Mic access failed: "+e.message); }
}

/* --- draw / preview --- */
function coverDraw(ctx,media,W,H,zoom){
  const iw=media.videoWidth||media.naturalWidth||media.width, ih=media.videoHeight||media.naturalHeight||media.height;
  if(!iw||!ih) return false;
  const scale=Math.max(W/iw,H/ih)*zoom, dw=iw*scale, dh=ih*scale;
  ctx.drawImage(media,(W-dw)/2,(H-dh)/2,dw,dh); return true;
}
function wrapText(ctx,text,maxW){
  const words=(text||"").split(/\s+/); const lines=[]; let line="";
  for(const w of words){ const t=line?line+" "+w:w; if(ctx.measureText(t).width>maxW&&line){ lines.push(line); line=w; } else line=t; }
  if(line)lines.push(line); return lines.slice(0,3);
}
function drawScene(ctx,W,H,idx,p){
  ctx.filter="none"; ctx.fillStyle="#0d0f1a"; ctx.fillRect(0,0,W,H);
  const c=S.studio.color, m=MEDIA[idx], zoom=S.studio.kenburns?1+0.08*p:1;
  let drew=false;
  if(m&&m.ready){ ctx.filter=`brightness(${c.b}%) contrast(${c.c}%) saturate(${c.s}%) sepia(${c.w}%)`; drew=coverDraw(ctx,m.el,W,H,zoom); ctx.filter="none"; }
  if(!drew){ ctx.fillStyle="#1b2140"; ctx.fillRect(0,0,W,H); ctx.fillStyle="#6c7bff"; ctx.textAlign="center"; ctx.font=`bold ${H*0.09}px system-ui`; ctx.fillText("Scene "+(idx+1),W/2,H*0.46); ctx.fillStyle="#9aa0bf"; ctx.font=`${H*0.035}px system-ui`; ctx.fillText("add an image or clip",W/2,H*0.56); }
  const ov=S.scenes[idx]?.overlay||S.scenes[idx]?.narration||"";
  if(ov){
    ctx.font=`600 ${H*0.05}px system-ui`; ctx.textAlign="center";
    const lines=wrapText(ctx,ov,W*0.86), lh=H*0.066, bh=lines.length*lh+H*0.04, by=H-bh;
    const g=ctx.createLinearGradient(0,by-H*0.06,0,H); g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(0,0,0,.72)");
    ctx.fillStyle=g; ctx.fillRect(0,by-H*0.06,W,bh+H*0.06);
    ctx.fillStyle="#fff"; lines.forEach((l,k)=>ctx.fillText(l,W/2,by+H*0.03+lh*(k+0.7)));
  }
}
function drawStaticPreview(){ const cv=el("stCanvas"); if(!cv)return; drawScene(cv.getContext("2d"),cv.width,cv.height,0,0); }
async function previewPlay(btn){
  if(PREVIEW_RAF){ previewStop(btn); return; }
  await ensureMedia();
  const cv=el("stCanvas"), ctx=cv.getContext("2d"), W=cv.width, H=cv.height;
  const durs=S.scenes.map(sceneDuration), total=durs.reduce((a,b)=>a+b,0), start=performance.now(); let last=-1;
  btn.textContent="■ Stop";
  if(AUDIO?.url){ previewAudio=new Audio(AUDIO.url); previewAudio.play().catch(()=>{}); }
  (function frame(now){
    const t=(now-start)/1000; if(t>=total){ previewStop(btn); return; }
    let acc=0,idx=0,p=0; for(let i=0;i<durs.length;i++){ if(t<acc+durs[i]){ idx=i; p=(t-acc)/durs[i]; break; } acc+=durs[i]; }
    if(idx!==last){ last=idx; if(S.narration.tts&&!AUDIO) speakScene(idx); }
    drawScene(ctx,W,H,idx,p); PREVIEW_RAF=requestAnimationFrame(frame);
  })(performance.now());
}
function previewStop(btn){ if(PREVIEW_RAF)cancelAnimationFrame(PREVIEW_RAF); PREVIEW_RAF=null; try{speechSynthesis.cancel();}catch(e){} if(previewAudio){previewAudio.pause();previewAudio=null;} if(btn)btn.textContent="▶ Preview"; drawStaticPreview(); }

/* --- export --- */
async function exportVideo(btn){
  if(RECORDING)return; const status=el("exStatus");
  if(!S.scenes.length){ status.textContent="Build scenes first."; return; }
  RECORDING=true; btn.disabled=true; status.textContent="Preparing… loading assets";
  await ensureMedia();
  const [W,H]=dims(); const cv=document.createElement("canvas"); cv.width=W; cv.height=H; const ctx=cv.getContext("2d");
  const fps=+S.studio.fps||30; const stream=cv.captureStream(fps);
  let audioEl,actx;
  if(AUDIO?.url){ try{ audioEl=new Audio(); audioEl.src=AUDIO.url; actx=new (window.AudioContext||window.webkitAudioContext)(); const s=actx.createMediaElementSource(audioEl); const d=actx.createMediaStreamDestination(); s.connect(d); d.stream.getAudioTracks().forEach(t=>stream.addTrack(t)); }catch(e){} }
  const mimes=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"]; const mime=mimes.find(m=>MediaRecorder.isTypeSupported(m))||"video/webm";
  const rec=new MediaRecorder(stream,{mimeType:mime}); const chunks=[];
  rec.ondataavailable=e=>{ if(e.data.size)chunks.push(e.data); };
  const durs=S.scenes.map(sceneDuration), total=durs.reduce((a,b)=>a+b,0);
  rec.onstop=()=>{ const blob=new Blob(chunks,{type:mime}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="story-video.webm"; a.click(); URL.revokeObjectURL(a.href); RECORDING=false; btn.disabled=false; S.studio.exported=true; save(); status.textContent=`Done ✓ story-video.webm — ${(blob.size/1048576).toFixed(1)} MB, ${total.toFixed(0)}s`+(AUDIO?"":" (no audio — add a voice track for sound)"); };
  rec.start(100);
  if(audioEl){ try{ await actx.resume(); audioEl.play(); }catch(e){} }
  const start=performance.now();
  await new Promise(done=>{ (function frame(now){ const t=(now-start)/1000; if(t>=total){ done(); return; } let acc=0,idx=0,p=0; for(let i=0;i<durs.length;i++){ if(t<acc+durs[i]){ idx=i; p=(t-acc)/durs[i]; break; } acc+=durs[i]; } drawScene(ctx,W,H,idx,p); status.textContent=`Rendering… ${Math.round(t/total*100)}%`; requestAnimationFrame(frame); })(performance.now()); });
  rec.stop(); if(audioEl)audioEl.pause();
}

/* ---- 8 PUBLISH ---- */
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
    <div class="ph" style="${S.studio.exported?"border-color:var(--ok);color:var(--ok);background:rgba(40,199,111,.08)":""}">${S.studio.exported?"🎬 Video rendered in Studio — <b>story-video.webm</b> is on your hard drive, ready to upload.":"⚠ No video rendered yet. Go to <b>Studio</b> (step 7) to build and download your .webm."}</div>
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
    madeForKids:true, script:S.script.body, scenes:S.scenes, originality:originalityScore(),
    videoFile: S.studio.exported?"story-video.webm (rendered in Studio)":"not rendered yet"
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
  `<h4>Studio</h4><ul><li>Add a license-free image/clip per scene.</li><li>Only use footage you're allowed to (uploads or Pixabay).</li><li>Grade colors, then render to .webm.</li></ul>`,
  `<h4>Publish</h4><ul><li>Pass originality check first.</li><li>Set "Made for kids".</li><li>Official OAuth upload only.</li></ul>`,
  `<h4>Tracker</h4><ul><li>Log CTR & retention.</li><li>Feed learnings into next video.</li></ul>`,
];

render();
