/* part 8: professional sound engine — analog synth, modeled 808/909 drums, velocity-aware sampler, return device chains,
   new reverb + ping-pong delay, worklet compressor with sidechain, WSOLA time-stretch warping */
/* ---------- instruments list ---------- */
var LV_SYNP=[["Oscillators",[["o2oct","Osc 2 Oct",-2,2,1],["o2det","Osc 2 Detune",-50,50],["o2lvl","Osc 2 Level",0,1],["sub","Sub",0,1],["noise","Noise",0,1],["uni","Unison",1,6,1],["spread","Spread",0,50],["width","Width",0,1]]],
  ["Filter",[["cut","Cutoff",40,18000,0,1],["res","Resonance",0.3,20],["fenv","Env Amount",-4,6],["fa","F Attack",0.001,4,0,1],["fd","F Decay",0.01,6,0,1],["fs","F Sustain",0,1],["fr","F Release",0.01,8,0,1],["drive","Drive",0,1]]],
  ["Amp",[["a","Attack",0.001,5,0,1],["d","Decay",0.01,6,0,1],["s","Sustain",0,1],["r","Release",0.01,8,0,1],["vel","Velocity",0,1],["lvl","Level",0,1.2]]],
  ["LFO & Glide",[["lfoR","LFO Rate",0.05,12,0,1],["lfoP","→ Pitch",0,50],["lfoF","→ Filter",0,2],["glide","Glide",0,0.5]]]];
(function(){var g=LV_INSTS.find(function(x){return x[0]==="Synths";});g[1]=Object.keys(LV_SYN2).map(function(k){return ["syn:"+k,LV_SYN2[k].nm];}).concat([["sf:pad","Sampled Pad"],["sf:lead","Sampled Lead"],["sf:handpan","Steel Drum"]]);
  var d=LV_INSTS.find(function(x){return x[0]==="Drum Racks";});d[1]=[["dr:acoustic","Acoustic Kit"],["dr:808","808 Kit"],["dr:909","909 Kit"]];})();
/* ---------- modeled drum machines ---------- */
/* ---------- the note dispatcher (replaces the basic one) ---------- */
lvPlayNote=function(X,t,m,when,dur,vel){var a=X.a,T=X.M.tr[t.id];if(!T||!t.inst)return;var out=T.in,inst=t.inst,vs=Math.max(0.03,Math.min(1,(vel||100)/127));
  if(inst.indexOf("dr:")===0){var dm=LV_DRUMMAP[m];if(!dm)return;var id=dm[0],kit=inst.slice(3);if(kit==="classic")kit="909";var pd=(t.pads&&t.pads[id])||{},g=a.createGain();g.gain.value=Math.pow(vs,1.2)*lvDbGain(pd.vol||0)*1.1;g.connect(out);
    var tune=pd.tune||0,dec=pd.dec||1;
    if(kit==="acoustic"&&typeof DRS!=="undefined"&&(DRS.buf[id]||(id==="floor"&&DRS.buf.tom2))){var s=a.createBufferSource();s.buffer=DRS.buf[id]||DRS.buf.tom2;s.playbackRate.value=Math.pow(2,tune/12)*(id==="floor"&&!DRS.buf.floor?0.82:1);var eg=a.createGain();s.connect(eg);eg.connect(g);
      var L=s.buffer.duration/s.playbackRate.value;if(dec<0.99){eg.gain.setValueAtTime(1,when);eg.gain.setTargetAtTime(0.0001,when+L*dec*0.6,L*dec*0.15);}s.start(when);s.stop(when+L+0.05);lvVoice(X,s,eg,when+L,0.05);return;}
    try{lvDrumSynth(a,g,when,id,kit==="acoustic"?"808":kit,tune,dec);}catch(e){}return;}
  if(inst.indexOf("sf:")===0){var key=inst.slice(3);if(typeof SF!=="undefined"&&SF.ready&&SF.ready[key]&&sfOn()){var anc=sfNearest(key,m);if(anc!=null&&SF.buf[key][anc]){var s2=a.createBufferSource();s2.buffer=SF.buf[key][anc];s2.playbackRate.value=Math.pow(2,(m-anc)/12);
      var lp=a.createBiquadFilter();lp.type="lowpass";lp.frequency.value=1800+16000*Math.pow(vs,1.6);lp.Q.value=0.5;var g2=a.createGain(),peak=0.95*Math.pow(vs,1.35),rel=Math.max(0.05,dur),tail=(SF.ring&&SF.ring[key])||0.6;
      g2.gain.setValueAtTime(0.0001,when);g2.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak),when+0.004);g2.gain.setValueAtTime(Math.max(0.0002,peak),when+rel);g2.gain.setTargetAtTime(0.0001,when+rel,tail/4);
      s2.connect(lp);lp.connect(g2);g2.connect(out);s2.start(when);s2.stop(when+rel+tail*1.6+0.1);lvVoice(X,s2,g2,when+rel+tail,tail);return;}}else{try{sfLoadInst(key);}catch(e){}}
    inst="syn:keys";}
  if(inst.indexOf("syn:")!==0)inst="syn:keys";var tt=t.inst===inst?t:Object.assign({},t,{inst:inst,syn:null});lvSynVoice(X,tt,m,when,dur,vel,out);};
