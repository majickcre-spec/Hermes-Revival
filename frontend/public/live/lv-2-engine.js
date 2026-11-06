/* part 2: audio engine — mixer, returns, devices, instruments, transport, clip launching, recording */
var LVB={},LVBload={},LVPEAK={};
function lvLoadAudio(key){if(LVB[key])return Promise.resolve(LVB[key]);if(LVBload[key])return LVBload[key];
  return LVBload[key]=idbGet(key).then(function(b){if(!b)return null;return (b.arrayBuffer?b.arrayBuffer():Promise.resolve(b));}).then(function(ab){if(!ab)return null;return new Promise(function(res,rej){ac().decodeAudioData(ab.slice?ab.slice(0):ab,res,rej);});})
    .then(function(buf){delete LVBload[key];if(buf)LVB[key]=buf;return buf;}).catch(function(){delete LVBload[key];return null;});}
function lvPeaks(key,n){var b=LVB[key];if(!b)return null;var ck=key+":"+n;if(LVPEAK[ck])return LVPEAK[ck];var d=b.getChannelData(0),step=Math.max(1,Math.floor(d.length/n)),out=new Float32Array(n);
  for(var i=0;i<n;i++){var m=0,s=i*step,e=Math.min(d.length,s+step);for(var j=s;j<e;j+=4){var v=Math.abs(d[j]);if(v>m)m=v;}out[i]=m;}LVPEAK[ck]=out;return out;}
function lvIR(a,dur,decay){var rate=a.sampleRate,len=Math.max(1,Math.floor(rate*dur)),b=a.createBuffer(2,len,rate);for(var ch=0;ch<2;ch++){var d=b.getChannelData(ch);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay);}return b;}
/* ---------- devices ---------- */
/* every device parameter goes through lvSv so automation can schedule it on the audio clock */
var LV_SVT=null,LV_SVF=false;
function lvSv(par,v){if(!isFinite(v))return;if(LV_SVT!=null){if(LV_SVF){try{par.cancelScheduledValues(LV_SVT);}catch(e){}par.setValueAtTime(v,LV_SVT);}else par.linearRampToValueAtTime(v,LV_SVT);}else{try{par.cancelScheduledValues(0);}catch(e){}par.value=v;}}
function lvDevDefaults(type){var p={};LV_DEVS[type].ps.forEach(function(x){p[x[0]]=x[4];});return p;}
function lvDW(a){var o={in:a.createGain(),out:a.createGain(),dry:a.createGain(),wet:a.createGain()};o.in.connect(o.dry);o.dry.connect(o.out);o.wet.connect(o.out);o.mix=function(m){lvSv(o.dry.gain,Math.cos(m*Math.PI/2));lvSv(o.wet.gain,Math.sin(m*Math.PI/2));};return o;}
function lvSatCurve(type){var n=2048,c=new Float32Array(n);for(var i=0;i<n;i++){var x=i/(n-1)*2-1,y;x*=3;
    if(type===1)y=Math.abs(x)<1?Math.sin(x*Math.PI/2):Math.sign(x)*(1-0.15*Math.min(1,Math.abs(x)-1));else if(type===2)y=Math.max(-1,Math.min(1,x*1.2));else y=Math.tanh(x);c[i]=y;}return c;}
