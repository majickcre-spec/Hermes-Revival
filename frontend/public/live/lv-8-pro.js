/* part 8: professional sound engine — analog synth, modeled 808/909 drums, velocity-aware sampler, return device chains,
   new reverb + ping-pong delay, worklet compressor with sidechain, WSOLA time-stretch warping */
/* ---------- instruments list ---------- */
var LV_SYN2={
 saw:{nm:"Supersaw Lead",o1:"sawtooth",o2:"sawtooth",o2oct:0,o2det:12,o2lvl:0.7,sub:0,noise:0,uni:4,spread:22,width:0.8,ft:0,cut:2600,res:2,fenv:2.5,fa:0.005,fd:0.35,fs:0.35,fr:0.3,a:0.004,d:0.3,s:0.75,r:0.28,lfoR:5,lfoP:0,lfoF:0,glide:0,vel:0.5,drive:0.15,lvl:0.8},
 pad:{nm:"Warm Pad",o1:"sawtooth",o2:"triangle",o2oct:1,o2det:6,o2lvl:0.5,sub:0.2,noise:0.02,uni:3,spread:18,width:1,ft:0,cut:900,res:1,fenv:1.2,fa:1.2,fd:2,fs:0.4,fr:2,a:0.9,d:1.5,s:0.85,r:2.2,lfoR:0.25,lfoP:0,lfoF:0.4,glide:0,vel:0.3,drive:0,lvl:0.75},
 ambient:{nm:"Ambient Pad",o1:"sawtooth",o2:"sawtooth",o2oct:1,o2det:10,o2lvl:0.6,sub:0,noise:0.06,uni:4,spread:30,width:1,ft:0,cut:600,res:0.8,fenv:1.5,fa:3,fd:4,fs:0.5,fr:4,a:2.5,d:3,s:0.9,r:4,lfoR:0.12,lfoP:0,lfoF:0.8,glide:0,vel:0.2,drive:0,lvl:0.7},
 sub:{nm:"Sub Bass",o1:"sine",o2:"triangle",o2oct:0,o2det:0,o2lvl:0.25,sub:0,noise:0,uni:1,spread:0,width:0,ft:1,cut:420,res:0.7,fenv:0.6,fa:0.002,fd:0.12,fs:0.2,fr:0.1,a:0.003,d:0.25,s:0.95,r:0.12,lfoR:0,lfoP:0,lfoF:0,glide:0.04,vel:0.4,drive:0.35,lvl:0.95},
 reese:{nm:"Reese Bass",o1:"sawtooth",o2:"sawtooth",o2oct:0,o2det:18,o2lvl:1,sub:0.5,noise:0,uni:2,spread:14,width:0.5,ft:0,cut:700,res:2,fenv:1,fa:0.01,fd:0.4,fs:0.6,fr:0.2,a:0.005,d:0.3,s:0.9,r:0.15,lfoR:0.3,lfoP:0,lfoF:0.3,glide:0,vel:0.3,drive:0.4,lvl:0.85},
 acid:{nm:"Acid Bass",o1:"sawtooth",o2:"sawtooth",o2oct:0,o2det:0,o2lvl:0,sub:0,noise:0,uni:1,spread:0,width:0,ft:0,cut:300,res:14,fenv:4,fa:0.001,fd:0.18,fs:0.1,fr:0.1,a:0.001,d:0.2,s:0.7,r:0.08,lfoR:0,lfoP:0,lfoF:0,glide:0.06,vel:0.9,drive:0.5,lvl:0.75},
 pluck:{nm:"Pluck",o1:"sawtooth",o2:"square",o2oct:1,o2det:5,o2lvl:0.35,sub:0,noise:0.03,uni:2,spread:10,width:0.6,ft:0,cut:500,res:3,fenv:4.5,fa:0.001,fd:0.22,fs:0,fr:0.2,a:0.001,d:0.45,s:0,r:0.3,lfoR:0,lfoP:0,lfoF:0,glide:0,vel:0.8,drive:0.1,lvl:0.8},
 brass:{nm:"Analog Brass",o1:"sawtooth",o2:"sawtooth",o2oct:0,o2det:9,o2lvl:0.8,sub:0,noise:0,uni:2,spread:8,width:0.5,ft:0,cut:600,res:1,fenv:2.6,fa:0.08,fd:0.5,fs:0.5,fr:0.3,a:0.05,d:0.4,s:0.8,r:0.3,lfoR:5,lfoP:4,lfoF:0,glide:0,vel:0.6,drive:0.2,lvl:0.75},
 keys:{nm:"Soft Keys",o1:"triangle",o2:"sine",o2oct:1,o2det:0,o2lvl:0.3,sub:0,noise:0,uni:1,spread:0,width:0.3,ft:1,cut:2400,res:0.7,fenv:1.2,fa:0.002,fd:0.6,fs:0.2,fr:0.4,a:0.003,d:1.2,s:0.3,r:0.4,lfoR:0,lfoP:0,lfoF:0,glide:0,vel:0.8,drive:0,lvl:1.25},
 square:{nm:"Square Lead",o1:"square",o2:"square",o2oct:-1,o2det:3,o2lvl:0.4,sub:0,noise:0,uni:1,spread:0,width:0.3,ft:0,cut:2200,res:1.5,fenv:1.5,fa:0.005,fd:0.3,fs:0.5,fr:0.3,a:0.005,d:0.2,s:0.8,r:0.2,lfoR:5.5,lfoP:8,lfoF:0,glide:0.03,vel:0.5,drive:0.1,lvl:0.7}};