/* ---------- devices: new Reverb, stereo / ping-pong Delay, worklet Compressor with sidechain ---------- */
LV_DEVS.reverb={nm:"Reverb",ps:[["size","Size",0.2,1,0.7,""],["decay","Decay",0.3,12,2.6,"s",1],["pre","Predelay",0,250,18,"ms"],["lo","Lo Cut",20,1000,180,"Hz",1],["tone","Hi Cut",1500,18000,8000,"Hz",1],["damp","Damping",0.1,1,0.5,""],["width","Width",0,150,100,"%"],["mix","Dry/Wet",0,100,30,"%"]]};
LV_DEVS.delay={nm:"Delay",ps:[["sync","Time",0,8,4,"",0,["1/32","1/16","1/16.","1/8","1/8.","1/4","1/4.","1/2","1 bar"]],["fb","Feedback",0,95,40,"%"],["pp","Ping Pong",0,1,1,"",0,["Off","On"]],["lo","Lo Cut",20,2000,150,"Hz",1],["flt","Hi Cut",500,16000,5000,"Hz",1],["mix","Dry/Wet",0,100,30,"%"]]};
LV_DEVS.comp={nm:"Compressor",ps:[["th","Threshold",-60,0,-18,"dB"],["ratio","Ratio",1,20,4,":1"],["att","Attack",0.05,200,10,"ms",1],["rel","Release",5,2000,120,"ms",1],["knee","Knee",0,24,6,"dB"],["out","Makeup",-12,24,0,"dB"],["mix","Dry/Wet",0,100,100,"%"]]};
LV_DEVS.glue={nm:"Glue Compressor",ps:[["th","Threshold",-40,0,-10,"dB"],["ratio","Ratio",0,2,0,"",0,["2","4","10"]],["att","Attack",0,6,2,"",0,["0.01","0.1","0.3","1","3","10","30"]],["rel","Release",0,6,6,"",0,["0.1","0.2","0.4","0.6","0.8","1.2","Auto"]],["make","Makeup",0,20,2,"dB"],["mix","Dry/Wet",0,100,100,"%"]]};
var LV_WK={ready:new WeakMap(),pending:new WeakMap(),src:"class LvComp extends AudioWorkletProcessor{static get parameterDescriptors(){return [{name:'th',defaultValue:-18},{name:'ratio',defaultValue:4},{name:'att',defaultValue:10},{name:'rel',defaultValue:120},{name:'knee',defaultValue:6},{name:'make',defaultValue:0},{name:'mix',defaultValue:1},{name:'sc',defaultValue:0}];}"+
  "constructor(){super();this.env=0;this.n=0;this.mx=0;}process(I,O,P){const inp=I[0],sc=I[1],out=O[0];if(!inp||!inp.length){for(const c of out)c.fill(0);return true;}const det=(P.sc[0]>0.5&&sc&&sc.length)?sc:inp;"+
  "const th=P.th[0],ratio=Math.max(1,P.ratio[0]),knee=Math.max(0.01,P.knee[0]),mk=Math.pow(10,P.make[0]/20),mix=P.mix[0],aC=Math.exp(-1/(sampleRate*Math.max(0.00005,P.att[0]/1000))),rC=Math.exp(-1/(sampleRate*Math.max(0.002,P.rel[0]/1000)));const n=inp[0].length;"+
  "for(let i=0;i<n;i++){let x=0;for(let c=0;c<det.length;c++){const v=Math.abs(det[c][i]);if(v>x)x=v;}const xd=x>1e-6?20*Math.log10(x):-120,ov=xd-th;let yd;if(2*ov<-knee)yd=xd;else if(2*Math.abs(ov)<=knee)yd=xd+(1/ratio-1)*(ov+knee/2)*(ov+knee/2)/(2*knee);else yd=th+ov/ratio;"+
  "const gr=xd-yd;this.env=gr>this.env?aC*this.env+(1-aC)*gr:rC*this.env+(1-rC)*gr;if(this.env>this.mx)this.mx=this.env;const g=Math.pow(10,-this.env/20)*mk;for(let c=0;c<out.length;c++){const s=(inp[c]||inp[0])[i];out[c][i]=s*(1-mix)+s*g*mix;}}"+
  "if(++this.n%24===0){this.port.postMessage(this.mx);this.mx=0;}return true;}}registerProcessor('lv-comp',LvComp);"};