function lvDevBuild(a,dev,bpm){var t=dev.type,p=dev.p,D={in:a.createGain(),out:a.createGain()};
  if(t==="eq8"){var hp=a.createBiquadFilter(),ls=a.createBiquadFilter(),pk=a.createBiquadFilter(),hs=a.createBiquadFilter();hp.type="highpass";ls.type="lowshelf";pk.type="peaking";hs.type="highshelf";
    D.in.connect(hp);hp.connect(ls);ls.connect(pk);pk.connect(hs);hs.connect(D.out);D.filters=[hp,ls,pk,hs];
    D.set=function(p){lvSv(hp.frequency,p.f1);lvSv(hp.Q,0.71);lvSv(ls.gain,p.g2);lvSv(ls.frequency,p.f2);lvSv(pk.gain,p.g3);lvSv(pk.frequency,p.f3);lvSv(pk.Q,p.q3);lvSv(hs.gain,p.g4);lvSv(hs.frequency,p.f4);};}
  else if(t==="eq3"){var l=a.createBiquadFilter(),m=a.createBiquadFilter(),h=a.createBiquadFilter();l.type="lowshelf";m.type="peaking";h.type="highshelf";D.in.connect(l);l.connect(m);m.connect(h);h.connect(D.out);D.filters=[l,m,h];
    D.set=function(p){lvSv(l.frequency,p.flo);lvSv(l.gain,p.lo);lvSv(h.frequency,p.fhi);lvSv(h.gain,p.hi);lvSv(m.frequency,Math.sqrt(p.flo*p.fhi));lvSv(m.Q,0.5);lvSv(m.gain,p.mid);};}
  else if(t==="filter"){var f=a.createBiquadFilter(),lfo=a.createOscillator(),lg=a.createGain();lfo.connect(lg);lg.connect(f.frequency);lfo.start();D.in.connect(f);f.connect(D.out);D.osc=[lfo];D.filters=[f];
    D.set=function(p){f.type=["lowpass","highpass","bandpass"][p.type|0];lvSv(f.frequency,p.freq);lvSv(f.Q,p.res);lvSv(lfo.frequency,p.rate);lvSv(lg.gain,p.freq*0.9*p.lfo/100);};}
  else if(t==="comp"){var c=a.createDynamicsCompressor(),g=a.createGain();D.in.connect(c);c.connect(g);g.connect(D.out);D.comp=c;
    D.set=function(p){lvSv(c.threshold,p.th);lvSv(c.ratio,p.ratio);lvSv(c.attack,p.att/1000);lvSv(c.release,p.rel/1000);lvSv(c.knee,p.knee);lvSv(g.gain,lvDbGain(p.out));};}
  else if(t==="glue"){var w=lvDW(a),c2=a.createDynamicsCompressor(),mk2=a.createGain();D.in.connect(w.in);w.in.connect(c2);c2.connect(mk2);mk2.connect(w.wet);w.out.connect(D.out);D.comp=c2;
    D.set=function(p){lvSv(c2.threshold,p.th);lvSv(c2.ratio,[2,4,10][p.ratio|0]);lvSv(c2.knee,3);lvSv(c2.attack,p.att/1000);lvSv(c2.release,p.rel);lvSv(mk2.gain,lvDbGain(p.make));w.mix(p.mix/100);};}
  else if(t==="sat"){var w3=lvDW(a),pre=a.createGain(),ws=a.createWaveShaper(),post=a.createGain();ws.oversample="4x";D.in.connect(w3.in);w3.in.connect(pre);pre.connect(ws);ws.connect(post);post.connect(w3.wet);w3.out.connect(D.out);var lastT=-1;
    D.set=function(p){if((p.type|0)!==lastT){lastT=p.type|0;ws.curve=lvSatCurve(lastT);}lvSv(pre.gain,lvDbGain(p.drive)/3);lvSv(post.gain,lvDbGain(p.out)*Math.max(1,3/Math.max(1,lvDbGain(p.drive)*0.6)));w3.mix(p.mix/100);};}
  else if(t==="util"){var sp=a.createChannelSplitter(2),mg=a.createChannelMerger(2),ll=a.createGain(),rl=a.createGain(),rr=a.createGain(),lr=a.createGain(),gg=a.createGain();
    D.in.connect(gg);gg.connect(sp);sp.connect(ll,0);sp.connect(lr,0);sp.connect(rr,1);sp.connect(rl,1);ll.connect(mg,0,0);rl.connect(mg,0,0);rr.connect(mg,0,1);lr.connect(mg,0,1);mg.connect(D.out);
    D.set=function(p){var w=p.mono>0.5?0:p.width/100,bl=Math.min(1,1-p.bal/50),br=Math.min(1,1+p.bal/50),sl=p.phl>0.5?-1:1,sr=p.phr>0.5?-1:1;lvSv(gg.gain,lvDbGain(p.gain));
      lvSv(ll.gain,(1+w)/2*bl*sl);lvSv(rl.gain,(1-w)/2*bl*sr);lvSv(rr.gain,(1+w)/2*br*sr);lvSv(lr.gain,(1-w)/2*br*sl);};}
  else if(t==="delay"){var w4=lvDW(a),dl=a.createDelay(4),fb=a.createGain(),lp=a.createBiquadFilter();lp.type="lowpass";D.in.connect(w4.in);w4.in.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(w4.wet);w4.out.connect(D.out);
    D.set=function(p,b){var beats=[0.125,0.25,0.5,0.75,1,1.5,2][p.sync|0];lvSv(dl.delayTime,Math.min(3.9,beats*60/(b||bpm||120)));lvSv(fb.gain,p.fb/100);lvSv(lp.frequency,p.flt);w4.mix(p.mix/100);};}
  else if(t==="reverb"){var w5=lvDW(a),pd=a.createDelay(1),cv=a.createConvolver(),tn=a.createBiquadFilter();tn.type="lowpass";D.in.connect(w5.in);w5.in.connect(pd);pd.connect(cv);cv.connect(tn);tn.connect(w5.wet);w5.out.connect(D.out);var lastD=-1;
    D.set=function(p){if(Math.abs(p.decay-lastD)>0.05){lastD=p.decay;cv.buffer=lvIR(a,Math.min(10,p.decay),2.6);}lvSv(pd.delayTime,p.pre/1000);lvSv(tn.frequency,p.tone);w5.mix(p.mix/100);};}
  else if(t==="chorus"){var w6=lvDW(a),d1=a.createDelay(0.1),d2=a.createDelay(0.1),o1=a.createOscillator(),o2=a.createOscillator(),g1=a.createGain(),g2=a.createGain(),pl=a.createStereoPanner(),pr=a.createStereoPanner();
    lvSv(pl.pan,-0.7);lvSv(pr.pan,0.7);o1.connect(g1);g1.connect(d1.delayTime);o2.connect(g2);g2.connect(d2.delayTime);o1.start();o2.start();D.osc=[o1,o2];
    D.in.connect(w6.in);w6.in.connect(d1);w6.in.connect(d2);d1.connect(pl);d2.connect(pr);pl.connect(w6.wet);pr.connect(w6.wet);w6.out.connect(D.out);
    D.set=function(p){lvSv(o1.frequency,p.rate);lvSv(o2.frequency,p.rate*1.13);lvSv(d1.delayTime,0.012);lvSv(d2.delayTime,0.018);lvSv(g1.gain,0.006*p.amt/100);lvSv(g2.gain,0.007*p.amt/100);w6.mix(p.mix/100);};}
  else{D.in.connect(D.out);D.set=function(){};}
  D.set(Object.assign(lvDevDefaults(t),p),bpm);return D;}
/* ---------- the mixer graph (used live and for offline export) ---------- */
function lvMixBuild(a,S,dest){var M={a:a,tr:{},ret:{}};M.masterIn=a.createGain();M.masterF=a.createGain();M.lim=a.createDynamicsCompressor();M.lim.threshold.value=-1;M.lim.knee.value=0;M.lim.ratio.value=20;M.lim.attack.value=0.002;M.lim.release.value=0.12;
  M.an=a.createAnalyser();M.an.fftSize=512;M.masterIn.connect(M.masterF);M.masterF.connect(M.lim);M.lim.connect(M.an);M.lim.connect(dest);
  var rA={in:a.createGain(),f:a.createGain(),p:a.createStereoPanner(),an:a.createAnalyser()},cv=a.createConvolver();cv.buffer=lvIR(a,2.4,2.4);var hc=a.createBiquadFilter();hc.type="lowpass";hc.frequency.value=7500;rA.in.connect(cv);cv.connect(hc);hc.connect(rA.f);
  var rB={in:a.createGain(),f:a.createGain(),p:a.createStereoPanner(),an:a.createAnalyser()},dl=a.createDelay(4),fb=a.createGain(),lp=a.createBiquadFilter();lp.type="lowpass";lp.frequency.value=4200;fb.gain.value=0.38;rB.in.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(rB.f);rB.dl=dl;
  [rA,rB].forEach(function(r){r.an.fftSize=256;r.f.connect(r.p);r.p.connect(r.an);r.p.connect(M.masterIn);});M.ret.A=rA;M.ret.B=rB;
  S.tracks.forEach(function(t){lvTrackBuild(M,t,S);});lvMixParams(M,S);return M;}