var LV_SYNP=[["Oscillators",[["o2oct","Osc 2 Oct",-2,2,1],["o2det","Osc 2 Detune",-50,50],["o2lvl","Osc 2 Level",0,1],["sub","Sub",0,1],["noise","Noise",0,1],["uni","Unison",1,6,1],["spread","Spread",0,50],["width","Width",0,1]]],
  ["Filter",[["cut","Cutoff",40,18000,0,1],["res","Resonance",0.3,20],["fenv","Env Amount",-4,6],["fa","F Attack",0.001,4,0,1],["fd","F Decay",0.01,6,0,1],["fs","F Sustain",0,1],["fr","F Release",0.01,8,0,1],["drive","Drive",0,1]]],
  ["Amp",[["a","Attack",0.001,5,0,1],["d","Decay",0.01,6,0,1],["s","Sustain",0,1],["r","Release",0.01,8,0,1],["vel","Velocity",0,1],["lvl","Level",0,1.2]]],
  ["LFO & Glide",[["lfoR","LFO Rate",0.05,12,0,1],["lfoP","→ Pitch",0,50],["lfoF","→ Filter",0,2],["glide","Glide",0,0.5]]]];
(function(){var g=LV_INSTS.find(function(x){return x[0]==="Synths";});g[1]=Object.keys(LV_SYN2).map(function(k){return ["syn:"+k,LV_SYN2[k].nm];}).concat([["sf:pad","Sampled Pad"],["sf:lead","Sampled Lead"],["sf:handpan","Steel Drum"]]);
  var d=LV_INSTS.find(function(x){return x[0]==="Drum Racks";});d[1]=[["dr:acoustic","Acoustic Kit"],["dr:808","808 Kit"],["dr:909","909 Kit"]];})();