function lvWorklet(a){if(!a.audioWorklet||typeof AudioWorkletNode==="undefined")return Promise.resolve(false);if(LV_WK.ready.get(a))return Promise.resolve(true);if(LV_WK.pending.get(a))return LV_WK.pending.get(a);
  var url=URL.createObjectURL(new Blob([LV_WK.src],{type:"application/javascript"})),p=a.audioWorklet.addModule(url).then(function(){LV_WK.ready.set(a,true);return true;}).catch(function(){return false;});LV_WK.pending.set(a,p);return p;}
(function(){var base=lvDevBuild;lvDevBuild=function(a,dev,bpm){var t=dev.type,p=Object.assign(lvDevDefaults(t),dev.p);
  if(t==="reverb"){var D={in:a.createGain(),out:a.createGain()},w=lvDW(a),pd=a.createDelay(1),cv=a.createConvolver(),hp=a.createBiquadFilter(),lp=a.createBiquadFilter(),last="";hp.type="highpass";lp.type="lowpass";
    D.in.connect(w.in);w.in.connect(pd);pd.connect(hp);hp.connect(cv);cv.connect(lp);lp.connect(w.wet);w.out.connect(D.out);D.filters=[hp,lp];
    D.set=function(p){var k=[p.size,p.decay,p.damp,p.width].map(function(x){return Math.round(x*20)/20;}).join("|");if(k!==last){last=k;cv.buffer=lvReverbIR(a,p);}lvSv(pd.delayTime,p.pre/1000);lvSv(hp.frequency,p.lo);lvSv(lp.frequency,p.tone);w.mix(p.mix/100);};D.set(p);return D;}
  if(t==="delay"){var D2={in:a.createGain(),out:a.createGain()},w2=lvDW(a),sum=a.createGain(),dl=a.createDelay(5),dr=a.createDelay(5),fb=a.createGain(),xf=a.createGain(),hp2=a.createBiquadFilter(),lp2=a.createBiquadFilter(),mg=a.createChannelMerger(2),sp=a.createChannelSplitter(2),inR=a.createGain();
    hp2.type="highpass";lp2.type="lowpass";D2.in.connect(w2.in);w2.in.connect(sp);sp.connect(sum,0);sp.connect(sum,1);sp.connect(inR,1);
    /* chain: input → L delay → filters → R delay; R → feedback → L. Ping-pong bounces L/R; normal mode feeds R straight from input */
    sum.connect(dl);dl.connect(hp2);hp2.connect(lp2);lp2.connect(mg,0,0);lp2.connect(xf);xf.connect(dr);inR.connect(dr);dr.connect(mg,0,1);dr.connect(fb);fb.connect(dl);mg.connect(w2.wet);w2.out.connect(D2.out);var curPP=-1;
    D2.set=function(p,b){var beats=[0.125,0.25,0.375,0.5,0.75,1,1.5,2,4][p.sync|0]||0.75,sec=Math.min(4.5,beats*60/(b||bpm||120)),pp=(p.pp|0)===1;
      lvSv(dl.delayTime,sec);lvSv(dr.delayTime,pp?sec:0.0001);lvSv(fb.gain,p.fb/100);lvSv(hp2.frequency,p.lo);lvSv(lp2.frequency,p.flt);if(pp!==curPP){curPP=pp;xf.gain.value=1;inR.gain.value=0;sum.gain.value=pp?0.7:0.55;}w2.mix(p.mix/100);};D2.set(p,bpm);return D2;}
  if((t==="comp"||t==="glue")&&LV_WK.ready.get(a)){var D3={in:a.createGain(),out:a.createGain(),scIn:a.createGain()},nd=new AudioWorkletNode(a,"lv-comp",{numberOfInputs:2,numberOfOutputs:1,outputChannelCount:[2]}),gr=0;
    D3.in.connect(nd,0,0);D3.scIn.connect(nd,0,1);nd.connect(D3.out);nd.port.onmessage=function(e){gr=e.data;};D3.comp={get reduction(){return -gr;}};D3.wk=nd;var P=function(n){return nd.parameters.get(n);};
    D3.set=function(p){if(t==="comp"){lvSv(P("th"),p.th);lvSv(P("ratio"),p.ratio);lvSv(P("att"),p.att);lvSv(P("rel"),p.rel);lvSv(P("knee"),p.knee);lvSv(P("make"),p.out);lvSv(P("mix"),(p.mix==null?100:p.mix)/100);}
      else{lvSv(P("th"),p.th);lvSv(P("ratio"),[2,4,10][p.ratio|0]);lvSv(P("att"),[0.01,0.1,0.3,1,3,10,30][p.att|0]);var rl=[100,200,400,600,800,1200,0][p.rel|0];lvSv(P("rel"),rl||350);lvSv(P("knee"),4);lvSv(P("make"),p.make);lvSv(P("mix"),p.mix/100);}
      lvSv(P("sc"),dev.sc?1:0);};D3.set(p);return D3;}
  return base(a,dev,bpm);};})();