function lvTrackBuild(M,t,S){var a=M.a,T={in:a.createGain(),pan:a.createStereoPanner(),f:a.createGain(),act:a.createGain(),an:a.createAnalyser(),sA:a.createGain(),sB:a.createGain(),devs:[],sig:""};
  T.an.fftSize=256;T.pan.connect(T.f);T.f.connect(T.act);T.act.connect(T.an);T.act.connect(M.masterIn);T.act.connect(T.sA);T.act.connect(T.sB);T.sA.connect(M.ret.A.in);T.sB.connect(M.ret.B.in);
  M.tr[t.id]=T;lvChainBuild(M,t,S);return T;}
function lvChainSig(t){return (t.devs||[]).map(function(d){return d.id+(d.on===false?"-":"+");}).join(",");}
function lvChainBuild(M,t,S){var T=M.tr[t.id],a=M.a;try{T.in.disconnect();}catch(e){}T.devs.forEach(function(D){try{D.out.disconnect();}catch(e){}(D.osc||[]).forEach(function(o){try{o.stop();}catch(e){}});});T.devs=[];
  var last=T.in;(t.devs||[]).forEach(function(d){if(d.on===false)return;var D=lvDevBuild(a,d,S.bpm);D.id=d.id;last.connect(D.in);last=D.out;T.devs.push(D);});last.connect(T.pan);T.sig=lvChainSig(t);}
function lvMixParams(M,S){var anySolo=S.tracks.some(function(t){return t.solo;}),now=M.a.currentTime;
  var live=M.a===(typeof AC!=="undefined"?AC:null)||(typeof ac==="function"&&M.a===ac()),play=live&&LVT.playing,pos=live?lvNowA():0;
  var mp=function(t,pid,par,base,conv){var A=typeof lvAutoActive==="function"&&lvAutoActive(t,pid);if(A&&play)return;var v=A?lvEnvAt(t.auto[pid].pts,pos):base;try{par.cancelScheduledValues(0);}catch(e){}par.setTargetAtTime(conv?conv(v):v,now,0.015);};
  S.tracks.forEach(function(t){var T=M.tr[t.id];if(!T)return;if(T.sig!==lvChainSig(t))lvChainBuild(M,t,S);
    T.devs.forEach(function(D){var d=(t.devs||[]).find(function(x){return x.id===D.id;});if(!d)return;var auto=typeof lvDevAutoKeys==="function"?lvDevAutoKeys(t,d):[];if(auto.length&&play)return;var p=Object.assign(lvDevDefaults(d.type),d.p);auto.forEach(function(k){p[k]=lvEnvAt(t.auto["d:"+d.id+":"+k].pts,pos);});D.set(p,S.bpm);});
    mp(t,"vol",T.f.gain,t.vol,lvDbGain);mp(t,"pan",T.pan.pan,t.pan);T.act.gain.setTargetAtTime(t.on&&(!anySolo||t.solo)?1:0,now,0.01);
    mp(t,"sA",T.sA.gain,t.sendA);mp(t,"sB",T.sB.gain,t.sendB);});
  S.returns.forEach(function(r){var R=M.ret[r.id];R.f.gain.setTargetAtTime(r.on?lvDbGain(r.vol):0,now,0.015);R.p.pan.setTargetAtTime(r.pan||0,now,0.015);});
  M.ret.B.dl.delayTime.setTargetAtTime(Math.min(3.9,0.75*60/S.bpm),now,0.05);mp(S.master,"vol",M.masterF.gain,S.master.vol,lvDbGain);}
/* ---------- instruments ---------- */
var LVE={M:null,voices:[]};
function lvEngine(){var a=ac();if(!LVE.M||LVE.M.a!==a){LVE.M=lvMixBuild(a,LV.set,a.destination);}return LVE.M;}
function lvEngineSync(){var M=lvEngine(),S=LV.set;S.tracks.forEach(function(t){if(!M.tr[t.id])lvTrackBuild(M,t,S);});
  Object.keys(M.tr).forEach(function(id){if(!S.tracks.some(function(t){return t.id===id;})){try{M.tr[id].act.disconnect();}catch(e){}delete M.tr[id];}});lvMixParams(M,S);lvPreload();}
function lvPreload(){var S=LV.set;S.tracks.forEach(function(t){if(t.inst&&t.inst.indexOf("sf:")===0){try{sfLoadInst(t.inst.slice(3));}catch(e){}}if(t.inst&&t.inst.indexOf("dr:acoustic")===0){try{drsLoad();}catch(e){}}
  var cl=t.slots.concat(t.arr.map(function(x){return x.clip;}));cl.forEach(function(c){if(c&&c.audio&&c.audio.key&&!LVB[c.audio.key])lvLoadAudio(c.audio.key);});});}
