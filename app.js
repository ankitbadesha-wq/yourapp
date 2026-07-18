/* Story Video Builder — v2 flow: Idea → Script → Storyboard → Studio → Publish.
   Pure static, vanilla JS + localStorage. Scripts are written with Claude (in chat). */
"use strict";

const STEPS = [
  ["Idea","Idea & Brief"],
  ["Script","Script"],
  ["Storyboard","Storyboard"],
  ["Studio","Voice & Video Studio"],
  ["Publish","Publish"],
];
const AGE=["0-3","3-8","8-12","12-16","16+"];
const THEMES=["Educational / informative","Fun facts","Motivational story","Survival story","Heart-warming story","Historical facts","Festivals & culture","Cities & places","Moral story"];
const LEN=["short","medium","long"];
const WORD_TARGET={short:150,medium:300,long:500};

/* ---------- state ---------- */
const KEY="svb.v2";
const blank=()=>({
  step:0,
  idea:{ text:"", age:"3-8", theme:"Educational / informative", length:"medium", brief:"", prompt:"" },
  script:{ body:"", options:[], dur:"" },
  scenes:[],   // {narration, timing, overlay, asset?}
  studio:{ pixabayKey:"", color:{b:100,c:100,s:105,w:8}, kenburns:true, fps:30, res:"720", exported:false },
  narration:{ tts:true, voice:"", audioName:"" },
  publish:{ checks:{}, title:"", desc:"", tags:"", thumb:"" },
});
let S=load();
function load(){ try{ return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY))||{}); }catch{ return blank(); } }
function save(){ localStorage.setItem(KEY, JSON.stringify(S)); flashSaved(); }
let saveT; function flashSaved(){ const h=el("saveHint"); if(!h)return; h.textContent="Saved ✓"; clearTimeout(saveT); saveT=setTimeout(()=>h.textContent="Saved",1200); }