function lvSynP(t){var k=(t.inst||"syn:saw").slice(4);return Object.assign({},LV_SYN2.saw,LV_SYN2[k]||LV_SYN2.saw,t.syn||{});}
var LVNOISE=null;function lvNoiseBuf(a){if(LVNOISE&&LVNOISE.sampleRate===a.sampleRate)return LVNOISE;var n=a.sampleRate*2,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(var i=0;i<n;i++)d[i]=Math.random()*2-1;LVNOISE=b;return b;}
var LVCURVE={};function lvTanh(k){k=Math.round(k*20)/20;if(LVCURVE[k])return LVCURVE[k];var n=1024,c=new Float32Array(n),g=1+k*6;for(var i=0;i<n;i++){var x=i/(n-1)*2-1;c[i]=Math.tanh(x*g)/Math.tanh(g);}return LVCURVE[k]=c;}
/* ---------- analog-style synth voice ---------- */
function lvSynVoice(X,t,m,when,dur,vel,out){var a=X.a,P=lvSynP(t),vs=Math.max(0.05,Math.min(1,(vel||100)/127)),va=1-P.vel+P.vel*vs,f=440*Math.pow(2,(m-69)/12),end=when+Math.max(0.03,dur),stopAt=end+P.r*1.4+0.1;
  X.lastF=X.lastF||{};var gl=P.glide>0.001?X.lastF[t.id]:null;X.lastF[t.id]=f;
  var mix=a.createGain();mix.gain.value=1;var node=mix;
  if(P.drive>0.01){var sh=a.createWaveShaper();sh.curve=lvTanh(P.drive);sh.oversample="2x";mix.connect(sh);node=sh;}
  var fl=[],nf=(P.ft|0)===0?2:1,ftype=["lowpass","lowpass","highpass","bandpass"][P.ft|0]||"lowpass";for(var i=0;i<nf;i++){var bq=a.createBiquadFilter();bq.type=ftype;bq.Q.value=nf===2?Math.max(0.3,P.res*0.7):P.res;node.connect(bq);node=bq;fl.push(bq);}
  var amp=a.createGain();node.connect(amp);amp.connect(out);
  /* filter envelope (exponential, Hz) */
  var base=Math.max(30,Math.min(18000,P.cut*(0.55+0.45*va))),peak=Math.max(30,Math.min(19000,base*Math.pow(2,P.fenv*va))),sus=Math.max(30,Math.min(19000,base*Math.pow(2,P.fenv*va*P.fs)));
  fl.forEach(function(q){var fr=q.frequency;fr.setValueAtTime(base,when);fr.exponentialRampToValueAtTime(peak,when+Math.max(0.001,P.fa));fr.setTargetAtTime(sus,when+P.fa,Math.max(0.005,P.fd/3));fr.setValueAtTime(sus,end);fr.setTargetAtTime(base,end,Math.max(0.005,P.fr/3));});
  var pk=0.22*P.lvl*va;amp.gain.setValueAtTime(0.0001,when);amp.gain.linearRampToValueAtTime(pk,when+Math.max(0.002,P.a));amp.gain.setTargetAtTime(Math.max(0.0001,pk*P.s),when+P.a,Math.max(0.005,P.d/3));
  amp.gain.setValueAtTime(Math.max(0.0001,P.s>0.001?pk*P.s:pk*Math.exp(-dur/Math.max(0.01,P.d/3))),end);amp.gain.setTargetAtTime(0.0001,end,Math.max(0.005,P.r/4));
  var lfo=null;if(P.lfoR>0.01&&(P.lfoP>0.1||P.lfoF>0.01)){lfo=a.createOscillator();lfo.frequency.value=P.lfoR;lfo.start(when);lfo.stop(stopAt);if(P.lfoF>0.01){var lf=a.createGain();lf.gain.value=base*P.lfoF*0.5;lfo.connect(lf);fl.forEach(function(q){lf.connect(q.frequency);});}}
  var oscs=[],U=Math.max(1,Math.round(P.uni)),addOsc=function(type,freq,det,lvl,pan){var o=a.createOscillator();o.type=type;o.detune.value=det;if(gl){o.frequency.setValueAtTime(gl*freq/f,when);o.frequency.exponentialRampToValueAtTime(freq,when+P.glide);}else o.frequency.value=freq;
    var g=a.createGain();g.gain.value=lvl;o.connect(g);if(pan&&a.createStereoPanner){var p=a.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(mix);}else g.connect(mix);
    if(lfo&&P.lfoP>0.1){var lp=a.createGain();lp.gain.value=P.lfoP;lfo.connect(lp);lp.connect(o.detune);}o.start(when);o.stop(stopAt);oscs.push(o);};
  var norm=1/Math.sqrt(U);for(var u=0;u<U;u++){var sp=U>1?(u/(U-1)-0.5)*2:0;addOsc(P.o1,f,sp*P.spread,norm,sp*P.width);if(P.o2lvl>0.01)addOsc(P.o2,f*Math.pow(2,Math.round(P.o2oct)),sp*P.spread+P.o2det,P.o2lvl*norm,-sp*P.width);}
  if(P.sub>0.01)addOsc("sine",f/2,0,P.sub,0);
  if(P.noise>0.005){var nb=a.createBufferSource();nb.buffer=lvNoiseBuf(a);nb.loop=true;var ng=a.createGain();ng.gain.value=P.noise*0.6;nb.connect(ng);ng.connect(mix);nb.start(when,Math.random());nb.stop(stopAt);oscs.push(nb);}
  oscs.forEach(function(o,i){X.voices.push({s:o,g:amp,end:stopAt,rel:P.r,f:i===0?fl[0]&&fl[0].frequency:null,fb:base});});}