function lvVoice(X,src,g,end){X.voices.push({s:src,g:g,end:end});}
function lvPlayNote(X,t,m,when,dur,vel){var a=X.a,T=X.M.tr[t.id];if(!T||!t.inst)return;var out=T.in,v=Math.max(0.05,Math.min(1.27,(vel||100)/100)),inst=t.inst;
  if(inst.indexOf("dr:")===0){var dm=LV_DRUMMAP[m];if(!dm)return;var id=dm[0],kit=inst.slice(3),g=a.createGain();g.gain.value=v;g.connect(out);
    try{if(kit==="acoustic"&&typeof DRS!=="undefined"&&(DRS.buf[id]||(id==="floor"&&DRS.buf.tom2))){var s=a.createBufferSource();s.buffer=DRS.buf[id]||DRS.buf.tom2;if(id==="floor")s.playbackRate.value=0.82;s.connect(g);s.start(when);lvVoice(X,s,g,when+s.buffer.duration);return;}
      if(id==="rim"){var o=a.createOscillator(),og=a.createGain();o.type="triangle";o.frequency.value=1700;og.gain.setValueAtTime(0.5,when);og.gain.exponentialRampToValueAtTime(0.001,when+0.05);o.connect(og);og.connect(g);o.start(when);o.stop(when+0.06);return;}
      if(kit==="808"&&typeof E808!=="undefined"&&E808[id]){E808[id](a,g,when);return;}if(typeof DKV!=="undefined"&&DKV[id]){DKV[id](a,g,when);return;}if(typeof E808!=="undefined"&&E808[id])E808[id](a,g,when);}catch(e){}return;}
  if(inst.indexOf("sf:")===0){var key=inst.slice(3);if(typeof SF!=="undefined"&&SF.ready&&SF.ready[key]&&sfOn()){var anc=sfNearest(key,m);if(anc!=null&&SF.buf[key][anc]){var s2=a.createBufferSource();s2.buffer=SF.buf[key][anc];s2.playbackRate.value=Math.pow(2,(m-anc)/12);
      var g2=a.createGain(),peak=0.9*v,rel=Math.max(0.06,dur),tail=(SF.ring&&SF.ring[key])||0.6;g2.gain.setValueAtTime(0.0001,when);g2.gain.exponentialRampToValueAtTime(peak,when+0.006);g2.gain.setValueAtTime(peak,when+rel);g2.gain.exponentialRampToValueAtTime(0.0008,when+rel+tail);
      s2.connect(g2);g2.connect(out);s2.start(when);s2.stop(when+rel+tail+0.1);lvVoice(X,s2,g2,when+rel+tail);return;}}else{try{sfLoadInst(key);}catch(e){}}
    inst="syn:square";}
  var P=Object.assign({},LV_SYN[inst.slice(4)]||LV_SYN.square,t.syn||{}),f=440*Math.pow(2,(m-69)/12),fl=a.createBiquadFilter(),eg=a.createGain();fl.type="lowpass";fl.frequency.value=Math.min(18000,P.cut*(0.6+v*0.6));fl.Q.value=P.res;fl.connect(eg);eg.connect(out);
  var pk=0.32*v,end=when+Math.max(0.03,dur);eg.gain.setValueAtTime(0.0001,when);eg.gain.linearRampToValueAtTime(pk,when+P.a);eg.gain.setTargetAtTime(pk*P.s+0.0001,when+P.a,Math.max(0.01,P.d/3));
  eg.gain.setValueAtTime(Math.max(0.0001,pk*P.s),end);eg.gain.setTargetAtTime(0.0001,end,Math.max(0.01,P.r/4));
  (P.det?[-P.det,P.det]:[0]).forEach(function(dt){var o=a.createOscillator();o.type=P.w;o.frequency.value=f;o.detune.value=dt;o.connect(fl);o.start(when);o.stop(end+P.r+0.1);lvVoice(X,o,eg,end+P.r);});}
/* ---------- transport ---------- */
var LVT={playing:false,t0:0,g0:0,maps:[],pass:0,timer:null,lastG:0,regions:[],arrSrc:[],X:null,rec:false,recStartA:null,recMidi:{},cap:null,pre:false,sessRec:false,lastClick:-1};
function lvBpm(){return LV.set.bpm;}
function lvG(time){return LVT.g0+(time-LVT.t0)*lvBpm()/60;}
function lvTime(g){return LVT.t0+(g-LVT.g0)*60/lvBpm();}
function lvA(g){var m=LVT.maps[0]||{g:0,a:0};for(var i=0;i<LVT.maps.length;i++)if(LVT.maps[i].g<=g)m=LVT.maps[i];return m.a+(g-m.g);}
function lvNowG(){return lvG(ac().currentTime);}
function lvNowA(){return LVT.playing?lvA(lvNowG()):LV.insert;}
function lvLiveX(){var M=lvEngine();if(!LVT.X||LVT.X.M!==M)LVT.X={a:M.a,M:M,voices:LVE.voices,time:lvTime,live:true};return LVT.X;}
function lvSetBpm(b){b=Math.max(20,Math.min(999,Math.round(b*100)/100));if(LVT.playing){var now=ac().currentTime,g=lvG(now);LV.set.bpm=b;LVT.t0=now;LVT.g0=g;}else LV.set.bpm=b;lvMixParams(lvEngine(),LV.set);lvSave();}
function lvPlay(fromA,preBars){unlockAudio();var a=ac();lvEngineSync();if(LVT.playing)lvStopAll(true);var pre=(preBars||0)*LV.set.sig;
  LVT.t0=a.currentTime+0.08;LVT.g0=-pre;LVT.maps=[{g:-pre,a:fromA-pre}];LVT.pass=0;LVT.lastG=-pre-0.0001;LVT.regions=[];LVT.arrSrc=[];LVT.playing=true;LVT.pre=pre>0;LVT.lastClick=-999;
  LV.set.tracks.forEach(function(t){t.arrOff=false;});clearInterval(LVT.timer);LVT.timer=setInterval(lvTick,25);lvTick();lvUiTransport();}
function lvStopAll(keepPos){var a=ac();if(LVT.rec||LVT.cap)lvRecStop();clearInterval(LVT.timer);LVT.timer=null;var now=a.currentTime;
  LVT.regions.forEach(function(r){(r.srcs||[]).forEach(function(s){try{s.stop(now+0.02);}catch(e){}});if(r.rec)lvRecFinishSession(r,lvG(now),true);});LVT.regions=[];
  LVT.arrSrc.forEach(function(x){try{x.s.stop(now+0.02);}catch(e){}});LVT.arrSrc=[];
  LVE.voices.forEach(function(v){try{v.g.gain.cancelScheduledValues(now);v.g.gain.setTargetAtTime(0,now,0.01);v.s.stop(now+0.06);}catch(e){}});LVE.voices.length=0;
  LVT.playing=false;LVT.pre=false;LV.set.tracks.forEach(function(t){t.arrOff=false;});try{lvMixParams(lvEngine(),LV.set);}catch(e){}lvUiTransport();}