/* ---------- return tracks with their own device chains ---------- */
function lvRetDefaults(S){S.returns.forEach(function(r){if(!r.devs){r.devs=r.id==="A"?[{id:lvId(),type:"reverb",on:true,p:Object.assign(lvDevDefaults("reverb"),{mix:100,decay:2.6})}]:[{id:lvId(),type:"delay",on:true,p:Object.assign(lvDevDefaults("delay"),{mix:100,fb:38,sync:4})}];r.name=r.id==="A"?"Reverb":"Delay";}});}
function lvRetChainSig(r){return (r.devs||[]).map(function(d){return d.id+(d.on===false?"-":"+");}).join(",");}
function lvRetChain(M,r,S){var R=M.ret[r.id],a=M.a;try{R.in.disconnect();}catch(e){}(R.devs||[]).forEach(function(D){try{D.out.disconnect();}catch(e){}});R.devs=[];var last=R.in;
  (r.devs||[]).forEach(function(d){if(d.on===false)return;var D=lvDevBuild(a,d,S.bpm);D.id=d.id;last.connect(D.in);last=D.out;R.devs.push(D);});last.connect(R.f);R.sig=lvRetChainSig(r);}
lvMixBuild=function(a,S,dest){lvRetDefaults(S);var M={a:a,tr:{},ret:{}};M.masterIn=a.createGain();M.masterF=a.createGain();M.lim=a.createDynamicsCompressor();M.lim.threshold.value=-0.8;M.lim.knee.value=0;M.lim.ratio.value=20;M.lim.attack.value=0.001;M.lim.release.value=0.08;
  M.an=a.createAnalyser();M.an.fftSize=512;M.masterIn.connect(M.masterF);M.masterF.connect(M.lim);M.lim.connect(M.an);M.lim.connect(dest);
  /* K-weighted loudness taps (ITU-R BS.1770) for the LUFS meter */
  try{var hs=a.createBiquadFilter(),hp=a.createBiquadFilter(),sp=a.createChannelSplitter(2);hs.type="highshelf";hs.frequency.value=1681.97;hs.gain.value=4;hp.type="highpass";hp.frequency.value=38.14;hp.Q.value=0.5;M.lim.connect(hs);hs.connect(hp);hp.connect(sp);
    M.kL=a.createAnalyser();M.kR=a.createAnalyser();M.kL.fftSize=M.kR.fftSize=2048;sp.connect(M.kL,0);sp.connect(M.kR,1);var sp2=a.createChannelSplitter(2);M.pL=a.createAnalyser();M.pR=a.createAnalyser();M.pL.fftSize=M.pR.fftSize=2048;M.lim.connect(sp2);sp2.connect(M.pL,0);sp2.connect(M.pR,1);}catch(e){}
  S.returns.forEach(function(r){var R={in:a.createGain(),f:a.createGain(),p:a.createStereoPanner(),an:a.createAnalyser(),devs:[],sig:""};R.an.fftSize=256;R.f.connect(R.p);R.p.connect(R.an);R.p.connect(M.masterIn);M.ret[r.id]=R;lvRetChain(M,r,S);});
  S.tracks.forEach(function(t){lvTrackBuild(M,t,S);});lvMixParams(M,S);return M;};
