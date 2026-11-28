/* part 7: automation — envelopes for mixer + device parameters, lanes in the Arrangement, recording, override / re-enable */
window.LV_CSS2=(window.LV_CSS2||"")+
'.lvEnv{position:absolute;inset:0;z-index:3;cursor:crosshair;touch-action:none}.lvEnv svg{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}'+
'.lvAutoMode .lvAC{pointer-events:none;opacity:.45}.lvALane{position:relative;border-bottom:1px solid #111;display:flex;background:#1a1a1a}'+
'.lvLH select{width:100%;font-size:10px;padding:1px;background:#1b1b1b}.lvLH .ab{display:flex;gap:3px;align-items:center}.lvLH .ab button{background:#3a3a3a;border:1px solid #111;border-radius:2px;font-size:10px;padding:0 5px;height:17px}'+
'.lvKnob.auto svg,.lvFader.auto .hd{filter:drop-shadow(0 0 2px #ff4b4b)}.lvKnob.auto:after{content:"";display:block;width:5px;height:5px;border-radius:50%;background:#ff4b4b;margin:1px auto 0}.lvKnob.ovr:after{background:#777}';
/* ---- parameters a track can automate ---- */
function lvParams(t){var S=LV.set;if(t===S.master)return [{id:"vol",nm:"Volume",min:-70,max:6,u:"dB"}];
  var L=[{id:"vol",nm:"Mixer: Volume",min:-70,max:6,u:"dB"},{id:"pan",nm:"Mixer: Pan",min:-1,max:1,u:""},{id:"sA",nm:"Mixer: Send A",min:0,max:1,u:""},{id:"sB",nm:"Mixer: Send B",min:0,max:1,u:""}];
  (t.devs||[]).forEach(function(d){var D=LV_DEVS[d.type];D.ps.forEach(function(p){if(p[7]||p[0]==="decay")return;L.push({id:"d:"+d.id+":"+p[0],nm:D.nm+": "+p[1],min:p[2],max:p[3],u:p[5],log:!!p[6]&&p[2]>0,dev:d.id,k:p[0]});});});return L;}
function lvParam(t,pid){return lvParams(t).find(function(p){return p.id===pid;})||null;}
function lvBase(t,pid){if(pid==="vol")return t.vol;if(pid==="pan")return t.pan;if(pid==="sA")return t.sendA;if(pid==="sB")return t.sendB;var q=pid.split(":"),d=(t.devs||[]).find(function(x){return x.id===q[1];});return d?(d.p&&d.p[q[2]]!=null?d.p[q[2]]:lvDevDefaults(d.type)[q[2]]):0;}
function lvNorm(P,v){if(P.id==="vol")return lvDbToFader(v);if(P.log)return Math.log(v/P.min)/Math.log(P.max/P.min);return (v-P.min)/(P.max-P.min);}
function lvDenorm(P,n){n=Math.max(0,Math.min(1,n));if(P.id==="vol")return lvFaderToDb(n);if(P.log)return P.min*Math.pow(P.max/P.min,n);return P.min+n*(P.max-P.min);}
function lvFmtP(P,v){if(P.id==="vol")return lvDb(v)+" dB";if(P.id==="pan")return lvPanTxt(v);if(P.id==="sA"||P.id==="sB")return v<=0.001?"-inf dB":(20*Math.log10(v)).toFixed(1)+" dB";return (Math.abs(v)>=100?Math.round(v):Math.abs(v)>=10?v.toFixed(1):v.toFixed(2))+(P.u?" "+P.u:"");}
/* ---- envelopes ---- */
function lvEnvAt(pts,b){if(!pts.length)return 0;if(b<=pts[0].b)return pts[0].v;var n=pts.length;if(b>=pts[n-1].b)return pts[n-1].v;
  for(var i=1;i<n;i++){if(b<pts[i].b){var a=pts[i-1],c=pts[i],span=c.b-a.b;return span<=1e-9?c.v:a.v+(c.v-a.v)*(b-a.b)/span;}}return pts[n-1].v;}