function lvStopPress(){if(LVT.playing){lvStopAll();}else{LV.insert=LV.set.loop.on?LV.set.loop.s:0;LV.scrollX=0;}lvRenderSoon();}
/* quantized launch point (in G) — aligned to arrangement bars like Live's global quantization */
function lvQuantG(qBeats){var g=lvNowG()+0.03;if(!qBeats)return g;var aN=lvA(g),aQ=Math.ceil(aN/qBeats-1e-6)*qBeats;return g+(aQ-aN);}
function lvActive(tid){for(var i=0;i<LVT.regions.length;i++){var r=LVT.regions[i];if(r.t===tid&&r.to===Infinity)return r;}return null;}
function lvRegionEnd(r,g){if(r.to<=g)return;r.to=g;var tm=lvTime(g);(r.srcs||[]).forEach(function(s){try{s.stop(tm);}catch(e){}});}
function lvLaunch(ti,si,forceNow){var t=LV.set.tracks[ti];if(!t)return;var c=t.slots[si];unlockAudio();
  if(!LVT.playing)lvPlay(LV.insert);var from=forceNow?lvNowG()+0.03:lvQuantG(LV.set.quant);var cur=lvActive(t.id);
  if(cur&&cur.rec){lvRecFinishSession(cur,from);if(cur.slot===si)return;}
  if(!c){if(t.arm&&t.type==="midi"){lvRecStartSession(ti,si,from);return;}if(t.arm&&t.type==="audio"){lvRecStartSession(ti,si,from);return;}if(cur)lvRegionEnd(cur,from);return;}
  if(cur)lvRegionEnd(cur,from);t.arrOff=true;LVT.arrSrc.forEach(function(x){if(x.t===t.id){try{x.s.stop(lvTime(from));}catch(e){}}});
  var r={id:lvId(),t:t.id,slot:si,clip:c,anchor:from,from:from,to:Infinity,srcs:[],keys:{}};if(LVT.rec&&LVT.recStartA!=null){r.recFrom=from;r.recA=lvA(from);}LVT.regions.push(r);lvRenderSoon();}
function lvStopTrack(ti){var t=LV.set.tracks[ti];if(!t||!LVT.playing)return;var r=lvActive(t.id);if(!r)return;var g=lvQuantG(LV.set.quant);if(r.rec)lvRecFinishSession(r,g);lvRegionEnd(r,g);lvRenderSoon();}
function lvLaunchScene(si){if(!LVT.playing)lvPlay(LV.insert);var from=lvQuantG(LV.set.quant);LV.set.tracks.forEach(function(t,ti){if(t.slots[si])lvLaunchAt(ti,si,from);else{var r=lvActive(t.id);if(r&&!r.rec)lvRegionEnd(r,from);}});lvRenderSoon();}
function lvLaunchAt(ti,si,from){var t=LV.set.tracks[ti],c=t.slots[si],cur=lvActive(t.id);if(cur)lvRegionEnd(cur,from);t.arrOff=true;LVT.arrSrc.forEach(function(x){if(x.t===t.id){try{x.s.stop(lvTime(from));}catch(e){}}});
  var r={id:lvId(),t:t.id,slot:si,clip:c,anchor:from,from:from,to:Infinity,srcs:[],keys:{}};if(LVT.rec&&LVT.recStartA!=null){r.recFrom=from;r.recA=lvA(from);}LVT.regions.push(r);}
function lvStopAllClips(){if(!LVT.playing)return;var g=lvQuantG(LV.set.quant);LVT.regions.forEach(function(r){if(r.rec)lvRecFinishSession(r,g);lvRegionEnd(r,g);});lvRenderSoon();}
function lvBackToArr(){var g=lvNowG();LVT.regions.forEach(function(r){lvRegionEnd(r,g+0.02);});LV.set.tracks.forEach(function(t){t.arrOff=false;});lvRenderSoon();}
/* ---------- scheduling ---------- */
function lvClipBeats(c){if(c.type==="audio"&&c.audio&&!c.warp){var rate=Math.pow(2,(c.trans||0)/12);return c.audio.dur/rate*lvBpm()/60;}return c.len;}
function lvSchedClip(X,t,c,anchor,from,to,w0,w1,keys,srcList,kp){var lo=Math.max(w0,from),hi=Math.min(w1,to);if(lo>=hi||!c)return;var L=Math.max(0.0625,c.len),bpm=X.bpm||lvBpm(),spb=60/bpm;
  if(c.type==="midi"){var k0=Math.floor((lo-anchor)/L),k1=Math.floor((hi-anchor-1e-9)/L);for(var k=k0;k<=k1;k++){var base=anchor+k*L;for(var i=0;i<c.notes.length;i++){var n=c.notes[i];if(n.mute||n.s>=L)continue;var nb=base+n.s;if(nb<lo||nb>=hi)continue;
      var d=Math.min(n.d,to-nb,base+L-nb);lvPlayNote(X,t,n.m+(c.trans||0),X.time(nb),Math.max(0.02,d*spb),n.v);}}return;}
  if(c.type==="audio"&&c.audio){var buf=LVB[c.audio.key];if(!buf){lvLoadAudio(c.audio.key);return;}var T=X.M.tr[t.id];if(!T)return;
    var warp=c.warp!==false,rate=warp?bpm/(c.audio.bpm||bpm):Math.pow(2,(c.trans||0)/12),secPerBeatBuf=warp?60/(c.audio.bpm||bpm):spb*rate;
    var k0b=Math.floor((lo-anchor)/L),k1b=Math.floor((hi-anchor-1e-9)/L);for(var kb=k0b;kb<=k1b;kb++){var key=kp+":"+kb;if(keys[key])continue;var sb=anchor+kb*L,se=sb+L,st=Math.max(sb,from),en=Math.min(se,to);if(st>=hi||en<=lo||en<=st)continue;keys[key]=1;
      var off=(st-sb+(c.start||0))*secPerBeatBuf+(c.audio.off||0);if(off>=buf.duration)continue;var s=X.a.createBufferSource(),g=X.a.createGain();s.buffer=buf;s.playbackRate.value=rate;s.connect(g);g.connect(T.in);
      var ts=X.time(st),te=X.time(en),gv=lvDbGain(c.gain||0);if(X.live&&ts<X.a.currentTime){off+=(X.a.currentTime-ts)*rate;ts=X.a.currentTime+0.005;if(off>=buf.duration||ts>=te)continue;}
      g.gain.setValueAtTime(0,ts);g.gain.linearRampToValueAtTime(gv,ts+0.004);g.gain.setValueAtTime(gv,Math.max(ts+0.004,te-0.004));g.gain.linearRampToValueAtTime(0,te);s.start(ts,off);s.stop(te+0.01);srcList.push(s);}}}