(function(){var base=lvMixParams;lvMixParams=function(M,S){lvRetDefaults(S);base(M,S);
  S.returns.forEach(function(r){var R=M.ret[r.id];if(!R)return;if(R.sig!==lvRetChainSig(r))lvRetChain(M,r,S);R.devs.forEach(function(D){var d=r.devs.find(function(x){return x.id===D.id;});if(d)D.set(Object.assign(lvDevDefaults(d.type),d.p),S.bpm);});});
  /* sidechain wiring: a compressor listens to another track's output */
  S.tracks.forEach(function(t){var T=M.tr[t.id];if(!T)return;T.devs.forEach(function(D){if(!D.scIn)return;var d=t.devs.find(function(x){return x.id===D.id;}),want=d&&d.sc&&M.tr[d.sc]?d.sc:null;if(D.scSrc===want)return;
    if(D.scSrc&&M.tr[D.scSrc]){try{M.tr[D.scSrc].act.disconnect(D.scIn);}catch(e){}}D.scSrc=want;if(want)M.tr[want].act.connect(D.scIn);});});};})();
/* ---------- time-stretch warping (WSOLA), cached per clip + ratio ---------- */
var LVST={},LVSTp={};
function lvWsola(buf,factor){var a=ac(),C=buf.numberOfChannels,len=buf.length,N=2048,Hs=1024,tol=512,Lc=512,outLen=Math.max(1,Math.round(len*factor)),data=[],out=[];for(var c=0;c<C;c++){data.push(buf.getChannelData(c));out.push(new Float32Array(outLen+N));}
  var mono=new Float32Array(len);for(var c2=0;c2<C;c2++)for(var i=0;i<len;i++)mono[i]+=data[c2][i];var win=new Float32Array(N);for(var j=0;j<N;j++)win[j]=0.5-0.5*Math.cos(2*Math.PI*j/N);
  var Ha=Hs/factor,prev=0,corr=function(p,q){var s=0;for(var k=0;k<Lc;k+=2)s+=mono[p+k]*mono[q+k];return s;};
  for(var k=0,op=0;op<outLen;k++,op+=Hs){var ideal=Math.round(k*Ha);if(ideal>=len)break;var best=0;
    if(k>0){var nat=prev+Hs;if(nat+Lc<len){var lo=Math.max(-tol,-ideal),hi=Math.min(tol,len-Lc-ideal-1),bs=-1e30;for(var d=lo;d<=hi;d+=8){var sc=corr(nat,ideal+d);if(sc>bs){bs=sc;best=d;}}var b0=best;for(var d2=Math.max(lo,b0-7);d2<=Math.min(hi,b0+7);d2++){var sc2=corr(nat,ideal+d2);if(sc2>bs){bs=sc2;best=d2;}}}}
    var pos=Math.max(0,ideal+best);for(var c3=0;c3<C;c3++){var src=data[c3],dst=out[c3];for(var m=0;m<N&&pos+m<len;m++)dst[op+m]+=src[pos+m]*win[m];}prev=pos;}
  var res=a.createBuffer(C,outLen,buf.sampleRate);for(var c4=0;c4<C;c4++)res.getChannelData(c4).set(out[c4].subarray(0,outLen));
  /* fade the first frame in so the window ramp doesn't dip the attack */
  for(var c5=0;c5<C;c5++){var dd=res.getChannelData(c5),src0=data[c5];for(var q=0;q<Hs&&q<outLen&&q<len;q++)dd[q]=src0[q];}return res;}