function lvAutoActive(t,pid){var A=t&&t.auto&&t.auto[pid];if(!A||!A.pts||!A.pts.length||A.ovr)return false;if(A.hold&&Date.now()-A.hold<350)return false;return true;}
function lvDevAutoKeys(t,d){var out=[];if(!t.auto)return out;Object.keys(t.auto).forEach(function(pid){if(pid.indexOf("d:"+d.id+":")===0&&lvAutoActive(t,pid))out.push(pid.split(":")[2]);});return out;}
function lvAutoSort(A){A.pts.sort(function(x,y){return x.b-y.b;});}
function lvAnyOvr(){var S=LV.set,any=false;S.tracks.concat([S.master]).forEach(function(t){Object.keys(t.auto||{}).forEach(function(k){if(t.auto[k].ovr&&t.auto[k].pts.length)any=true;});});return any;}
function lvReEnableAuto(){var S=LV.set;S.tracks.concat([S.master]).forEach(function(t){Object.keys(t.auto||{}).forEach(function(k){t.auto[k].ovr=false;});});lvMixParams(lvEngine(),S);lvSave();lvRender();lvStatus("Automation re-enabled.");}
/* schedule every active envelope across arrangement beats [aA,aB) — timeOf(b) gives the audio-clock time */
function lvAutoCore(M,S,aA,aB,timeOf){var step=0.0625;S.tracks.concat([S.master]).forEach(function(t){var isM=t===S.master,T=isM?null:M.tr[t.id];if(!isM&&!T)return;var devs={};
  Object.keys(t.auto||{}).forEach(function(pid){if(!lvAutoActive(t,pid))return;var pts=t.auto[pid].pts,bs=[aA];for(var b=Math.floor(aA/step+1)*step;b<aB-1e-6;b+=step)bs.push(b);bs.push(aB);
    if(pid.indexOf("d:")===0){var q=pid.split(":");(devs[q[1]]=devs[q[1]]||{}).k=(devs[q[1]].k||[]).concat([[q[2],pts]]);devs[q[1]].bs=bs;return;}
    var par=pid==="vol"?(isM?M.masterF.gain:T.f.gain):pid==="pan"?T.pan.pan:pid==="sA"?T.sA.gain:T.sB.gain,conv=pid==="vol"?lvDbGain:function(x){return x;};
    bs.forEach(function(b,i){var tm=timeOf(b),v=conv(lvEnvAt(pts,b));if(!isFinite(v))return;if(i===0){try{par.cancelScheduledValues(tm);}catch(e){}par.setValueAtTime(v,tm);}else par.linearRampToValueAtTime(v,tm);});});
  Object.keys(devs).forEach(function(did){var D=T&&T.devs.find(function(x){return x.id===did;}),d=(t.devs||[]).find(function(x){return x.id===did;});if(!D||!d)return;var info=devs[did];
    info.bs.forEach(function(b,i){var p=Object.assign(lvDevDefaults(d.type),d.p);info.k.forEach(function(kp){p[kp[0]]=lvEnvAt(kp[1],b);});LV_SVT=timeOf(b);LV_SVF=i===0;try{D.set(p,S.bpm);}catch(e){}LV_SVT=null;LV_SVF=false;});});});}
function lvAutoApply(gA,gB){if(gB<=0)return;if(gA<0)gA=0;var aA=lvA(gA),aB=aA+(gB-gA);lvAutoCore(lvEngine(),LV.set,aA,aB,function(b){return lvTime(gA+(b-aA));});}
/* offline export: run the envelopes over the whole render */
(function(){var orig=lvRenderOffline;lvRenderOffline=function(a0,a1){var S=LV.set,keys=[];S.tracks.forEach(function(t){t.arr.forEach(function(x){if(x.clip.audio)keys.push(x.clip.audio.key);});});
  return Promise.all(keys.map(lvLoadAudio)).then(function(){var sr=44100,bpm=S.bpm,dur=(a1-a0)*60/bpm+2.5,OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext,oc=new OAC(2,Math.ceil(dur*sr),sr),M=lvMixBuild(oc,S,oc.destination);
    var X={a:oc,M:M,voices:[],bpm:bpm,time:function(g){return Math.max(0,g)*60/bpm;},live:false},span=a1-a0;lvAutoCore(M,S,a0,a1,function(b){return Math.max(0,(b-a0)*60/bpm);});
    S.tracks.forEach(function(t){t.arr.forEach(function(x){if(x.on===false)return;var cs=x.start-a0,ce=cs+x.len;if(ce<=0||cs>=span)return;lvSchedClip(X,t,x.clip,cs-(x.off||0),Math.max(0,cs),Math.min(span,ce),0,span,{},[],"o"+x.id);});});
    return oc.startRendering();});};})();