/* ---------- helpers ---------- */
const el=id=>document.getElementById(id);
const esc=s=>(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function bind(node){
  node.querySelectorAll("[data-model]").forEach(inp=>{
    const path=inp.dataset.model, v=getPath(path);
    if(inp.type==="checkbox") inp.checked=!!v; else if(v!=null) inp.value=v;
    inp.addEventListener("input",()=>{ setPath(path, inp.type==="checkbox"?inp.checked:inp.value); save(); });
  });
}
function getPath(p){ return p.split(".").reduce((o,k)=>o?.[k], S); }
function setPath(p,val){ const ks=p.split("."); let o=S; for(let i=0;i<ks.length-1;i++){ o[ks[i]] ??= {}; o=o[ks[i]]; } o[ks.at(-1)]=val; }
const adv=(label,inner)=>`<details class="adv"><summary>${label}</summary><div style="margin-top:12px">${inner}</div></details>`;
const group=(label,inner)=>`<div class="group"><div class="glabel">${label}</div>${inner}</div>`;
const field=(label,path,type="text",opts)=>{
  const lab=label?`<label>${label}</label>`:"";
  if(type==="select") return `<div class="field">${lab}<select data-model="${path}">${opts.map(o=>`<option value="${o}">${o||"—"}</option>`).join("")}</select></div>`;
  if(type==="textarea") return `<div class="field">${lab}<textarea data-model="${path}" placeholder="${opts||""}"></textarea></div>`;
  return `<div class="field">${lab}<input data-model="${path}" placeholder="${opts||""}"></div>`;
};
const slider=(label,path,min,max,val)=>`<div class="field"><label>${label} <b data-out="${path}">${val}</b></label><input type="range" min="${min}" max="${max}" value="${val}" data-model="${path}"></div>`;
function topicWord(){
  const t=(S.idea.text||"").toLowerCase();
  const m=t.match(/about ([a-z]+)/); if(m) return m[1];
  const stop=new Set("a an the my our your for to of and or video about make create fun kids kid child children daughter son on in this that with".split(" "));
  const w=t.replace(/[^a-z\s]/g," ").split(/\s+/).find(w=>w.length>2 && !stop.has(w));
  return w||"nature";
}

/* ---------- shell ---------- */
function renderStepper(){
  el("stepper").innerHTML=STEPS.map((s,i)=>{
    const cls=i===S.step?"active":(i<S.step?"done":"");
    return `<div class="step ${cls}" data-go="${i}"><span class="n">${i<S.step?"✓":i+1}</span>${s[0]}</div>`;
  }).join("");
  el("stepper").querySelectorAll("[data-go]").forEach(n=>n.onclick=()=>go(+n.dataset.go));
}
function go(i){ S.step=Math.max(0,Math.min(STEPS.length-1,i)); save(); render(); window.scrollTo(0,0); }
el("backBtn").onclick=()=>go(S.step-1);
el("nextBtn").onclick=()=>go(S.step+1);
const views=[stepIdea,stepScript,stepScenes,stepStudio,stepPublish];
const wire =[wIdea,wScript,wScenes,wStudio,wPublish];
function render(){
  renderStepper();
  const [name,mod]=STEPS[S.step];
  el("panel").innerHTML=`<h2>${S.step+1}. ${name}</h2><p class="sub">${mod}</p>`+views[S.step]();
  bind(el("panel")); wire[S.step]?.();
  el("backBtn").disabled=S.step===0;
  el("nextBtn").textContent=S.step===STEPS.length-1?"Finish":"Next →";
  el("helper").innerHTML=HELP[S.step];
}

/* ===== 1 IDEA ===== */
function stepIdea(){
  return group("Idea & Brief", `
    ${field("Your rough idea (topic, feeling, or lesson)","idea.text","textarea","e.g. A fun video about elephants for my daughter — why they are gentle and amazing")}
    <div class="row">
      ${field("Age group","idea.age","select",AGE)}
      ${field("Theme","idea.theme","select",THEMES)}
      ${field("Video length","idea.length","select",LEN)}
    </div>
    <div class="row"><button class="btn primary" id="buildBrief">✨ Build brief &amp; AI prompt</button></div>
    ${field("Video brief","idea.brief","textarea","Click the button to generate — then edit freely.")}
    <div class="glabel" style="margin-top:14px">AI prompt — copy this, ask Claude / ChatGPT / Perplexity, then paste the script into step 2</div>
    ${field("","idea.prompt","textarea","")}
    <div class="row"><button class="btn acc2 sm" id="copyPrompt">⧉ Copy prompt</button></div>
  `);
}
function wIdea(){
  el("buildBrief").onclick=()=>{
    const {text,age,theme,length}=S.idea, words=WORD_TARGET[length]||300, topic=topicWord();
    const mins=Math.round(words/2.3/60*10)/10;
    S.idea.brief=`Topic: ${text||topic}
Audience: children aged ${age}
Theme: ${theme}
Length: ${length} (~${words} words, ~${mins} min narration)
Hook: open with a wow question or surprising fact about ${topic}.
Learning goal: the child remembers 3 simple facts about ${topic}.
Tone: warm, simple, storytelling — never robotic.`;
    const sceneCount=length==="short"?"4-5":length==="long"?"10-12":"6-8";
    S.idea.prompt=`You are a children's educational video scriptwriter. Write an original, heart-warming narration script for kids aged ${age} about "${text||topic}".
Theme: ${theme}. Total length about ${words} words. Style: warm, enthusiastic, storytelling, very simple words a ${age}-year-old can easily picture — NOT robotic. Use accurate, kid-safe facts.
Break the story into about ${sceneCount} SCENES. Begin with an exciting hook scene and end with a warm, cheerful goodbye.
Output EACH scene in EXACTLY this format and nothing else (do not add titles or commentary):

Scene 1
Narration: <the spoken words only — never say the word "scene"; add [pause] and *emphasis* where helpful>
Visual: <2-4 word search keyword for free stock footage that matches this line>
Text: <a short on-screen caption, or leave blank>

Then Scene 2, Scene 3, and so on to the end.
After the scenes, optionally list 2 alternative opening hooks.`;
    save(); render();
  };
  el("copyPrompt").onclick=()=>{ const t=S.idea.prompt||""; navigator.clipboard?.writeText(t).then(()=>{ const b=el("copyPrompt"); b.textContent="Copied ✓"; setTimeout(()=>{const x=el("copyPrompt");if(x)x.textContent="⧉ Copy prompt";},1200); }).catch(()=>{}); };
}

/* ===== 2 SCRIPT ===== */
function stepScript(){
  return group("Script", `
    ${S.idea.brief?`<div class="ph" style="border-color:var(--acc2);color:var(--mut);background:rgba(0,208,163,.06)"><b>Brief</b><br>${esc(S.idea.brief).replace(/\n/g,"<br>")}</div>`:`<div class="ph">Fill the <b>Idea</b> step first for a brief and a ready-to-paste AI prompt.</div>`}
    <p class="note">Ask Claude (here in chat) with your step-1 prompt, then paste the script you like below.</p>
    <div class="row">
      ${field("Length","idea.length","select",LEN)}
      ${field("Age","idea.age","select",AGE)}
    </div>
    <div class="glabel" style="margin-top:14px">Confirmed script <span class="note" id="durOut"></span></div>
    ${field("","script.body","textarea","Paste your chosen script here (intro / body / outro, with [pause] and *emphasis*).")}
    <div class="row" style="margin-top:8px"><button class="btn ghost sm" id="clearScript">✕ Clear script</button></div>
  `);
}
function wScript(){
  updateDur();
  const body=el("panel").querySelector('[data-model="script.body"]'); if(body) body.addEventListener("input",updateDur);
  const c=el("clearScript"); if(c) c.onclick=()=>{ if(!S.script.body || confirm("Clear the script?")){ S.script.body=""; save(); render(); } };
}
function updateDur(){
  const words=(S.script.body||"").trim().split(/\s+/).filter(Boolean).length;
  const sec=Math.round(words/2.3);
  S.script.dur=sec?`~${Math.floor(sec/60)}m ${sec%60}s (${words} words)`:"";
  const o=el("durOut"); if(o)o.textContent=S.script.dur;
}
/* ===== 3 STORYBOARD ===== */
const emptyScene=()=>({narration:"",timing:"5s",overlay:""});
function stepScenes(){
  return group("Storyboard", `
    <p class="note">Paste an AI script written in <b>Scene / Narration / Visual / Text</b> format (from step 1's prompt) and it imports each scene <b>with its footage keyword</b>. A plain script still splits into meaning-based scenes.</p>
    <div class="row">
      <button class="btn primary" id="genScenes">✨ Import scenes from script</button>
      <button class="btn ghost" id="addScene">+ Add scene</button>
    </div>
    <div id="sceneList"></div>
  `);
}
function wScenes(){
  el("genScenes").onclick=()=>{ S.scenes=buildScenes(); clearMedia(); save(); renderScenes(); };
  el("addScene").onclick=()=>{ S.scenes.push(emptyScene()); save(); renderScenes(); };
  renderScenes();
}
const estTiming=text=>Math.max(2,Math.round((text.trim().split(/\s+/).filter(Boolean).length)/2.3))+"s";
const clean=t=>(t||"").replace(/[*_]/g,"").replace(/\s+/g," ").trim();
function buildScenes(){
  const raw=(S.script.body||"");
  // 1) structured "Scene N / Narration: / Visual: / Text:" format from the AI prompt
  const blocks=[...raw.matchAll(/scene\s*\d+\b([\s\S]*?)(?=\n\s*scene\s*\d+\b|$)/gi)];
  const parsed=[];
  for(const b of blocks){
    const body=b[1];
    const visM=body.match(/visual\s*:\s*(.*)/i), txtM=body.match(/text\s*:\s*(.*)/i);
    const narM=body.match(/narration\s*:\s*([\s\S]*?)(?=\n\s*(?:visual|text)\s*:|$)/i);
    const nar=clean(narM?narM[1]:body.replace(/^\s*(?:visual|text)\s*:.*$/gim,""));
    if(!nar) continue;
    const sc={narration:nar,timing:estTiming(nar),overlay:clean(txtM?txtM[1]:"")};
    const kw=clean(visM?visM[1]:"").replace(/[.]/g,"");
    if(kw) sc.asset={kw:kw.slice(0,40)};
    parsed.push(sc);
  }
  if(parsed.length) return parsed;
  // 2) fallback: plain script → fewer, meaning-based scenes
  const text=raw.replace(/\[[^\]]*\]/g," ").replace(/\([^)]*\)/g," ").replace(/[*_]/g,"").replace(/\s+/g," ").trim();
  if(!text) return [emptyScene()];
  const sentences=text.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(s=>s.length>1);
  if(!sentences.length) return [emptyScene()];
  const target=S.idea.length==="short"?4:S.idea.length==="long"?9:6;
  const per=Math.max(1,Math.ceil(sentences.length/target));
  const scenes=[];
  for(let i=0;i<sentences.length;i+=per){ const chunk=sentences.slice(i,i+per).join(" "); scenes.push({narration:chunk,timing:estTiming(chunk),overlay:""}); }
  return scenes;
}
function renderScenes(){
  const box=el("sceneList"); if(!box)return;
  if(!S.scenes.length){ box.innerHTML=`<div class="empty">No scenes yet — build from your script.</div>`; return; }
  box.innerHTML=S.scenes.map((sc,i)=>`
    <div class="scene">
      <h4>Scene ${i+1} <button class="btn ghost sm" data-del="${i}">✕</button></h4>
      ${field("Narration line","scenes."+i+".narration","textarea")}
      <div class="row">
        ${field("Footage keyword","scenes."+i+".asset.kw","text","e.g. elephant herd")}
        ${field("On-screen text (optional)","scenes."+i+".overlay","text","short caption")}
        ${field("Seconds","scenes."+i+".timing","text","5s")}
      </div>
    </div>`).join("");
  bind(box);
  box.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{ S.scenes.splice(+b.dataset.del,1); clearMedia(); save(); renderScenes(); });
}