function lvStretchKey(c,bpm){var au=c.audio,p=Math.pow(2,(c.trans||0)/12),f=(au.bpm||bpm)/bpm*p;return {key:au.key+"|"+f.toFixed(4),f:f,p:p};}
function lvStretched(c,bpm,sync){var K=lvStretchKey(c,bpm);if(Math.abs(K.f-1)<0.002)return {buf:LVB[c.audio.key],f:1,p:K.p};if(LVST[K.key])return {buf:LVST[K.key],f:K.f,p:K.p};var src=LVB[c.audio.key];if(!src)return null;
  if(sync){LVST[K.key]=lvWsola(src,K.f);return {buf:LVST[K.key],f:K.f,p:K.p};}
  if(!LVSTp[K.key]){LVSTp[K.key]=1;lvStatus("Warping “"+(c.name||"audio")+"” to "+bpm+" BPM…");setTimeout(function(){try{LVST[K.key]=lvWsola(src,K.f);lvStatus("Warped “"+(c.name||"audio")+"”.");}catch(e){}delete LVSTp[K.key];},20);}return null;}
lvSchedClip=function(X,t,c,anchor,from,to,w0,w1,keys,srcList,kp){var lo=Math.max(w0,from),hi=Math.min(w1,to);if(lo>=hi||!c)return;var L=Math.max(0.0625,c.len),bpm=X.bpm||lvBpm(),spb=60/bpm;
  if(c.type==="midi"){var k0=Math.floor((lo-anchor)/L),k1=Math.floor((hi-anchor-1e-9)/L);for(var k=k0;k<=k1;k++){var base=anchor+k*L;for(var i=0;i<c.notes.length;i++){var n=c.notes[i];if(n.mute||n.s>=L)continue;var nb=base+n.s;if(nb<lo||nb>=hi)continue;
      var d=Math.min(n.d,to-nb,base+L-nb);lvPlayNote(X,t,n.m+(c.trans||0),X.time(nb),Math.max(0.02,d*spb),n.v);}}return;}
  if(c.type!=="audio"||!c.audio)return;var raw=LVB[c.audio.key];if(!raw){lvLoadAudio(c.audio.key);return;}var T=X.M.tr[t.id];if(!T)return;
  var au=c.audio,warp=c.warp!==false,mode=c.wmode||"beats",buf=raw,rate,secPerBeatBuf;
  if(warp&&mode!=="repitch"){var st=lvStretched(c,bpm,!X.live);if(st&&st.buf){buf=st.buf;rate=st.p;secPerBeatBuf=60/(au.bpm||bpm)*st.f;}else{rate=bpm/(au.bpm||bpm);secPerBeatBuf=60/(au.bpm||bpm);}}
  else if(warp){rate=bpm/(au.bpm||bpm);secPerBeatBuf=60/(au.bpm||bpm);}else{rate=Math.pow(2,(c.trans||0)/12);secPerBeatBuf=spb*rate;}
  var offScale=buf===raw?1:(secPerBeatBuf/(60/(au.bpm||bpm)));
  var k0b=Math.floor((lo-anchor)/L),k1b=Math.floor((hi-anchor-1e-9)/L);for(var kb=k0b;kb<=k1b;kb++){var key=kp+":"+kb;if(keys[key])continue;var sb=anchor+kb*L,se=sb+L,st2=Math.max(sb,from),en=Math.min(se,to);if(st2>=hi||en<=lo||en<=st2)continue;keys[key]=1;
    var off=(st2-sb+(c.start||0))*secPerBeatBuf+(au.off||0)*offScale;if(off>=buf.duration)continue;var s=X.a.createBufferSource(),g=X.a.createGain();s.buffer=buf;s.playbackRate.value=rate;s.connect(g);g.connect(T.in);
    var ts=X.time(st2),te=X.time(en),gv=lvDbGain(c.gain||0);if(X.live&&ts<X.a.currentTime){off+=(X.a.currentTime-ts)*rate;ts=X.a.currentTime+0.005;if(off>=buf.duration||ts>=te)continue;}
    g.gain.setValueAtTime(0,ts);g.gain.linearRampToValueAtTime(gv,ts+0.003);g.gain.setValueAtTime(gv,Math.max(ts+0.003,te-0.006));g.gain.linearRampToValueAtTime(0,te);s.start(ts,off);s.stop(te+0.01);srcList.push(s);}};
