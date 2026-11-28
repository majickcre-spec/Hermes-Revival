/* ===== MMU Studio — modeled on Ableton Live: Session + Arrangement views, mixer, devices, clips ===== */
/* part 1: model, storage, undo, helpers */
var LV_COLORS=["#ff94a6","#ffa529","#cc9927","#f7f47c","#bffb00","#1aff2f","#25ffa8","#5cffe8","#8bc5ff","#5480e4","#92a7ff","#d86ce4","#e553a0","#ffffff",
  "#ff3636","#f66c03","#99724b","#fff034","#87ff67","#3dc300","#00bfaf","#19e9ff","#10a4ee","#007dc0","#886ce4","#b677c6","#ff39d4","#d0d0d0"];
var LV_INSTS=[["Keys",[["sf:piano","Grand Piano"],["sf:epiano","Electric Piano"],["sf:organ","Organ"],["sf:vibes","Vibraphone"],["sf:marimba","Marimba"],["sf:musicbox","Music Box"],["sf:celesta","Celesta"],["sf:kalimba","Kalimba"]]],
  ["Strings & Guitar",[["sf:strings","String Ensemble"],["sf:violin","Violin"],["sf:cello","Cello"],["sf:harp","Harp"],["sf:guitar","Nylon Guitar"],["sf:eguitar","Clean Electric"],["sf:bass","Finger Bass"]]],
  ["Winds & Brass",[["sf:flute","Flute"],["sf:clarinet","Clarinet"],["sf:sax","Alto Sax"],["sf:trumpet","Trumpet"],["sf:harmonica","Harmonica"],["sf:panflute","Pan Flute"]]],
  ["Voices",[["sf:choir","Choir Aahs"],["sf:oohs","Voice Oohs"]]],
  ["Synths",[["syn:saw","Saw Lead"],["syn:pad","Warm Pad"],["syn:sub","Sub Bass"],["syn:pluck","Pluck"],["syn:square","Square Keys"],["sf:pad","Sampled Pad"],["sf:lead","Sampled Lead"],["sf:handpan","Steel Drum"]]],
  ["Drum Racks",[["dr:acoustic","Acoustic Kit"],["dr:808","808 Kit"],["dr:classic","Classic Kit"]]]];
var LV_SYN={saw:{w:"sawtooth",cut:2400,res:3,a:0.01,d:0.3,s:0.6,r:0.25,det:8},pad:{w:"sawtooth",cut:1200,res:1,a:0.6,d:1,s:0.8,r:1.4,det:14},
  sub:{w:"sine",cut:600,res:0.5,a:0.005,d:0.2,s:0.9,r:0.15,det:0},pluck:{w:"square",cut:3200,res:4,a:0.002,d:0.25,s:0,r:0.2,det:5},square:{w:"square",cut:1800,res:1,a:0.01,d:0.4,s:0.5,r:0.3,det:3}};