/* ===== 4 STUDIO (voice + footage + render) ===== */
const MEDIA={}; let AUDIO=null; let PREVIEW_RAF=null, RECORDING=false, previewAudio=null; let micRec=null, micChunks=[];
const sceneDuration=sc=>{ const m=String(sc?.timing||"").match(/([\d.]+)/); return m?Math.max(1,+m[1]):5; };
const dims=()=>S.studio.res==="1080"?[1920,1080]:[1280,720];
const sceneKeyword=i=>{ const sc=S.scenes[i]||{}; return sc.asset?.kw || topicWord(); };
function clearMedia(){ for(const k in MEDIA) delete MEDIA[k]; }

function stepStudio(){
  if(!S.scenes.length) return group("Voice & Video Studio",`
    <div class="row"><button class="btn ghost sm" id="pixKey">${S.studio.pixabayKey?"Pixabay key set ✓":"Add Pixabay key (free footage)"}</button></div>
    <div class="empty">Add your footage key above anytime. Then build scenes in <b>Storyboard</b> (step 3) to add footage per scene, record your voice, and render.</div>`);
  const c=S.studio.color;
  return group("Voice & Video Studio", `
    <div class="ph" style="border-color:var(--acc2);color:var(--acc2);background:rgba(0,208,163,.08)">✅ Only use footage you're allowed to: your own uploads or free Pixabay clips/photos.</div>
    <div class="row"><button class="btn ghost sm" id="pixKey">${S.studio.pixabayKey?"Pixabay key set ✓":"Add Pixabay key (free footage)"}</button></div>

    <div class="glabel" style="margin-top:6px">Record your voice</div>
    <div class="row">
      <button class="btn sm" id="micRec">● Record narration</button>
      <label class="btn sm" style="cursor:pointer">⬆ Upload voice track<input type="file" accept="audio/*" id="audioUp" hidden></label>
      <span class="note" id="audioName">${S.narration.audioName?("🎵 "+esc(S.narration.audioName)):"no voice yet"}</span>
    </div>
    ${adv("Or preview with robot voice (TTS)", `<div class="row">
      <label class="pill" style="cursor:pointer"><input type="checkbox" data-model="narration.tts" style="width:auto;margin-right:6px">Read script with TTS in preview</label>
      <select data-model="narration.voice" id="voiceSel" style="max-width:240px"></select>
      <button class="btn sm" id="ttsPreview">🔊 Test</button></div>
      <div class="note">TTS is preview-only — for sound in the downloaded file, record or upload a real voice.</div>`)}

    <div class="glabel" style="margin-top:16px">Footage per scene</div>
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

    <div class="glabel" style="margin-top:16px">Preview &amp; render</div>
    <canvas id="stCanvas" width="640" height="360" style="width:100%;max-width:640px;border-radius:12px;background:#0d0f1a;display:block"></canvas>
    <div class="row" style="margin-top:10px">
      <button class="btn" id="playBtn">▶ Preview</button>
      <button class="btn primary" id="exportBtn">🎬 Render &amp; download .webm</button>
    </div>
    <div class="ph" style="border-color:var(--warn)">Rendering runs in real time (a 60s video takes ~60s). Keep this tab visible while it renders.</div>
    <div class="note" id="exStatus"></div>
  `);
}
function wStudio(){
  const pk=el("pixKey"); if(pk) pk.onclick=()=>{ const k=prompt("Free Pixabay API key (pixabay.com → sign up → https://pixabay.com/api/docs shows your key). Stored locally only:",S.studio.pixabayKey||""); if(k!=null){ S.studio.pixabayKey=k.trim(); save(); render(); } };
  if(!S.scenes.length) return;
  renderAssets(); populateVoices();
  const tp=el("ttsPreview"); if(tp) tp.onclick=speakScript;
  el("audioUp").onchange=e=>{ const f=e.target.files[0]; if(f){ AUDIO={url:URL.createObjectURL(f),name:f.name}; S.narration.audioName=f.name; save(); el("audioName").textContent="🎵 "+f.name; } };
  el("micRec").onclick=e=>toggleRecord(e.target);
  el("playBtn").onclick=e=>previewPlay(e.target);
  el("exportBtn").onclick=e=>exportVideo(e.target);
  el("panel").querySelectorAll('input[type=range],select[data-model^="studio."],input[data-model="studio.kenburns"]').forEach(inp=>inp.addEventListener("input",()=>{ updateOuts(); drawStaticPreview(); }));
  ensureMedia().then(drawStaticPreview);
}
function updateOuts(){ el("panel")?.querySelectorAll("[data-out]").forEach(b=>{ const v=getPath(b.dataset.out); if(v!=null)b.textContent=v; }); }