/* ---------- modeled drum machines ---------- */
var LV_METAL=[205.3,304.4,369.6,522.7,540,800];
function lvMetal(a,t,mul,end){var mg=a.createGain();mg.gain.value=0.16;LV_METAL.forEach(function(f){var o=a.createOscillator();o.type="square";o.frequency.value=f*mul;o.connect(mg);o.start(t);o.stop(end);});return mg;}
function lvEnvG(a,t,peak,dec,curve){var g=a.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+0.0015);g.gain.setTargetAtTime(0.0001,t+0.0015,Math.max(0.003,dec/(curve||4.5)));return g;}
function lvNoiseSrc(a,t,len){var s=a.createBufferSource();s.buffer=lvNoiseBuf(a);s.start(t,Math.random()*1.5);s.stop(t+len);return s;}
function lvFilt(a,type,f,q){var b=a.createBiquadFilter();b.type=type;b.frequency.value=f;if(q!=null)b.Q.value=q;return b;}
function lvDrumSynth(a,out,t,id,kit,tune,dec){var tm=Math.pow(2,(tune||0)/12),dk=dec||1,is9=kit==="909";
  var osc=function(type,f){var o=a.createOscillator();o.type=type;o.frequency.value=f;return o;};
  if(id==="kick"){var f0=(is9?52:47)*tm,o=osc("sine",f0),len=(is9?0.5:0.95)*dk+0.05,g=lvEnvG(a,t,1,len,is9?4:3.2),sh=a.createWaveShaper();sh.curve=lvTanh(is9?0.45:0.25);
    o.frequency.setValueAtTime(f0*(is9?6:3.3),t);o.frequency.exponentialRampToValueAtTime(f0*1.04,t+(is9?0.045:0.03));o.frequency.exponentialRampToValueAtTime(f0*0.92,t+len);o.connect(sh);sh.connect(g);g.connect(out);o.start(t);o.stop(t+len+0.05);
    var c=lvNoiseSrc(a,t,0.02),cf=lvFilt(a,"bandpass",is9?4200:2500,0.9),cg=lvEnvG(a,t,is9?0.55:0.3,is9?0.012:0.006,3);c.connect(cf);cf.connect(cg);cg.connect(out);return;}
  if(id==="snare"){var len2=(is9?0.26:0.2)*dk;[[is9?180:185,0.55],[is9?330:330,0.32]].forEach(function(p){var o2=osc("triangle",p[0]*tm),g2=lvEnvG(a,t,p[1],0.12*dk,4);if(is9){o2.frequency.setValueAtTime(p[0]*tm*1.18,t);o2.frequency.exponentialRampToValueAtTime(p[0]*tm,t+0.03);}o2.connect(g2);g2.connect(out);o2.start(t);o2.stop(t+0.4*dk);});
    var n=lvNoiseSrc(a,t,len2+0.1),hp=lvFilt(a,"highpass",is9?1400:1800),lp=lvFilt(a,"lowpass",is9?10000:7500),ng=lvEnvG(a,t,is9?0.85:0.6,len2,4);n.connect(hp);hp.connect(lp);lp.connect(ng);ng.connect(out);return;}
  if(id==="hhc"||id==="hho"){var open=id==="hho",ln=(open?(is9?0.38:0.5):(is9?0.05:0.055))*dk,end=t+ln+0.05,mtl=lvMetal(a,t,tm,end),bp=lvFilt(a,"bandpass",10000,0.7),hp2=lvFilt(a,"highpass",7000),g3=lvEnvG(a,t,is9?1.1:2.6,ln,open?3.5:4.5);
    mtl.connect(bp);if(is9){var n2=lvNoiseSrc(a,t,ln+0.05),ng2=a.createGain();ng2.gain.value=0.5;n2.connect(ng2);ng2.connect(bp);}bp.connect(hp2);hp2.connect(g3);g3.connect(out);return;}
  if(id==="crash"||id==="ride"){var ride=id==="ride",ln2=(ride?1.3:1.8)*dk,mt2=lvMetal(a,t,tm*(ride?1.18:1),t+ln2+0.1),bp2=lvFilt(a,"bandpass",ride?7500:8500,0.6),hp3=lvFilt(a,"highpass",ride?4500:3500),g4=lvEnvG(a,t,ride?0.4:0.5,ln2,3.5);
    mt2.connect(bp2);var n3=lvNoiseSrc(a,t,ln2+0.1),ng3=a.createGain();ng3.gain.value=ride?0.25:0.6;n3.connect(ng3);ng3.connect(bp2);bp2.connect(hp3);hp3.connect(g4);g4.connect(out);
    if(ride){var bl=osc("sine",3100*tm),bg=lvEnvG(a,t,0.12,0.5,4);bl.connect(bg);bg.connect(out);bl.start(t);bl.stop(t+0.7);}return;}
  if(id==="clap"){var n4=lvNoiseSrc(a,t,0.4*dk+0.1),bp4=lvFilt(a,"bandpass",is9?1500:1100,0.9),g5=a.createGain();g5.gain.setValueAtTime(0.0001,t);
    [0,0.009,0.018,0.027].forEach(function(o,i){g5.gain.setValueAtTime(1.3,t+o);g5.gain.setTargetAtTime(0.05,t+o+0.001,0.003);});g5.gain.setValueAtTime(0.85,t+0.03);g5.gain.setTargetAtTime(0.0001,t+0.03,0.05*dk);n4.connect(bp4);bp4.connect(g5);g5.connect(out);return;}
  if(id==="tom1"||id==="tom2"||id==="floor"){var tf=({tom1:220,tom2:160,floor:108})[id]*tm,o5=osc("sine",tf),g6=lvEnvG(a,t,0.85,0.4*dk,4);o5.frequency.setValueAtTime(tf*1.5,t);o5.frequency.exponentialRampToValueAtTime(tf,t+0.06);o5.connect(g6);g6.connect(out);o5.start(t);o5.stop(t+0.6*dk);
    var n5=lvNoiseSrc(a,t,0.05),f5=lvFilt(a,"bandpass",tf*6,1),g7=lvEnvG(a,t,0.12,0.03,3);n5.connect(f5);f5.connect(g7);g7.connect(out);return;}
  if(id==="rim"){var o6=osc("triangle",1700*tm),g8=lvEnvG(a,t,0.6,0.03,3);o6.connect(g8);g8.connect(out);o6.start(t);o6.stop(t+0.08);var n6=lvNoiseSrc(a,t,0.04),f6=lvFilt(a,"bandpass",3200,2),g9=lvEnvG(a,t,0.4,0.02,3);n6.connect(f6);f6.connect(g9);g9.connect(out);return;}
  if(id==="cow"){var bp6=lvFilt(a,"bandpass",2640*tm,1.8),g10=a.createGain();g10.gain.setValueAtTime(0.0001,t);g10.gain.linearRampToValueAtTime(0.5,t+0.002);g10.gain.setTargetAtTime(0.15,t+0.002,0.015);g10.gain.setTargetAtTime(0.0001,t+0.06,0.08*dk);
    [540,800].forEach(function(f){var o7=osc("square",f*tm);o7.connect(bp6);o7.start(t);o7.stop(t+0.5*dk+0.1);});bp6.connect(g10);g10.connect(out);return;}}
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
var LVRB={};function lvReverbIR(a,P){var key=[a.sampleRate,P.size,P.decay,P.damp,P.width].map(function(x){return Math.round(x*100)/100;}).join("|");if(LVRB[key])return LVRB[key];
  var sr=a.sampleRate,T=Math.min(12,P.decay),len=Math.floor(sr*(T*1.25+0.12)),b=a.createBuffer(2,len,sr),L=b.getChannelData(0),R=b.getChannelData(1),er=Math.floor(sr*0.012*P.size*6),k=6.9/(T*sr),kh=6.9/(Math.max(0.15,T*(1.05-P.damp))*sr),kl=6.9/(T*1.18*sr);
  for(var ch=0;ch<2;ch++){var d=ch?R:L,lp=0,lp2=0;for(var i=0;i<len;i++){var w=Math.random()*2-1;lp+=0.08*(w-lp);lp2+=0.5*(w-lp2);var low=lp,high=w-lp2,mid=lp2-lp;
      var v=low*Math.exp(-i*kl)*1.6+mid*Math.exp(-i*k)+high*Math.exp(-i*kh)*0.8;d[i]=v*(i<er?Math.pow(i/er,1.5):1)*0.6;}}
  /* early reflections */
  for(var r=0;r<14;r++){var tt=Math.floor(sr*(0.004+Math.random()*0.075*P.size)),gn=(0.6-r*0.03)*(Math.random()*0.5+0.5),side=Math.random();if(tt<len){L[tt]+=gn*(side<0.5?1:0.55);R[tt+Math.floor(sr*0.0007*Math.random())]+=gn*(side>=0.5?1:0.55);}}
  /* width (mid/side) and normalize */
  var w=P.width/100,pk=0;for(var j=0;j<len;j++){var mm=(L[j]+R[j])/2,ss=(L[j]-R[j])/2*w;L[j]=mm+ss;R[j]=mm-ss;pk=Math.max(pk,Math.abs(L[j]),Math.abs(R[j]));}var nrm=0.5/Math.max(1e-6,pk);for(var q=0;q<len;q++){L[q]*=nrm;R[q]*=nrm;}
  var ks=Object.keys(LVRB);if(ks.length>12)delete LVRB[ks[0]];return LVRB[key]=b;}
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