var LV_DRUMMAP={36:["kick","Kick"],37:["rim","Side Stick"],38:["snare","Snare"],39:["clap","Clap"],41:["floor","Floor Tom"],42:["hhc","Closed Hat"],45:["tom2","Mid Tom"],46:["hho","Open Hat"],48:["tom1","Hi Tom"],49:["crash","Crash"],51:["ride","Ride"],56:["cow","Cowbell"]};
var LV_DEVS={
  eq8:{nm:"EQ Eight",ps:[["f1","Low Cut",20,500,30,"Hz",1],["g2","Low Gain",-15,15,0,"dB"],["f2","Low Freq",40,800,120,"Hz",1],["g3","Mid Gain",-15,15,0,"dB"],["f3","Mid Freq",200,8000,1000,"Hz",1],["q3","Mid Q",0.2,8,0.9,""],["g4","High Gain",-15,15,0,"dB"],["f4","High Freq",1500,16000,6000,"Hz",1]]},
  eq3:{nm:"EQ Three",ps:[["lo","Low",-36,6,0,"dB"],["mid","Mid",-36,6,0,"dB"],["hi","High",-36,6,0,"dB"],["flo","FreqLo",50,1000,250,"Hz",1],["fhi","FreqHi",1000,10000,2500,"Hz",1]]},
  filter:{nm:"Auto Filter",ps:[["type","Type",0,2,0,"",0,["Lowpass","Highpass","Bandpass"]],["freq","Freq",40,18000,2000,"Hz",1],["res","Res",0.1,18,1,""],["lfo","LFO",0,100,0,"%"],["rate","Rate",0.05,10,1,"Hz",1]]},
  comp:{nm:"Compressor",ps:[["th","Threshold",-60,0,-18,"dB"],["ratio","Ratio",1,20,4,":1"],["att","Attack",0.1,100,10,"ms",1],["rel","Release",10,1000,120,"ms",1],["knee","Knee",0,30,6,"dB"],["out","Output",-12,24,0,"dB"]]},
  glue:{nm:"Glue Compressor",ps:[["th","Threshold",-40,0,-10,"dB"],["ratio","Ratio",0,2,0,"",0,["2","4","10"]],["att","Attack",0.01,30,0.3,"ms",1],["rel","Release",0.1,1.2,0.4,"s"],["make","Makeup",0,20,2,"dB"],["mix","Dry/Wet",0,100,100,"%"]]},
  sat:{nm:"Saturator",ps:[["drive","Drive",0,36,6,"dB"],["type","Type",0,2,0,"",0,["Analog Clip","Soft Sine","Hard Curve"]],["out","Output",-36,0,-3,"dB"],["mix","Dry/Wet",0,100,100,"%"]]},
  util:{nm:"Utility",ps:[["gain","Gain",-35,35,0,"dB"],["width","Width",0,400,100,"%"],["bal","Balance",-50,50,0,""],["mono","Mono",0,1,0,"",0,["Off","On"]],["phl","Ø L",0,1,0,"",0,["Off","On"]],["phr","Ø R",0,1,0,"",0,["Off","On"]]]},
  delay:{nm:"Delay",ps:[["sync","Time",0,6,3,"",0,["1/32","1/16","1/8","1/8.","1/4","1/4.","1/2"]],["fb","Feedback",0,95,40,"%"],["flt","Filter",300,12000,4000,"Hz",1],["mix","Dry/Wet",0,100,30,"%"]]},
  reverb:{nm:"Reverb",ps:[["decay","Decay",0.3,10,2.5,"s"],["pre","Predelay",0,200,20,"ms"],["tone","Hi Cut",1500,16000,7000,"Hz",1],["mix","Dry/Wet",0,100,30,"%"]]},
  chorus:{nm:"Chorus-Ensemble",ps:[["rate","Rate",0.05,6,0.8,"Hz",1],["amt","Amount",0,100,50,"%"],["mix","Dry/Wet",0,100,50,"%"]]}};
var LV={set:null,view:"session",detail:"clip",sel:{t:0,s:0,arr:null},draw:false,undo:[],redo:[],clip:null,browserOpen:true,mixerOpen:true,keysOn:false,oct:4,vel:100,
  zoom:16,scrollX:0,snap:true,grid:1,insert:0,timeSel:null,follow:true,detH:240,recOffMs:null,dirty:false,saveT:null,mon:{}};