/* a control was moved by hand: record it (Automation Arm + Arrangement Record) or override the envelope like Live does */
function lvAutoTouch(t,pid,v){if(!t)return;var A=t.auto&&t.auto[pid];if(LVT.playing&&LVT.rec&&LV.autoArm&&LVT.recStartA!=null){t.auto=t.auto||{};A=t.auto[pid]=t.auto[pid]||{pts:[]};A.ovr=false;A.hold=Date.now();
    var now=lvNowA(),key=(t.id||"master")+pid,last=LVT.autoRec&&LVT.autoRec[key]!=null?LVT.autoRec[key]:now-0.001;LVT.autoRec=LVT.autoRec||{};A.pts=A.pts.filter(function(p){return !(p.b>last&&p.b<=now+0.0625);});A.pts.push({b:now,v:v});lvAutoSort(A);LVT.autoRec[key]=now;LV.autoDirty=true;return;}
  if(A&&A.pts&&A.pts.length&&!A.ovr){A.ovr=true;lvStatus("Automation overridden for "+(lvParam(t,pid)||{nm:pid}).nm+" — press ⟲ Auto to re-enable.");lvRenderTopSoon();}}
var lvRTS=null;function lvRenderTopSoon(){if(lvRTS)return;lvRTS=setTimeout(function(){lvRTS=null;lvRenderTop();},60);}
/* ---- Arrangement automation lanes ---- */
function lvAutoSel(t){return t.autoSel||"vol";}
function lvEnvSvg(t,P,W,h){var A=t.auto&&t.auto[P.id],pts=A&&A.pts||[],z=LV.zoom,y=function(v){return 3+(1-lvNorm(P,v))*(h-6);},col=A&&A.ovr?"#888":"#ff4b4b";
  if(!pts.length){var yv=y(lvBase(t,P.id));return '<svg width="'+W+'" height="'+h+'"><line x1="0" y1="'+yv+'" x2="'+W+'" y2="'+yv+'" stroke="#aa3a3a" stroke-dasharray="4 4" stroke-width="1"/></svg>';}
  var d="M0 "+y(pts[0].v).toFixed(1);pts.forEach(function(p){d+=" L"+(p.b*z).toFixed(1)+" "+y(p.v).toFixed(1);});d+=" L"+W+" "+y(pts[pts.length-1].v).toFixed(1);
  return '<svg width="'+W+'" height="'+h+'"><path d="'+d+'" stroke="'+col+'" stroke-width="1.6" fill="none"/>'+pts.map(function(p,i){return '<circle cx="'+(p.b*z).toFixed(1)+'" cy="'+y(p.v).toFixed(1)+'" r="'+(LV.envSel&&LV.envSel.t===t&&LV.envSel.i===i?4.5:3.5)+'" fill="'+col+'" stroke="#111"/>';}).join("")+'</svg>';}
function lvParamSelect(t,cur,attr){return '<select '+attr+'>'+lvParams(t).map(function(p){var on=t.auto&&t.auto[p.id]&&t.auto[p.id].pts.length;return '<option value="'+p.id+'"'+(p.id===cur?' selected':'')+'>'+(on?"● ":"")+lvEsc(p.nm)+'</option>';}).join("")+'</select>';}
/* extend the Arrangement renderer: automation-mode button, envelope overlays, extra lanes */
(function(){var orig=lvRenderArr;lvRenderArr=function(){orig();var S=LV.set,sc=document.getElementById("lvArrSc");if(!sc)return;var tools=document.querySelector(".lvArrTools");
  if(tools&&!document.getElementById("lvAutoB")){var b=document.createElement("button");b.className="lvB"+(LV.autoMode?" on":"");b.id="lvAutoB";b.title="Automation Mode (A) — show and edit envelopes";b.textContent="Automation";tools.insertBefore(b,tools.children[3]);b.onclick=function(){LV.autoMode=!LV.autoMode;lvRender();};}
  sc.classList.toggle("lvAutoMode",!!LV.autoMode);if(!LV.autoMode)return;var z=LV.zoom;
  sc.querySelectorAll("[data-lane]").forEach(function(el){var ti=+el.dataset.lane,t=S.tracks[ti],h=el.parentNode.clientHeight;lvEnvLayer(el,t,lvAutoSel(t),h);
    var hd=sc.querySelector('[data-lh="'+ti+'"]');if(hd){var row=document.createElement("div");row.className="ab";row.innerHTML=lvParamSelect(t,lvAutoSel(t),'data-ps="'+ti+'" style="flex:1"')+'<button data-al="'+ti+'" title="Show another automation lane">+</button>';hd.appendChild(row);
      row.querySelector("select").onchange=function(e){t.autoSel=e.target.value;lvSave();lvRender();};row.querySelector("button").onclick=function(){t.autoLanes=t.autoLanes||[];var used=[lvAutoSel(t)].concat(t.autoLanes),nx=lvParams(t).find(function(p){return used.indexOf(p.id)<0;});if(nx){t.autoLanes.push(nx.id);lvSave();lvRender();}};}
    /* extra lanes under the track */
    var after=el.parentNode;(t.autoLanes||[]).forEach(function(pid,li){var P=lvParam(t,pid);if(!P)return;var lane=document.createElement("div");lane.className="lvALane";lane.style.height="40px";var W=parseFloat(el.style.width);
      lane.innerHTML='<div class="lvLaneC" style="width:'+W+'px;'+el.getAttribute("style").replace(/width:[^;]+;/,"")+'"></div><div class="lvLH" style="padding:2px 4px"><div class="ab">'+lvParamSelect(t,pid,'style="flex:1"')+'<button title="Hide lane">✕</button></div></div>';after.parentNode.insertBefore(lane,after.nextSibling);after=lane;
      lane.querySelector("select").onchange=function(e){t.autoLanes[li]=e.target.value;lvSave();lvRender();};lane.querySelector("button").onclick=function(){t.autoLanes.splice(li,1);lvSave();lvRender();};lvEnvLayer(lane.firstChild,t,pid,40);});});
  /* master volume lane */
  var lanes=sc.querySelectorAll(".lvLane"),ml=lanes[lanes.length-1];if(ml){ml.style.height="44px";lvEnvLayer(ml.firstChild,S.master,"vol",44);}};})();