function renderAssets(){
  const box=el("assets"); if(!box)return;
  box.innerHTML=S.scenes.map((sc,i)=>{
    const a=sc.asset||{}, ready=MEDIA[i]?.ready, thumb=a.thumb||(a.type==="image"?a.url:"");
    return `<div class="assetrow">
      <div class="athumb">${thumb?`<img src="${thumb}" alt="">`:"▶"}</div>
      <div class="ainfo">
        <b>Scene ${i+1}</b> <span class="note">${sceneDuration(sc)}s · ${esc((sc.overlay||sc.narration||"").slice(0,70))}</span>
        <div class="row" style="margin:8px 0 0">
          <input data-kw="${i}" placeholder="footage keyword" value="${esc(a.kw||sceneKeyword(i))}" style="max-width:190px">
          <button class="btn sm" data-find="${i}">🔍 Search</button>
          <button class="btn ghost sm" data-alt="${i}">🔀 Alternative</button>
          <label class="btn sm" style="cursor:pointer">⬆ Upload<input type="file" accept="image/*,video/*" data-up="${i}" hidden></label>
          ${(a.url||ready||a.name)?`<span class="pill ok">${esc(a.source||"asset")} ✓</span>`:""}
        </div>
        <div class="picks" id="picks-${i}"></div>
      </div></div>`;
  }).join("");
  box.querySelectorAll("[data-find]").forEach(b=>b.onclick=()=>stockSearch(+b.dataset.find,false));
  box.querySelectorAll("[data-alt]").forEach(b=>b.onclick=()=>stockSearch(+b.dataset.alt,true));
  box.querySelectorAll("[data-up]").forEach(inp=>inp.onchange=e=>{ const f=e.target.files[0]; if(f)uploadFile(+inp.dataset.up,f); });
  box.querySelectorAll("[data-kw]").forEach(inp=>inp.oninput=()=>{ setPath(`scenes.${inp.dataset.kw}.asset.kw`,inp.value); save(); });
}
async function stockSearch(i,alt){
  const box=el("picks-"+i), key=S.studio.pixabayKey.trim();
  const kw=(document.querySelector(`[data-kw="${i}"]`)?.value||sceneKeyword(i)).trim();
  setPath(`scenes.${i}.asset.kw`,kw); save();
  if(!key){ box.innerHTML=`<div class="ph">Add a free Pixabay key (button up top) to auto-find footage, or use <b>Upload</b>.</div>`; return; }
  box.innerHTML="Searching…";
  try{
    const page=alt?(1+Math.floor(Math.random()*6)):1;
    const u=`https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(kw)}&image_type=photo&safesearch=true&per_page=15&page=${page}`;
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
  const url=URL.createObjectURL(file), type=file.type.startsWith("video")?"video":"image", kw=S.scenes[i].asset?.kw||"";
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
async function ensureMedia(){ for(let i=0;i<S.scenes.length;i++){ const a=S.scenes[i].asset; if(a?.url && !MEDIA[i]?.ready) await loadMedia(i,a.url,a.type||"image"); } }

/* --- voice --- */
function populateVoices(){
  const sel=el("voiceSel"); if(!sel)return;
  const fill=()=>{ const vs=speechSynthesis.getVoices().filter(v=>/en/i.test(v.lang)); sel.innerHTML=vs.map(v=>`<option value="${esc(v.name)}">${esc(v.name)} (${v.lang})</option>`).join("")||`<option>default</option>`; if(S.narration.voice)sel.value=S.narration.voice; };
  fill(); speechSynthesis.onvoiceschanged=fill;
}
function utter(text){ const u=new SpeechSynthesisUtterance((text||"").replace(/\[[^\]]*\]/g," ").replace(/\([^)]*\)/g," ").replace(/[*_]/g,"")); const v=speechSynthesis.getVoices().find(v=>v.name===S.narration.voice); if(v)u.voice=v; u.rate=0.95; u.pitch=1.05; return u; }
function speakScript(){ try{ speechSynthesis.cancel(); speechSynthesis.speak(utter(S.script.body)); }catch(e){} }
function speakScene(i){ try{ speechSynthesis.cancel(); speechSynthesis.speak(utter(S.scenes[i].narration)); }catch(e){} }
async function toggleRecord(btn){
  if(micRec&&micRec.state==="recording"){ micRec.stop(); return; }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    micRec=new MediaRecorder(stream); micChunks=[];
    micRec.ondataavailable=e=>{ if(e.data.size)micChunks.push(e.data); };
    micRec.onstop=()=>{ const b=new Blob(micChunks,{type:"audio/webm"}); AUDIO={url:URL.createObjectURL(b),name:"my-narration.webm"}; S.narration.audioName=AUDIO.name; save(); stream.getTracks().forEach(t=>t.stop()); el("audioName").textContent="🎵 "+AUDIO.name; btn.textContent="● Record narration"; };
    micRec.start(); btn.textContent="■ Stop recording";
  }catch(e){ alert("Mic access failed: "+e.message); }
}

