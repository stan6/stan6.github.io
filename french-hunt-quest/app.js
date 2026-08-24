
const D=window.FHQ_DATA;
const KEY="fhq_pwa_state_v1";
const initial={introSeen:false,xp:0,completed:[],discovered:[],photos:{},customChapters:[]};
let state=load(); let screen=state.introSeen?"home":"intro"; let selected=null; let introPage=0; let deferredInstall=null;

function load(){try{return {...initial,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return {...initial}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function word(id){return D.words.find(w=>w.id===id)}
function mission(id){return D.missions.find(m=>m.id===id)}
function getLocation(id){return D.locations.find(l=>l.id===id)}
function esc(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function speak(text){if(!("speechSynthesis"in window))return; speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="fr-FR";u.rate=.82;speechSynthesis.speak(u)}
function setScreen(s,arg=null){screen=s;selected=arg;render();window.scrollTo({top:0,behavior:"smooth"})}

function topbar(back=false){return `<header class="topbar">${back?`<button class="back" onclick="goHome()">‹</button>`:`<div class="brand">🗺️ French Hunt Quest</div>`}<div class="xp">⭐ ${state.xp} XP</div></header>`}
function nav(active="home"){return `<nav class="bottomnav"><button class="navbtn ${active==="home"?"active":""}" onclick="goHome()">🏕️<br>Adventure</button><button class="navbtn ${active==="learn"?"active":""}" onclick="setScreen('categories')">📚<br>Learn</button><button class="navbtn ${active==="chest"?"active":""}" onclick="setScreen('chest')">🧰<br>Chest</button></nav>`}
function shell(body,active="home",back=false){return `<div class="shell">${topbar(back)}<main class="content">${body}</main>${nav(active)}<div id="install" class="install"><b>📱 Take your adventure with you!</b><div style="margin-top:6px;font-size:14px;opacity:.9">Add French Hunt Quest to your Home Screen for an app-like experience.</div><div style="display:flex;gap:8px;margin-top:10px"><button onclick="installPWA()">Add to Home Screen</button><button onclick="document.getElementById('install').classList.remove('show')" style="background:transparent;color:white;border:1px solid #ffffff88">Later</button></div></div></div>`}

function render(){
 const app=document.getElementById("app");
 if(screen==="intro") return renderIntro(app);
 if(screen==="home") return app.innerHTML=shell(renderHome());
 if(screen==="chapter") return app.innerHTML=shell(renderChapter(selected), "home",true);
 if(screen==="mission") return app.innerHTML=shell(renderMission(selected), "home",true);
 if(screen==="capture") return app.innerHTML=shell(renderCapture(selected), "home",true);
 if(screen==="found") return app.innerHTML=shell(renderFound(selected), "home",false);
 if(screen==="story") return app.innerHTML=shell(renderStory(selected), "home",true);
 if(screen==="chest") return app.innerHTML=shell(renderChest(),"chest");
 if(screen==="categories") return app.innerHTML=shell(renderCategories(),"learn");
 if(screen==="category") return app.innerHTML=shell(renderCategory(selected),"learn",true);
 if(screen==="custom") return app.innerHTML=shell(renderCustom(),"home",true);
}

function renderIntro(app){
 const imgs=["intro.png","find-treasure.png","learn-french.png","create-adventure.png"];
 const labels=["Let's Start!","Next","Next","Start My Adventure!"];
 app.innerHTML=`<div class="intro"><img src="assets/${imgs[introPage]}" alt="French Hunt Quest introduction"><div class="dots">${imgs.map((_,i)=>`<span class="dot ${i===introPage?"on":""}"></span>`).join("")}</div><button class="btn primary introBtn" onclick="nextIntro()">${labels[introPage]}</button></div>`;
}
function nextIntro(){if(introPage<3){introPage++;renderIntro(document.getElementById("app"))}else{state.introSeen=true;save();screen="home";render();}}

function renderHome(){
 const completed=new Set(state.completed);
 const custom=state.customChapters||[];
 const lastBuilt=D.locations[D.locations.length-1];
 const canCustom=completed.has(lastBuilt.missionId)&&(custom.length===0||custom.at(-1).completedAt);
 let html=`<div class="hero"><div style="font-size:55px">🗺️</div><h1>My Adventure</h1><p>Find treasures, learn French, and build your own adventure story.</p></div>`;
 html+=`<div class="card"><b>Adventure Progress</b><div style="display:flex;justify-content:space-between;margin:8px 0;color:var(--muted)"><span>${completed.size} missions complete</span><strong>${state.xp} XP</strong></div><div class="progressbar"><span style="width:${Math.min(100,completed.size/(D.locations.length)*100)}%"></span></div></div>`;
 D.locations.forEach((l,i)=>{
   const done=completed.has(l.missionId), unlocked=i===0||completed.has(D.locations[i-1].missionId);
   html+=`<button class="chapter ${done?"current":""} ${unlocked?"":"locked"}" ${unlocked?`onclick="setScreen('chapter','${l.id}')"`:""}><div class="emoji">${l.emoji}</div><div><h3>Chapter ${i+1}: ${l.title}</h3><p>${esc(l.subtitle)}</p></div><div class="status">${done?"✅":unlocked?"›":"🔒"}</div></button>`;
 });
 custom.forEach(c=>html+=`<button class="chapter current" onclick="setScreen('custom')"><div class="emoji">✨</div><div><h3>Chapter ${c.chapterNumber}: ${esc(c.title)}</h3><p>${c.collected}/3 treasures found</p></div><div class="status">${c.completedAt?"✅":"›"}</div></button>`);
 if(canCustom) html+=`<button class="btn gold" onclick="newCustom()">✨ Create My Next Adventure</button>`;
 return html;
}

function renderChapter(id){
 const l=getLocation(id), m=mission(l.missionId), s=D.stories.find(x=>x.missionId===m.id), done=state.completed.includes(m.id);
 return `<div class="story-title"><div class="big">${l.emoji}</div><h1>${esc(l.title)}</h1><p>${esc(l.subtitle)}</p></div>
 <div class="card"><h2>${esc(s?.title||m.title)}</h2>${s?`<div class="language-card fr"><h3>🇫🇷 Français</h3><div class="story-text">${esc(s.frenchText)}</div></div><div class="language-card en"><h3>🇬🇧 English</h3><div class="story-text">${esc(s.englishText)}</div></div>`:""}</div>
 <div class="card"><h3>💎 Mission</h3><p>${esc(m.description)}</p><p><b>⭐ ${m.xpReward} XP</b></p><button class="btn primary" onclick="setScreen('mission','${m.id}')">${done?"Review Mission":"Start Treasure Hunt"} 🔎</button>${done?`<button class="btn secondary" onclick="setScreen('story','${m.id}')">Read Mission Story 📖</button>`:""}</div>`;
}

function renderMission(id){
 const m=mission(id);

 if(!m){
   return `<div class="card">
     <h2>Mission not found</h2>
     <p>Sorry, we couldn't find this treasure hunt.</p>
     <button class="btn primary" onclick="goHome()">Back to Adventure</button>
   </div>`;
 }

 const found=m.wordIds.filter(x=>state.discovered.includes(x)).length;
 const done=state.completed.includes(id);

 return `<div class="hero">
   <div style="font-size:52px">${m.emoji||"🔎"}</div>
   <h1>${esc(m.title)}</h1>
   <p>${esc(m.description)}</p>
 </div>

 <div class="card">
   <div style="display:flex;justify-content:space-between">
     <b>🔎 Progress</b>
     <b>${found}/${m.wordIds.length}</b>
   </div>

   <div class="progressbar" style="margin:10px 0">
     <span style="width:${m.wordIds.length ? found/m.wordIds.length*100 : 0}%"></span>
   </div>

   <p>${done
     ?"🏆 Amazing! You found every treasure."
     :"Find each treasure and take a photo or draw it."
   }</p>
 </div>

 ${m.wordIds.map(wordId=>{
   const w=word(wordId);

   // Protect the UI if the data contains an invalid word ID.
   if(!w){
     console.error("French Hunt Quest: word not found:", wordId, "in mission:", id);

     return `<div class="card" style="border:2px solid #e8b4b4">
       <b>⚠️ Treasure data missing</b>
       <p>Word ID: <code>${esc(String(wordId))}</code></p>
     </div>`;
   }

   const d=state.discovered.includes(wordId);

   return `
     <div class="word">
       <div>
         <strong>${esc(w.article||"")} ${esc(w.french)}</strong>
         <small>${esc(w.english||"")} · ${esc(w.clue||"")}</small>
       </div>

       <button class="listen"
         onclick="speak('${esc(w.french)}')">
         🔊
       </button>
     </div>

     ${d
       ? `<div style="text-align:right;color:var(--green);font-weight:800">
            ✓ Found
          </div>`
       : `<button class="btn blue"
            onclick="setScreen('capture','${wordId}|${wordId}')">
            Find ${esc(w.french)} 📸
          </button>`
     }
   `;
 }).join("")}`;
}

function renderCapture(key){
 const [wordId]=key.split("|"),w=word(wordId), existing=state.photos[wordId];
 return `<div class="hero"><div style="font-size:48px">🔎</div><h1>Find: ${esc(w.french)}</h1><p>${esc(w.english)} — ${esc(w.clue||"Look around you!")}</p><button class="btn secondary" onclick="speak('${esc(w.french)}')">🔊 Hear ${esc(w.french)}</button></div>
 <div class="card">${existing?`<img class="photo-preview" src="${existing}" alt="Treasure"><p style="text-align:center;color:var(--green);font-weight:800">Treasure saved!</p>`:`<div class="empty">Take a photo of the treasure, or draw it.</div>`}
 <input id="camera" class="file-input" type="file" accept="image/*" capture="environment" onchange="photoChosen(event,'${wordId}')">
 <input id="gallery" class="file-input" type="file" accept="image/*" onchange="photoChosen(event,'${wordId}')">
 <div class="camera-actions"><button class="btn primary" onclick="document.getElementById('camera').click()">📸 Take Photo</button><button class="btn secondary" onclick="document.getElementById('gallery').click()">🖼️ Choose Photo</button></div>
 <button class="btn gold" onclick="openDrawing('${wordId}')">✏️ Draw It</button></div>`;
}
function photoChosen(e,id){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{state.photos[id]=r.result;state.discovered=[...new Set([...state.discovered,id])];save();completeIfNeeded(id);setScreen('found',id)};r.readAsDataURL(f)}
function openDrawing(id){
 const w=word(id); document.getElementById("app").innerHTML=shell(`<div class="hero"><div style="font-size:45px">✏️</div><h1>Draw: ${esc(w.french)}</h1><p>${esc(w.english)}</p></div><div class="card"><canvas id="draw" style="width:100%;height:360px;background:white;border-radius:18px;touch-action:none;border:2px solid #eadfc8"></canvas><button class="btn secondary" onclick="clearCanvas()">Clear</button><button class="btn primary" onclick="saveDrawing('${id}')">Save Drawing</button></div>`,"home",true);initCanvas();}
let ctx,canvas,drawing=false;
function initCanvas(){canvas=document.getElementById("draw");canvas.width=canvas.clientWidth*2;canvas.height=canvas.clientHeight*2;ctx=canvas.getContext("2d");ctx.scale(2,2);ctx.lineWidth=4;ctx.lineCap="round";canvas.onpointerdown=e=>{drawing=true;ctx.beginPath();ctx.moveTo(e.offsetX,e.offsetY)};canvas.onpointermove=e=>{if(drawing){ctx.lineTo(e.offsetX,e.offsetY);ctx.stroke()}};canvas.onpointerup=()=>drawing=false;canvas.onpointerleave=()=>drawing=false}
function clearCanvas(){ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight)}
function saveDrawing(id){state.photos[id]=canvas.toDataURL("image/png");state.discovered=[...new Set([...state.discovered,id])];save();completeIfNeeded(id);setScreen("found",id)}
function completeIfNeeded(wordId){const m=D.missions.find(m=>m.wordIds.includes(wordId));if(!m)return; if(m.wordIds.every(id=>state.discovered.includes(id))&&!state.completed.includes(m.id)){state.completed.push(m.id);state.xp+=m.xpReward;save();}}
function renderFound(id){const w=word(id),m=D.missions.find(m=>m.wordIds.includes(id));const done=m&&state.completed.includes(m.id);return `<div class="hero"><div style="font-size:70px">🎉</div><h1>Treasure Found!</h1><p><b>${esc(w.french)}</b> means <b>${esc(w.english)}</b>.</p><button class="btn secondary" onclick="speak('${esc(w.french)}')">🔊 Say it in French</button></div><div class="card">${state.photos[id]?`<img class="photo-preview" src="${state.photos[id]}" alt="Your treasure">`:""}<h3 style="text-align:center">${done?"🏆 Mission Complete!":"🌟 Great job!"}</h3>${done?`<p style="text-align:center">⭐ +${m.xpReward} XP</p>`:""}</div><button class="btn primary" onclick="setScreen('mission','${m.id}')">Continue Hunt →</button><button class="btn secondary" onclick="goHome()">Back to Adventure</button>`}
function renderStory(id){const s=D.stories.find(x=>x.missionId===id),m=mission(id);return `<div class="story-title"><div class="big">📖</div><h1>${esc(s.title)}</h1></div><div class="language-card fr"><h3>🇫🇷 Français</h3><div class="story-text">${esc(s.frenchText)}</div></div><div class="language-card en"><h3>🇬🇧 English</h3><div class="story-text">${esc(s.englishText)}</div></div><div class="card"><h3>💎 New Words</h3>${s.vocabulary.map(v=>`<span style="display:inline-block;background:#fff;border-radius:999px;padding:8px 10px;margin:4px">${esc(v)}</span>`).join("")}</div><button class="btn gold" onclick="setScreen('chest')">🧰 Open Treasure Chest</button>`}
function renderChest(){const found=Object.keys(state.photos);return `<div class="hero"><div style="font-size:65px">🧰</div><h1>Treasure Chest</h1><p>Your adventure memories and French treasures.</p></div><div class="card"><h2>⭐ ${state.xp} XP</h2><p>${state.discovered.length} treasures discovered.</p></div>${found.length?`<div class="grid">${found.map(id=>`<div class="card" style="margin:0;padding:8px"><img class="photo-preview" style="height:140px" src="${state.photos[id]}"><div style="padding:7px"><b>${esc(word(id)?.french||"Treasure")}</b><br><small>${esc(word(id)?.english||"")}</small></div></div>`).join("")}</div>`:`<div class="empty">Your treasure chest is waiting for its first discovery! 💎</div>`}`}

function renderCategories(){const cats=[["NATURE","🌿","Nature"],["HOME","🏠","Home"],["FOOD","🍎","Food"],["COLORS","🎨","Colors"],["EMOTIONS","😊","Emotions"],["TRANSPORTATION","🧭","Directions"]];return `<div class="hero"><div style="font-size:50px">📚</div><h1>Learn French</h1><p>Explore words before you hunt for them.</p></div><div class="grid">${cats.map(([id,e,n])=>`<button class="choice" onclick="setScreen('category','${id}')"><span class="e">${e}</span><strong>${n}</strong><small>${D.words.filter(w=>w.category===id).length} words</small></button>`).join("")}</div>`}
function renderCategory(cat){const labels={NATURE:"🌿 Nature Explorer",HOME:"🏠 Home Explorer",FOOD:"🍎 Food Explorer",COLORS:"🎨 Color Explorer",EMOTIONS:"😊 Feelings",TRANSPORTATION:"🧭 Directions"};const ws=D.words.filter(w=>w.category===cat);return `<div class="hero"><div style="font-size:44px">${labels[cat]?.split(" ")[0]||"📚"}</div><h1>${esc(labels[cat]?.replace(/^\\S+ /,"")||"Words")}</h1></div>${ws.map(w=>`<div class="word"><div><strong>${esc(w.article||"")} ${esc(w.french)}</strong><small>${esc(w.english)}${w.clue?" · "+esc(w.clue):""}</small></div><button class="listen" onclick="speak('${esc(w.french)}')">🔊</button></div>`).join("")}`}

function newCustom(){state.customDraft={characterId:"kid",characterName:"",favoritePlace:"",story:"",treasures:[{french:"",english:"",media:null},{french:"",english:"",media:null},{french:"",english:"",media:null}]};save();setScreen("custom")}
function renderCustom(){
 const c=state.customDraft||{characterId:"kid",characterName:"",favoritePlace:"",story:"",treasures:[{},{},{}]};
 return `<div class="hero"><div style="font-size:52px">✨</div><h1>Create My Adventure</h1><p>Make a new chapter with exactly three French treasures.</p></div>
 <div class="card"><h3>1. Choose your explorer</h3><div class="grid">${[["girl","👧"],["boy","👦"],["kid","🧒"],["artist","🎨"]].map(([id,e])=>`<button class="choice ${c.characterId===id?"selected":""}" onclick="draftChar('${id}')"><span class="e">${e}</span><strong>Explorer</strong></button>`).join("")}</div><input class="field" style="margin-top:12px" placeholder="Explorer's name" value="${esc(c.characterName)}" oninput="draftField('characterName',this.value)"></div>
 <div class="card"><h3>2. Favorite place</h3><input class="field" placeholder="e.g. the park" value="${esc(c.favoritePlace)}" oninput="draftField('favoritePlace',this.value)"></div>
 <div class="card"><h3>3. Write your story</h3><textarea class="field" placeholder="Write your adventure here..." oninput="draftField('story',this.value)">${esc(c.story)}</textarea></div>
 <div class="card"><h3>4. Choose 3 French treasures</h3>${c.treasures.map((t,i)=>`<div style="padding:12px 0;border-bottom:1px solid #eadfc8"><b>Treasure ${i+1}</b><input class="field" style="margin-top:8px" placeholder="French word (e.g. arbre)" value="${esc(t.french||"")}" oninput="draftTreasure(${i},'french',this.value)"><input class="field" style="margin-top:8px" placeholder="English meaning" value="${esc(t.english||"")}" oninput="draftTreasure(${i},'english',this.value)"><input class="file-input" id="ct${i}" type="file" accept="image/*" capture="environment" onchange="draftMedia(event,${i})"><button class="btn secondary" onclick="document.getElementById('ct${i}').click()">${t.media?"✓ Change photo":"📸 Add photo/drawing"}</button></div>`).join("")}</div>
 <button class="btn primary" onclick="saveCustom()">Save My Chapter ✨</button>`;
}
function draftChar(v){state.customDraft.characterId=v;save();render()}
function draftField(k,v){state.customDraft[k]=v;save()}
function draftTreasure(i,k,v){state.customDraft.treasures[i][k]=v;save()}
function draftMedia(e,i){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{state.customDraft.treasures[i].media=r.result;save();render()};r.readAsDataURL(f)}
function saveCustom(){const c=state.customDraft;if(!c.characterName||!c.favoritePlace||!c.story||c.treasures.some(t=>!t.french||!t.english||!t.media)){alert("Please complete the explorer, place, story, and all 3 treasures.");return}const n=(state.customChapters||[]).length+8;const ch={id:"custom_"+Date.now(),chapterNumber:n,title:`${c.characterName}'s Adventure`,characterId:c.characterId,characterName:c.characterName,favoritePlace:c.favoritePlace,story:c.story,treasures:c.treasures,collected:0,completedAt:null};state.customChapters=[...(state.customChapters||[]),ch];delete state.customDraft;save();goHome()}
function goHome(){screen="home";selected=null;render()}
window.goHome=goHome;window.setScreen=setScreen;window.nextIntro=nextIntro;window.speak=speak;window.photoChosen=photoChosen;window.openDrawing=openDrawing;window.clearCanvas=clearCanvas;window.saveDrawing=saveDrawing;window.newCustom=newCustom;window.draftChar=draftChar;window.draftField=draftField;window.draftTreasure=draftTreasure;window.draftMedia=draftMedia;window.saveCustom=saveCustom;

if("serviceWorker"in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;setTimeout(()=>document.getElementById("install")?.classList.add("show"),1800)});
async function installPWA(){if(deferredInstall){deferredInstall.prompt();deferredInstall=null}else{alert("On iPhone: tap Share ↑, then choose “Add to Home Screen”.")}}
window.installPWA=installPWA;
render();