function lvEnvLayer(el,t,pid,h){var P=lvParam(t,pid);if(!P)return;var W=parseFloat(el.style.width)||el.clientWidth,z=LV.zoom,lay=document.createElement("div");lay.className="lvEnv";lay.innerHTML=lvEnvSvg(t,P,W,h);el.appendChild(lay);
  var yv=function(v){return 3+(1-lvNorm(P,v))*(h-6);},vy=function(y){return lvDenorm(P,1-(y-3)/(h-6));},A=function(){t.auto=t.auto||{};return t.auto[pid]=t.auto[pid]||{pts:[]};};
  var paint=function(){lay.innerHTML=lvEnvSvg(t,P,W,h);},lastTap={t:0,i:-1};
  lvLongPress(lay,function(x,y){lvMenu(x,y,[{t:"Clear envelope",f:function(){lvCommit("Clear envelope");if(t.auto)delete t.auto[pid];lvMixParams(lvEngine(),LV.set);lvSave();lvRender();}},
    {t:"Clear inside loop brace",f:function(){var L=LV.set.loop,en=t.auto&&t.auto[pid];if(!en)return;lvCommit("Clear automation");en.pts=en.pts.filter(function(p){return p.b<L.s||p.b>L.s+L.l;});lvSave();lvRender();}},
    {t:"Add ramp over loop brace (low → high)",f:function(){var L=LV.set.loop,en=A();lvCommit("Ramp");en.pts=en.pts.filter(function(p){return p.b<L.s||p.b>L.s+L.l;});en.pts.push({b:L.s,v:lvDenorm(P,0.1)},{b:L.s+L.l,v:lvDenorm(P,0.9)});lvAutoSort(en);en.ovr=false;lvSave();lvRender();}}]);});
  lay.addEventListener("pointerdown",function(e){if(e.button===2||lay._lp)return;e.stopPropagation();var r=lay.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,b=x/z,en=t.auto&&t.auto[pid],pts=en?en.pts:[],hit=-1;
    for(var i=0;i<pts.length;i++){if(Math.abs(pts[i].b*z-x)<8&&Math.abs(yv(pts[i].v)-y)<8){hit=i;break;}}
    var now=Date.now();if(hit>=0&&now-lastTap.t<350&&lastTap.i===hit){lvCommit("Delete breakpoint");pts.splice(hit,1);lvSave();paint();lastTap={t:0,i:-1};lvMixParams(lvEngine(),LV.set);return;}
    try{lay.setPointerCapture(e.pointerId);}catch(z2){}lvCommit("Automation");var E=A();E.ovr=false;
    if(LV.draw){var g=lvGridBeats(),draw=function(xx,yy){var cb=Math.floor(Math.max(0,xx/z)/g)*g,v=vy(yy);E.pts=E.pts.filter(function(p){return p.b<cb||p.b>=cb+g;});E.pts.push({b:cb,v:v},{b:cb+g-0.001,v:v});lvAutoSort(E);paint();lvStatus(P.nm+": "+lvFmtP(P,v));};draw(x,y);
      lay.onpointermove=function(ev){draw(ev.clientX-r.left,ev.clientY-r.top);};lay.onpointerup=function(){lay.onpointermove=null;lvSave();lvMixParams(lvEngine(),LV.set);if(LV.view==="arr")lvRender();};return;}
    var pt;if(hit>=0){pt=E.pts[hit];lastTap={t:now,i:hit};}else{pt={b:e.altKey?b:lvSnap(b),v:vy(y)};E.pts.push(pt);lvAutoSort(E);lastTap={t:now,i:E.pts.indexOf(pt)};}LV.envSel={t:t,i:E.pts.indexOf(pt)};paint();lvStatus(P.nm+": "+lvFmtP(P,pt.v)+" at "+lvPos(pt.b));
    var x0=e.clientX,y0=e.clientY,b0=pt.b,v0=yv(pt.v);
    lay.onpointermove=function(ev){var dx=ev.clientX-x0,dy=ev.clientY-y0;var nb=b0+dx/z;pt.b=Math.max(0,ev.altKey||ev.shiftKey?nb:lvSnap(nb));pt.v=vy(Math.max(3,Math.min(h-3,v0+dy*(ev.shiftKey?0.25:1))));lvAutoSort(E);LV.envSel={t:t,i:E.pts.indexOf(pt)};paint();lvStatus(P.nm+": "+lvFmtP(P,pt.v)+" at "+lvPos(pt.b));};
    lay.onpointerup=function(){lay.onpointermove=null;lvSave();lvMixParams(lvEngine(),LV.set);};});}