function lvSchedArr(X,gA,gB){var aA=lvA(gA),aB=aA+(gB-gA);if(gB<=0)return;if(gA<0){aA=lvA(0);gA=0;aB=aA+(gB-gA);}
  LV.set.tracks.forEach(function(t){if(t.arrOff||lvActiveAt(t.id,gA))return;t.arr.forEach(function(ac2){if(ac2.on===false)return;var cs=ac2.start,ce=ac2.start+ac2.len;if(ce<=aA||cs>=aB)return;
      var anchor=gA+(cs-(ac2.off||0)-aA),from=gA+(cs-aA),to=gA+(ce-aA),list=[];lvSchedClip(X,t,ac2.clip,anchor,from,to,gA,gB,LVT.akeys||(LVT.akeys={}),list,"a"+LVT.pass+ac2.id);list.forEach(function(s){LVT.arrSrc.push({t:t.id,s:s});});});});}
function lvActiveAt(tid,g){return LVT.regions.some(function(r){return r.t===tid&&r.from<=g+1e-6&&r.to>g;});}
function lvTick(){if(!LVT.playing)return;var a=ac(),X=lvLiveX(),g1=lvG(a.currentTime+0.13),g0=LVT.lastG;if(g1<=g0)return;LVT.lastG=g1;var S=LV.set,sig=S.sig;
  /* metronome (always during count-in) */
  if(S.metro||g0<0){for(var b=Math.ceil(g0);b<g1;b++){if(b<=LVT.lastClick)continue;if(b>=0&&!S.metro)continue;LVT.lastClick=b;var ab=lvA(b),acc=((Math.round(ab)%sig)+sig)%sig===0;lvClick(lvTime(b),acc);}}
  if(LVT.pre&&g1>=0){LVT.pre=false;if(LVT.recPending){LVT.recPending=false;lvRecBegin(0);}}
  /* session clips */
  LVT.regions.forEach(function(r){var t=lvTrack(r.t);if(!t)return;if(r.rec&&r.recEnd!=null&&r.recEnd<=g1){lvRecFinishSession(r,r.recEnd,false,true);}
    if(r.rec&&!r.recEnd)return;lvSchedClip(X,t,r.clip,r.anchor,r.from,r.to,g0,g1,r.keys,r.srcs,"s"+r.id);});
  /* arrangement, with loop jumps */
  if(g1>0){var aStart=lvA(Math.max(0,g0)),L=S.loop;if(L.on&&L.l>0&&aStart<L.s+L.l&&aStart+(g1-Math.max(0,g0))>=L.s+L.l){var gJ=Math.max(0,g0)+(L.s+L.l-aStart);lvSchedArr(X,g0,gJ);lvAutoApply(g0,gJ);if(LVT.rec)lvRecLoopWrap(gJ);LVT.maps.push({g:gJ,a:L.s});LVT.pass++;LVT.akeys={};
      LVT.arrSrc.forEach(function(x){try{x.s.stop(lvTime(gJ));}catch(e){}});LVT.arrSrc=[];lvSchedArr(X,gJ,g1);lvAutoApply(gJ,g1);}else{lvSchedArr(X,g0,g1);lvAutoApply(g0,g1);}}
  /* finished session regions → recorded into the arrangement when global record is on */
  var keep=[];LVT.regions.forEach(function(r){if(r.to<=g0){if(LVT.rec&&r.recA!=null&&!r.rec)lvRegionToArr(r);}else keep.push(r);});LVT.regions=keep;
  if(LVE.voices.length>400){var now=a.currentTime;for(var i=LVE.voices.length-1;i>=0;i--)if(LVE.voices[i].end<now-0.5)LVE.voices.splice(i,1);}}
function lvClick(time,acc){try{var a=ac(),o=a.createOscillator(),g=a.createGain();o.type="square";o.frequency.value=acc?1760:1180;g.gain.setValueAtTime(0.0001,time);g.gain.exponentialRampToValueAtTime(acc?0.5:0.32,time+0.002);g.gain.exponentialRampToValueAtTime(0.0001,time+0.045);
  o.connect(g);g.connect(typeof clickBus==="function"?clickBus(a):a.destination);o.start(time);o.stop(time+0.06);}catch(e){}}
/* overwrite arrangement clips in [s,e) on a track (like recording or pasting over in Live) */
function lvArrClear(t,s,e){var out=[];t.arr.forEach(function(x){var xs=x.start,xe=x.start+x.len;if(xe<=s||xs>=e){out.push(x);return;}
  if(xs<s){var l=lvClone(x);l.id=lvId();l.len=s-xs;out.push(l);}if(xe>e){var r=lvClone(x);r.id=lvId();r.off=(x.off||0)+(e-xs);r.start=e;r.len=xe-e;out.push(r);}});t.arr=out;}