function lvId(){return "x"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function lvKey(s){return (typeof mk==="function"?mk("live",s):"mjk-live-"+s);}
function lvClone(o){return JSON.parse(JSON.stringify(o));}
function lvEsc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function lvInstName(k){for(var i=0;i<LV_INSTS.length;i++)for(var j=0;j<LV_INSTS[i][1].length;j++)if(LV_INSTS[i][1][j][0]===k)return LV_INSTS[i][1][j][1];return "MIDI";}
function lvNewTrack(type,inst,n){var t={id:lvId(),type:type,name:"",color:LV_COLORS[(n*3+(type==="audio"?8:0))%14],inst:inst||null,vol:0,pan:0,on:true,solo:false,arm:false,sendA:0,sendB:0,devs:[],slots:[],arr:[],mon:"off",syn:null};
  t.name=(type==="audio"?"Audio":(inst?lvInstName(inst):"MIDI"));return t;}
function lvTrackLabel(t,i){return (i+1)+" "+t.name;}
function lvNewSet(name){var S={v:1,id:lvId(),name:name||"Untitled Set",bpm:120,sig:4,quant:4,metro:false,countIn:0,loop:{on:false,s:0,l:16},pos:0,
  tracks:[lvNewTrack("midi","sf:piano",0),lvNewTrack("midi","dr:808",1),lvNewTrack("audio",null,2),lvNewTrack("audio",null,3)],
  scenes:[],returns:[{id:"A",name:"Reverb",vol:0,pan:0,on:true},{id:"B",name:"Delay",vol:0,pan:0,on:true}],master:{vol:0},markers:[]};
  S.tracks[1].name="Drum Rack";for(var i=0;i<8;i++)S.scenes.push({id:lvId(),name:""});S.tracks.forEach(function(t){lvFixSlots(S,t);});return S;}
function lvFixSlots(S,t){while(t.slots.length<S.scenes.length)t.slots.push(null);if(t.slots.length>S.scenes.length)t.slots.length=S.scenes.length;}
function lvBar(){return LV.set.sig;}
function lvNewClip(type,len,name){return {id:lvId(),type:type,name:name||"",color:null,len:len||4,notes:type==="midi"?[]:undefined,audio:null,gain:0,trans:0,warp:true,start:0};}
function lvClipColor(c,t){return c.color||t.color;}
/* ---- storage: several sets, each saved under its own key ---- */
function lvSets(){return load(lvKey("sets"),[]);}
function lvSaveNow(){if(!LV.set)return;try{save(lvKey("set-"+LV.set.id),LV.set);var l=lvSets().filter(function(x){return x.id!==LV.set.id;});l.unshift({id:LV.set.id,name:LV.set.name,t:Date.now()});save(lvKey("sets"),l.slice(0,40));save(lvKey("cur"),LV.set.id);}catch(e){lvStatus("Couldn’t save — storage may be full.");}}
function lvSave(){clearTimeout(LV.saveT);LV.saveT=setTimeout(lvSaveNow,400);}
function lvLoadSet(id){var S=load(lvKey("set-"+id),null);if(!S)return null;S.tracks.forEach(function(t){lvFixSlots(S,t);if(!t.devs)t.devs=[];if(!t.arr)t.arr=[];});return S;}
/* ---- undo / redo: whole-set snapshots ---- */
function lvCommit(label){LV.undo.push(JSON.stringify(LV.set));if(LV.undo.length>80)LV.undo.shift();LV.redo=[];LV.lastLabel=label||"";}
function lvUndo(){if(!LV.undo.length)return;LV.redo.push(JSON.stringify(LV.set));LV.set=JSON.parse(LV.undo.pop());lvAfterLoad();lvStatus("Undo");}
function lvRedo(){if(!LV.redo.length)return;LV.undo.push(JSON.stringify(LV.set));LV.set=JSON.parse(LV.redo.pop());lvAfterLoad();lvStatus("Redo");}
function lvAfterLoad(){lvEngineSync();lvSave();lvRender();}
/* ---- finders ---- */
function lvTrack(id){return LV.set.tracks.find(function(t){return t.id===id;});}
function lvTI(t){return LV.set.tracks.indexOf(t);}
function lvSelTrack(){return LV.set.tracks[Math.max(0,Math.min(LV.set.tracks.length-1,LV.sel.t))]||null;}
function lvSelClip(){var t=lvSelTrack();if(!t)return null;if(LV.sel.arr){var a=t.arr.find(function(x){return x.id===LV.sel.arr;});return a?a.clip:null;}return t.slots[LV.sel.s]||null;}
function lvSelArr(){var t=lvSelTrack();if(!t||!LV.sel.arr)return null;return t.arr.find(function(x){return x.id===LV.sel.arr;})||null;}
/* ---- number formats like Live ---- */
function lvDb(v){return v<=-69.5?"-inf":(v>0?"+":"")+(Math.round(v*10)/10).toFixed(1);}
function lvDbGain(db){return db<=-69.5?0:Math.pow(10,db/20);}
function lvFaderToDb(p){if(p<=0.005)return -70;return p>0.2?(p-0.2)/0.8*46-40:-40-(0.2-p)/0.2*30;}
function lvDbToFader(db){if(db<=-69.5)return 0;return db>=-40?0.2+(db+40)/46*0.8:Math.max(0,0.2-(-40-db)/30*0.2);}
function lvPos(b){var sig=LV.set.sig;b=Math.max(0,b);var bar=Math.floor(b/sig)+1,beat=Math.floor(b%sig)+1,six=Math.floor((b%1)*4)+1;return bar+". "+beat+". "+six;}
function lvPanTxt(p){var v=Math.round(p*50);return v===0?"C":(v<0?(-v)+"L":v+"R");}
function lvStatus(msg){var e=document.getElementById("lvStat");if(e)e.textContent=msg||"";}