/* knobs + faders: show automation state and offer Show Automation */
(function(){var oK=lvKnob;lvKnob=function(el,o){if(!o.auto){oK(el,o);return;}var t=o.auto[0],pid=o.auto[1],mark=function(){var A=t.auto&&t.auto[pid];el.classList.toggle("auto",!!(A&&A.pts&&A.pts.length));el.classList.toggle("ovr",!!(A&&A.ovr));};
    var set0=o.set,g0=o.get;o.set=function(v){lvAutoTouch(t,pid,v);set0(v);mark();};o.get=function(){return lvAutoActive(t,pid)&&LVT.playing?lvEnvAt(t.auto[pid].pts,lvNowA()):g0();};oK(el,o);mark();lvLongPress(el,function(x,y){lvAutoMenu(t,pid,x,y);});};
  var oF=lvFader;lvFader=function(el,o){if(o.auto){var t=o.auto[0],pid=o.auto[1],s0=o.set,g0=o.get;o.set=function(v){lvAutoTouch(t,pid,v);s0(v);el.classList.toggle("auto",lvAutoActive(t,pid));};o.get=function(){var A=t.auto&&t.auto[pid];return A&&A.pts.length&&!A.ovr&&LVT.playing?lvEnvAt(A.pts,lvNowA()):g0();};
      lvLongPress(el,function(x,y){lvAutoMenu(t,pid,x,y);});}oF(el,o);if(o.auto)el.classList.toggle("auto",lvAutoActive(o.auto[0],o.auto[1]));};})();
function lvAutoMenu(t,pid,x,y){var S=LV.set,A=t.auto&&t.auto[pid],P=lvParam(t,pid);lvMenu(x,y,[{t:"Show Automation",f:function(){if(t!==S.master){LV.sel.t=S.tracks.indexOf(t);t.autoSel=pid;}LV.view="arr";LV.autoMode=true;lvRender();}},
  {t:"Delete Automation",f:function(){if(!A)return;lvCommit("Delete automation");delete t.auto[pid];lvMixParams(lvEngine(),S);lvSave();lvRender();}},{t:"Re-Enable Automation",f:lvReEnableAuto}].concat(P?[{t:"Value: "+lvFmtP(P,lvBase(t,pid)),f:function(){}}]:[]));}
/* hook mixer and device knobs so they know which envelope they drive */
(function(){var oB=lvBindMixers;lvBindMixers=function(root){var S=LV.set,keep=lvKnob,keepF=lvFader;
  /* temporarily wrap so each strip's controls carry their track + parameter */
  root.querySelectorAll("[data-mix]").forEach(function(m){m._t=S.tracks[+m.dataset.mix];});
  lvKnob=function(el,o){var m=el.closest("[data-mix]");if(m&&m._t)o.auto=[m._t,el.dataset.k==="pan"?"pan":el.dataset.k==="sendA"?"sA":"sB"];keep(el,o);};
  lvFader=function(el,o){var m=el.closest("[data-mix]"),ms=el.closest("[data-mst]");if(m&&m._t)o.auto=[m._t,"vol"];else if(ms)o.auto=[S.master,"vol"];keepF(el,o);};
  try{oB(root);}finally{lvKnob=keep;lvFader=keepF;}};})();