/* --- draw / preview / export --- */
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
  const c=S.studio.color, m=MEDIA[idx], zoom=S.studio.kenburns?1+0.08*p:1; let drew=false;
  if(m&&m.ready){ ctx.filter=`brightness(${c.b}%) contrast(${c.c}%) saturate(${c.s}%) sepia(${c.w}%)`; drew=coverDraw(ctx,m.el,W,H,zoom); ctx.filter="none"; }
  if(!drew){ ctx.fillStyle="#1b2140"; ctx.fillRect(0,0,W,H); ctx.fillStyle="#6c7bff"; ctx.textAlign="center"; ctx.font=`bold ${H*0.09}px system-ui`; ctx.fillText("Scene "+(idx+1),W/2,H*0.46); ctx.fillStyle="#9aa0bf"; ctx.font=`${H*0.035}px system-ui`; ctx.fillText("add footage",W/2,H*0.56); }
  const ov=S.scenes[idx]?.overlay||"";
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
  const durs=S.scenes.map(sceneDuration), total=durs.reduce((a,b)=>a+b,0); let last=-1;
  btn.textContent="■ Stop";
  if(AUDIO?.url){ previewAudio=new Audio(AUDIO.url); previewAudio.play().catch(()=>{}); }
  const start=performance.now();
  (function frame(now){
    const t=(now-start)/1000; if(t>=total){ previewStop(btn); return; }
    let acc=0,idx=0,p=0; for(let i=0;i<durs.length;i++){ if(t<acc+durs[i]){ idx=i; p=(t-acc)/durs[i]; break; } acc+=durs[i]; }
    if(idx!==last){ last=idx; if(S.narration.tts&&!AUDIO) speakScene(idx); }
    drawScene(ctx,W,H,idx,p); PREVIEW_RAF=requestAnimationFrame(frame);
  })(performance.now());
}
function previewStop(btn){ if(PREVIEW_RAF)cancelAnimationFrame(PREVIEW_RAF); PREVIEW_RAF=null; try{speechSynthesis.cancel();}catch(e){} if(previewAudio){previewAudio.pause();previewAudio=null;} if(btn)btn.textContent="▶ Preview"; drawStaticPreview(); }
async function exportVideo(btn){
  if(RECORDING)return; const status=el("exStatus");
  if(!S.scenes.length){ status.textContent="Build scenes first."; return; }
  RECORDING=true; btn.disabled=true; status.textContent="Preparing… loading footage";
  await ensureMedia();
  const [W,H]=dims(); const cv=document.createElement("canvas"); cv.width=W; cv.height=H; const ctx=cv.getContext("2d");
  const fps=+S.studio.fps||30; const stream=cv.captureStream(fps);
  let audioEl,actx;
  if(AUDIO?.url){ try{ audioEl=new Audio(); audioEl.src=AUDIO.url; actx=new (window.AudioContext||window.webkitAudioContext)(); const s=actx.createMediaElementSource(audioEl); const d=actx.createMediaStreamDestination(); s.connect(d); d.stream.getAudioTracks().forEach(t=>stream.addTrack(t)); }catch(e){} }
  const mimes=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"]; const mime=mimes.find(m=>MediaRecorder.isTypeSupported(m))||"video/webm";
  const rec=new MediaRecorder(stream,{mimeType:mime}); const chunks=[];
  rec.ondataavailable=e=>{ if(e.data.size)chunks.push(e.data); };
  const durs=S.scenes.map(sceneDuration), total=durs.reduce((a,b)=>a+b,0);
  rec.onstop=()=>{ const blob=new Blob(chunks,{type:mime}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="story-video.webm"; a.click(); URL.revokeObjectURL(a.href); RECORDING=false; btn.disabled=false; S.studio.exported=true; save(); status.textContent=`Done ✓ story-video.webm — ${(blob.size/1048576).toFixed(1)} MB, ${total.toFixed(0)}s`+(AUDIO?"":" (no audio — record a voice for sound)"); };
  rec.start(100);
  if(audioEl){ try{ await actx.resume(); audioEl.play(); }catch(e){} }
  const start=performance.now();
  await new Promise(done=>{ (function frame(now){ const t=(now-start)/1000; if(t>=total){ done(); return; } let acc=0,idx=0,p=0; for(let i=0;i<durs.length;i++){ if(t<acc+durs[i]){ idx=i; p=(t-acc)/durs[i]; break; } acc+=durs[i]; } drawScene(ctx,W,H,idx,p); status.textContent=`Rendering… ${Math.round(t/total*100)}%`; requestAnimationFrame(frame); })(performance.now()); });
  rec.stop(); if(audioEl)audioEl.pause();
}

/* ===== 5 PUBLISH ===== */
const CHECKS=[
  ["orig","Script & narration are original (written with AI from research — not copied)"],
  ["kid","Kid-safe, accurate, age-appropriate; 'Made for kids' set on YouTube"],
  ["visuals","All footage is your upload or free-license (Pixabay) — nothing ripped"],
  ["voice","Narration added (recorded or uploaded)"],
  ["meta","Title, description, tags & thumbnail ready"],
];
function stepPublish(){
  const r=S.studio.exported;
  return group("Publish", `
    <div class="ph" style="${r?"border-color:var(--ok);color:var(--ok);background:rgba(40,199,111,.08)":""}">${r?"🎬 Video rendered — <b>story-video.webm</b> is on your hard drive, ready to upload.":"⚠ Render your video in the <b>Studio</b> step first."}</div>
    <div class="glabel">Pre-flight checklist</div>
    <div style="margin:8px 0 16px">${CHECKS.map(([k,l])=>`<div class="check"><input type="checkbox" data-model="publish.checks.${k}"><span>${l}</span></div>`).join("")}</div>
    <div class="glabel">Metadata</div>
    ${field("Title","publish.title","text","e.g. Elephants for Kids! 🐘 Amazing Gentle Giants")}
    ${field("Description","publish.desc","textarea","2-3 friendly lines + a call to subscribe.")}
    ${field("Tags (comma separated)","publish.tags","text","elephants, kids learning, educational, animals")}
    ${field("Thumbnail idea","publish.thumb","text","Bright, one big elephant face, 2-3 words")}
    <div class="row" style="margin-top:12px"><button class="btn acc2" id="prepUpload">📦 Download upload package (JSON)</button></div>
    <div class="group" style="margin-top:16px">
      <div class="glabel">Upload to YouTube (do this yourself — safely)</div>
      <ul class="note" style="margin:0;padding-left:18px">
        <li>Go to studio.youtube.com → Create → Upload → pick <b>story-video.webm</b>.</li>
        <li>Set <b>“Made for kids”</b> — required by law for children's content.</li>
        <li>Paste your title / description / tags from above.</li>
        <li>One channel, steady schedule. Avoid posting duplicates across many channels — it risks termination.</li>
      </ul>
    </div>
  `);
}
function wPublish(){
  el("prepUpload").onclick=()=>download("upload-prep.json",{
    title:S.publish.title||S.idea.text||"Untitled",
    description:S.publish.desc,
    tags:(S.publish.tags||"").split(",").map(t=>t.trim()).filter(Boolean),
    thumbnailIdea:S.publish.thumb, madeForKids:true, script:S.script.body,
    scenes:S.scenes.map(s=>({narration:s.narration,timing:s.timing,keyword:s.asset?.kw||""})),
    videoFile:S.studio.exported?"story-video.webm":"not rendered yet"
  });
}

/* ---------- shared export ---------- */
function download(name,obj){
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href);
}
/* live range-label refresh */
document.addEventListener("input",e=>{ if(e.target.type==="range"){ const b=e.target.parentElement?.querySelector("b"); if(b)b.textContent=e.target.value; } });

/* ---------- helper panels ---------- */
const HELP=[
  `<h4>Idea</h4><ul><li>One clear topic + who it's for.</li><li>Pick age &amp; theme.</li><li>Build the brief, copy the prompt, ask Claude.</li></ul>`,
  `<h4>Script</h4><ul><li>Paste the script you like from Claude.</li><li>Keep it original &amp; simple.</li><li>Use ✕ Clear to start over.</li></ul>`,
  `<h4>Storyboard</h4><ul><li>Imports scenes + footage keywords from the AI script.</li><li>Tweak narration, keyword, caption, seconds.</li><li>These drive the Studio footage search.</li></ul>`,
  `<h4>Studio</h4><ul><li>Record your voice.</li><li>Footage per scene: Search / Alternative / Upload.</li><li>Grade &amp; render .webm.</li></ul>`,
  `<h4>Publish</h4><ul><li>Run the checklist.</li><li>Fill metadata.</li><li>One channel, steady pace.</li></ul>`,
];

render();