/* offline export: worklet + stretched audio ready before rendering */
lvRenderOffline=function(a0,a1,sr){var S=LV.set,keys=[];S.tracks.forEach(function(t){t.arr.forEach(function(x){if(x.clip.audio)keys.push(x.clip.audio.key);});});sr=sr||44100;
  return Promise.all(keys.map(lvLoadAudio)).then(function(){var bpm=S.bpm,dur=(a1-a0)*60/bpm+(LV.exportTail===false?0.05:3),OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext,oc=new OAC(2,Math.ceil(dur*sr),sr);
    return lvWorklet(oc).then(function(){var M=lvMixBuild(oc,S,oc.destination),X={a:oc,M:M,voices:[],bpm:bpm,time:function(g){return Math.max(0,g)*60/bpm;},live:false},span=a1-a0;
      if(typeof lvAutoCore==="function")lvAutoCore(M,S,a0,a1,function(b){return Math.max(0,(b-a0)*60/bpm);});
      S.tracks.forEach(function(t){t.arr.forEach(function(x){if(x.on===false)return;var cs=x.start-a0,ce=cs+x.len;if(ce<=0||cs>=span)return;lvSchedClip(X,t,x.clip,cs-(x.off||0),Math.max(0,cs),Math.min(span,ce),0,span,{},[],"o"+x.id);});});
      return oc.startRendering();});});};
/* better metronome: short woodblock-style tick */
lvClick=function(time,acc){try{var a=ac(),o=a.createOscillator(),g=a.createGain(),bp=a.createBiquadFilter();o.type="sine";o.frequency.setValueAtTime(acc?2200:1500,time);o.frequency.exponentialRampToValueAtTime(acc?1600:1100,time+0.02);bp.type="bandpass";bp.frequency.value=acc?2000:1400;bp.Q.value=3;
  g.gain.setValueAtTime(0.0001,time);g.gain.exponentialRampToValueAtTime(acc?0.9:0.6,time+0.0008);g.gain.exponentialRampToValueAtTime(0.0001,time+0.035);o.connect(bp);bp.connect(g);g.connect(typeof clickBus==="function"?clickBus(a):a.destination);o.start(time);o.stop(time+0.05);}catch(e){}};
/* when the worklet becomes available, rebuild compressors so they use it */
function lvProInit(){var a=ac();lvWorklet(a).then(function(ok){if(!ok||!LVE.M)return;Object.keys(LVE.M.tr).forEach(function(id){LVE.M.tr[id].sig="";});Object.keys(LVE.M.ret).forEach(function(id){LVE.M.ret[id].sig="";});try{lvMixParams(LVE.M,LV.set);}catch(e){}});}