(function(){var oD=lvDevView;lvDevView=function(body,t){var keep=lvKnob;lvKnob=function(el,o){var dv=el.closest("[data-dv]");if(dv){var d=t.devs[+dv.dataset.dv],P=LV_DEVS[d.type].ps.find(function(p){return p[1]===o.label;});if(P&&P[0]!=="decay")o.auto=[t,"d:"+d.id+":"+P[0]];}keep(el,o);};try{oD(body,t);}finally{lvKnob=keep;}};})();
/* top bar: Automation Arm + Re-Enable Automation */
(function(){var oT=lvRenderTop;lvRenderTop=function(){oT();var rb=document.getElementById("lvSRec");if(!rb)return;var aa=document.createElement("button");aa.className="lvB rec"+(LV.autoArm?" on":"");aa.id="lvAArm";aa.title="Automation Arm — record knob and fader moves while Arrangement Record is on";aa.textContent="⤳";rb.parentNode.insertBefore(aa,rb.nextSibling);
  aa.onclick=function(){LV.autoArm=!LV.autoArm;lvRenderTop();lvStatus(LV.autoArm?"Automation Arm on — press ● and move knobs or faders to record them.":"Automation Arm off");};
  if(lvAnyOvr()){var re=document.createElement("button");re.className="lvB on";re.id="lvReAuto";re.title="Re-Enable Automation";re.textContent="⟲ Auto";var u=document.getElementById("lvUndo");if(u&&u.parentNode)u.parentNode.parentNode.insertBefore(re,u.parentNode);re.onclick=lvReEnableAuto;}};})();
/* A toggles automation mode (like Live); recorded moves get tidied when recording stops */
document.addEventListener("keydown",function(e){if(!document.getElementById("lv"))return;var tag=e.target&&e.target.tagName;if(tag==="INPUT"||tag==="SELECT"||tag==="TEXTAREA"||e.metaKey||e.ctrlKey||e.altKey)return;if(LV.keysOn)return;
  if(e.key==="a"||e.key==="A"){LV.autoMode=!LV.autoMode;if(LV.autoMode)LV.view="arr";lvStatus(LV.autoMode?"Automation Mode on — click a lane to add breakpoints, drag to move, double-click to delete, ✏ Draw paints steps":"Automation Mode off");lvRender();}
  if((e.key==="Delete"||e.key==="Backspace")&&LV.autoMode&&LV.envSel){var A=LV.envSel.t.auto,pid=LV.envSel.t.autoSel||"vol";if(A&&A[pid]&&A[pid].pts[LV.envSel.i]){e.stopImmediatePropagation();lvCommit("Delete breakpoint");A[pid].pts.splice(LV.envSel.i,1);LV.envSel=null;lvSave();lvRender();}}},true);
(function(){var oS=lvRecStop;lvRecStop=function(){oS();if(LV.autoDirty){LV.autoDirty=false;LVT.autoRec={};var S=LV.set;S.tracks.concat([S.master]).forEach(function(t){Object.keys(t.auto||{}).forEach(function(k){var A=t.auto[k];A.hold=0;
  /* thin recorded points: drop ones that sit on a straight line between neighbours */
  if(A.pts.length>3){var out=[A.pts[0]];for(var i=1;i<A.pts.length-1;i++){var a=out[out.length-1],b=A.pts[i],c=A.pts[i+1],P=lvParam(t,k);if(!P){out.push(b);continue;}var pred=lvNorm(P,a.v)+(lvNorm(P,c.v)-lvNorm(P,a.v))*(b.b-a.b)/Math.max(1e-6,c.b-a.b);if(Math.abs(pred-lvNorm(P,b.v))>0.012)out.push(b);}out.push(A.pts[A.pts.length-1]);A.pts=out;}});});lvSave();lvRender();}};})();

/* keep automated knobs and faders moving with their envelopes during playback */
setInterval(function(){if(!LVT.playing||!document.getElementById("lv"))return;document.querySelectorAll(".lvKnob.auto,.lvFader.auto").forEach(function(el){if(el._paint&&!el._d)el._paint();});},120);