function lvRegionToArr(r){var t=lvTrack(r.t);if(!t||r.to===Infinity)return;var f=r.recFrom!=null?r.recFrom:r.from,len=r.to-f;if(len<=0.01)return;var s=r.recA;lvArrClear(t,s,s+len);t.arr.push({id:lvId(),start:s,len:len,off:(f-r.anchor)%Math.max(0.0625,r.clip.len),on:true,clip:lvClone(r.clip)});r.recA=null;LV.arrDirty=true;}
/* ---------- live note input (computer keys, MIDI keyboard, on-screen keys) ---------- */
function lvInputTracks(){var S=LV.set,arm=S.tracks.filter(function(t){return t.arm&&t.type==="midi";});if(arm.length)return arm;var t=lvSelTrack();return t&&t.type==="midi"?[t]:[];}
var LVHELD={};
function lvNoteIn(m,vel,on){unlockAudio();var X=lvLiveX(),a=X.a,now=a.currentTime,tracks=lvInputTracks();
  if(on){tracks.forEach(function(t){var k=t.id+":"+m;if(LVHELD[k])lvHeldOff(k,now);var before=X.voices.length;lvPlayNote(X,t,m,now+0.003,30,vel);LVHELD[k]={vs:X.voices.slice(before),g:LVT.playing?lvNowG():null};});lvRecNote(m,vel,true,tracks);}
  else{tracks.forEach(function(t){var k=t.id+":"+m;lvHeldOff(k,now);});lvRecNote(m,vel,false,tracks);}lvKeysPaint&&lvKeysPaint(m,on);}
function lvHeldOff(k,now){var h=LVHELD[k];if(!h)return;h.vs.forEach(function(v){try{v.g.gain.cancelScheduledValues(now);v.g.gain.setValueAtTime(v.g.gain.value,now);v.g.gain.setTargetAtTime(0.0001,now,0.08);v.s.stop(now+0.6);}catch(e){}});delete LVHELD[k];}
/* ---------- recording ---------- */
function lvRecOffset(){if(LV.recOffMs!=null)return LV.recOffMs/1000;var v=load("mjk-latms",0);if(v>0)return v/1000;var a=ac();return (a.outputLatency||a.baseLatency||0.02)+0.01;}
function lvRecToggle(){if(LVT.rec||LVT.recPending){lvRecStop();lvRenderSoon();return;}var arm=LV.set.tracks.filter(function(t){return t.arm;});if(!arm.length){lvStatus("Arm a track first (● button) to record into the Arrangement.");return;}
  LVT.rec=true;if(arm.some(function(t){return t.type==="audio";}))lvCapStart();if(!LVT.playing){LVT.recPending=true;lvPlay(LV.insert,LV.set.countIn);if(!LV.set.countIn){LVT.recPending=false;lvRecBegin(0);}}else lvRecBegin(lvNowG());lvUiTransport();}
function lvRecBegin(g){LVT.recStartG=g;LVT.recStartA=lvA(g);LVT.recMidi={};LV.set.tracks.forEach(function(t){if(t.arm&&t.type==="midi")LVT.recMidi[t.id]={notes:[],held:{}};});
  LVT.regions.forEach(function(r){if(r.recA==null&&!r.rec){r.recFrom=Math.max(g,r.from);r.recA=lvA(r.recFrom);}});}
function lvRecLoopWrap(gJ){lvRecWrite(gJ);lvRecBegin(gJ);}
function lvRecWrite(gEnd){if(LVT.recStartA==null)return;var sA=LVT.recStartA,eA=sA+(gEnd-LVT.recStartG);if(eA-sA<0.05)return;
  Object.keys(LVT.recMidi).forEach(function(id){var t=lvTrack(id),R=LVT.recMidi[id];if(!t)return;Object.keys(R.held).forEach(function(m){var h=R.held[m];h.d=Math.max(0.05,(eA-sA)-h.s);delete R.held[m];});if(!R.notes.length)return;
    var len=eA-sA,c=lvNewClip("midi",Math.max(0.25,len),t.name);c.notes=R.notes.slice();lvArrClear(t,sA,sA+len);t.arr.push({id:lvId(),start:sA,len:len,off:0,on:true,clip:c});});
  LVT.regions.forEach(function(r){if(r.recA!=null&&!r.rec){var t=lvTrack(r.t);if(!t)return;var from=Math.max(r.from,LVT.recStartG),to=Math.min(r.to,gEnd);if(to-from<0.01)return;var s=r.recA+(from-Math.max(r.from,LVT.recStartG));
      lvArrClear(t,s,s+(to-from));t.arr.push({id:lvId(),start:s,len:to-from,off:(from-r.anchor)%Math.max(0.0625,r.clip.len),on:true,clip:lvClone(r.clip)});r.recA=null;}});LV.arrDirty=true;}
function lvRecStop(){var g=LVT.playing?lvNowG():LVT.lastG;lvCommit("Record");if(LVT.rec&&LVT.recStartA!=null){lvRecWrite(g);if(LVT.cap)lvCapFinishArr(g);}else if(LVT.cap)lvCapStop();
  LVT.rec=false;LVT.recPending=false;LVT.recStartA=null;LVT.recMidi={};lvSave();lvUiTransport();}
function lvRecNote(m,vel,on,tracks){if(!LVT.playing)return;var g=lvNowG();if(g<0)return;
  if(LVT.rec&&LVT.recStartA!=null){var rel=lvA(g)-LVT.recStartA;tracks.forEach(function(t){var R=LVT.recMidi[t.id];if(!R)return;if(on){R.held[m]={s:rel,d:0.25,m:m,v:vel};R.notes.push(R.held[m]);}else if(R.held[m]){R.held[m].d=Math.max(0.03,rel-R.held[m].s);delete R.held[m];}});}
  /* session: recording a new clip, or overdubbing the playing clip when Session Record is on */
  tracks.forEach(function(t){var r=lvActive(t.id);if(!r)return;if(!r.rec&&!LVT.sessRec)return;var loc=g-r.anchor;if(loc<0)return;if(!r.rec)loc=loc%Math.max(0.0625,r.clip.len);r.held=r.held||{};
    if(on){var n={s:Math.round(loc*1000)/1000,d:0.25,m:m,v:vel};r.held[m]=n;r.clip.notes.push(n);}else if(r.held[m]){var d=loc-r.held[m].s;if(!r.rec&&d<0)d+=r.clip.len;r.held[m].d=Math.max(0.03,d);delete r.held[m];}});}
function lvRecStartSession(ti,si,from){var t=LV.set.tracks[ti];lvCommit("Record clip");var c=lvNewClip(t.type,1024,t.name);if(t.type==="audio"){c.audio=null;}t.slots[si]=c;var cur=lvActive(t.id);if(cur)lvRegionEnd(cur,from);t.arrOff=true;
  var r={id:lvId(),t:t.id,slot:si,clip:c,anchor:from,from:from,to:Infinity,srcs:[],keys:{},rec:true};LVT.regions.push(r);if(t.type==="audio")lvCapStart();lvRenderSoon();}
function lvRecFinishSession(r,endG,stopping,now){if(!r.rec)return;if(r.recEnd==null&&!now){var q=LV.set.quant||LV.set.sig;var len0=endG-r.anchor;var lenQ=Math.max(q,Math.ceil(len0/q-0.02)*q);r.recEnd=r.anchor+lenQ;if(!stopping)return;}
  var end=r.recEnd!=null?r.recEnd:endG,len=Math.max(LV.set.sig,end-r.anchor);r.clip.len=len;r.rec=false;r.recEnd=null;
  Object.keys(r.held||{}).forEach(function(m){var h=r.held[m];h.d=Math.max(0.05,len-h.s);});r.held={};var t=lvTrack(r.t);
  if(t&&t.type==="audio"){lvCapFinishClip(r.clip,r.anchor,end);}
  if(t&&t.type==="midi"&&!r.clip.notes.length){var si=t.slots.indexOf(r.clip);if(si>=0&&stopping)t.slots[si]=null;}
  lvSave();lvRenderSoon();}
/* audio capture from the mic, time-stamped on the audio clock so takes line up with the beat */
function lvCapStart(){if(LVT.cap)return;var a=ac();LVT.cap={chunks:[],sr:a.sampleRate,ok:false};var C=LVT.cap;
  navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}}).then(function(st){if(LVT.cap!==C){st.getTracks().forEach(function(x){x.stop();});return;}
    C.stream=st;C.src=a.createMediaStreamSource(st);C.proc=a.createScriptProcessor(2048,1,1);C.zero=a.createGain();C.zero.gain.value=0;C.src.connect(C.proc);C.proc.connect(C.zero);C.zero.connect(a.destination);C.ok=true;
    C.proc.onaudioprocess=function(e){var d=e.inputBuffer.getChannelData(0);C.chunks.push({t:a.currentTime-e.inputBuffer.duration,d:new Float32Array(d)});if(C.chunks.length>60*30*a.sampleRate/2048)C.chunks.shift();};
    LV.set.tracks.forEach(function(t){if(t.arm&&t.type==="audio"&&t.mon==="in"){var T=lvEngine().tr[t.id];if(T){C.mon=C.mon||[];var mg=a.createGain();C.src.connect(mg);mg.connect(T.in);C.mon.push(mg);}}});})
  .catch(function(){lvStatus("Microphone not available — allow mic access to record audio.");LVT.cap=null;});}
function lvCapStop(){var C=LVT.cap;if(!C)return;LVT.cap=null;try{C.proc.disconnect();C.src.disconnect();(C.mon||[]).forEach(function(m){m.disconnect();});}catch(e){}if(C.stream)C.stream.getTracks().forEach(function(x){x.stop();});}
function lvCapExtract(C,t0,t1){var lat=lvRecOffset(),sr=C.sr,n=Math.max(1,Math.round((t1-t0)*sr)),out=new Float32Array(n);
  C.chunks.forEach(function(ch){var i0=Math.round((ch.t-lat-t0)*sr);for(var j=0;j<ch.d.length;j++){var k=i0+j;if(k>=0&&k<n)out[k]=ch.d[j];}});return out;}
function lvCapSave(samples,name){var a=ac(),b=a.createBuffer(1,samples.length,LVT.cap?LVT.cap.sr:a.sampleRate);b.getChannelData(0).set(samples);var key="lv-a-"+lvId();LVB[key]=b;
  idbPut(key,new Blob([bufferToWav(b)],{type:"audio/wav"}));return {key:key,bpm:lvBpm(),dur:b.duration,beats:b.duration*lvBpm()/60,name:name};}
function lvCapFinishClip(clip,anchorG,endG){var C=LVT.cap;if(!C)return;var t0=lvTime(anchorG),t1=lvTime(endG);setTimeout(function(){var s=lvCapExtract(C,t0,t1);clip.audio=lvCapSave(s);clip.len=endG-anchorG;clip.name=clip.name||"Audio";lvCapMaybeStop();lvSave();lvRenderSoon();},350);}
function lvCapFinishArr(gEnd){var C=LVT.cap;if(!C||LVT.recStartA==null)return;var sA=LVT.recStartA,len=gEnd-LVT.recStartG,t0=lvTime(LVT.recStartG),t1=lvTime(gEnd),tracks=LV.set.tracks.filter(function(t){return t.arm&&t.type==="audio";});
  setTimeout(function(){if(len<0.1){lvCapStop();return;}var s=lvCapExtract(C,t0,t1),au=lvCapSave(s);tracks.forEach(function(t){var c=lvNewClip("audio",len,t.name);c.audio=au;lvArrClear(t,sA,sA+len);t.arr.push({id:lvId(),start:sA,len:len,off:0,on:true,clip:c});});lvCapStop();lvSave();lvRenderSoon();},350);}
function lvCapMaybeStop(){if(LVT.rec)return;if(LVT.regions.some(function(r){return r.rec;}))return;lvCapStop();}
