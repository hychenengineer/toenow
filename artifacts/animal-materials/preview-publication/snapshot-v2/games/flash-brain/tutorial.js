(function(win){
  'use strict';
  const id='flash-brain',seen=new Map(),handled=new WeakMap();
  let shell=null,engine=null,release=null,lesson=null,saved=null,replayQueue=[];
  const active=()=>!!win.ToenowTutorials?.isActive(id);
  const key=name=>'toenow_flash_lesson_'+name+'_v1';
  function learned(name){
    if(seen.has(name))return true;
    try{return ['completed','skipped'].includes(win.localStorage.getItem(key(name)));}catch(_){return false;}
  }
  function markLesson(name,value){
    if(!['thorns','priority'].includes(name))return;
    seen.set(name,value);
    try{win.localStorage.setItem(key(name),value);}catch(_){}
  }
  function resetBoard(state){
    const wave=state.waveState,priority=lesson==='priority',thorns=lesson==='thorns';
    wave.config={...wave.config,gridSize:3,priorityAnchorCount:priority?1:0,cyanTargetCount:priority?1:2,decoyCount:thorns?1:0,flashDuration:Infinity};
    wave.cells=Array.from({length:9},(_,index)=>({id:index,row:Math.floor(index/3),col:index%3,
      type:index===0?(priority?'PRIORITY':'TARGET'):index===4?'TARGET':index===2&&thorns?'DECOY':'EMPTY',tapped:false,offending:false}));
    wave.totalTargetsRequired=2;wave.tappedTargetsCount=0;wave.prioritySatisfied=!priority;
    wave.signature='tutorial-'+lesson;state.phase='PHASE_FLASH';state.phaseElapsed=0;state.inputElapsed=0;
    state.score=0;state.combo=1;
    engine?.sync();
  }
  function rememberPrompt(){
    return lesson==='thorns'?'Red beds have thorns. Remember them, but do not tap them.':
      lesson==='priority'?'Remember the beds. Yellow 1 must be tapped first.':'Remember where the elephants are.';
  }
  function getGuide(){
    const state=engine?.getState(),wave=state?.waveState;
    if(!wave)return {waiting:true};
    if(state.phase==='PHASE_FLASH')return {prompt:rememberPrompt(),waiting:true,
      action:{label:'I remember',run(){if(state.phase!=='PHASE_FLASH')return;state.phase='PHASE_INPUT';state.phaseElapsed=0;state.inputElapsed=0;engine.sync();}}};
    const target=wave.cells.find(cell=>!cell.tapped&&cell.type==='PRIORITY')||wave.cells.find(cell=>!cell.tapped&&cell.type==='TARGET');
    const cell=state.cellScreenGeometries.find(cell=>cell.id===target?.id),box=engine.canvas.getBoundingClientRect();
    return {prompt:lesson==='priority'&&!wave.prioritySatisfied?'Tap Yellow 1 first, then the other elephant bed.':'Tap where the elephants were.',
      completePrompt:'You remembered the positions! Ready for the challenge.',
      rect:cell?{x:box.left+cell.centerX-cell.cellSize/2,y:box.top+cell.centerY-cell.cellSize/2,width:cell.cellSize,height:cell.cellSize}:null,
      waiting:!cell,done:wave.tappedTargetsCount>=wave.totalTargetsRequired};
  }
  function register(){
    if(!shell||!engine)return;
    release?.();
    release=win.ToenowTutorials?.register(id,{
      start(options={}){
        lesson=options.lesson||'basic';
        replayQueue=options.replay?['thorns','priority'].filter(learned):[];
        if(!options.lesson){saved=null;shell.start();return;}
        const state=engine.getState();
        saved={waveState:state.waveState,score:state.score,combo:state.combo,phase:state.phase,phaseElapsed:state.phaseElapsed,inputElapsed:state.inputElapsed};
        state.waveState={...state.waveState,config:{...state.waveState.config}};resetBoard(state);
        engine.sync();
      },
      stop(confirmed=false){
        if(saved){const state=engine.getState();Object.assign(state,saved);state.phaseElapsed=0;saved=null;lesson=null;engine.sync();}
        else{shell.stop();lesson=null;}
      },
      markLesson,getGuide
    });
  }
  win.FlashBrainTutorial={
    bindShell(value){shell=value;register();return()=>{if(shell===value){shell=null;release?.();release=null;}};},
    bindEngine(value){engine=value;register();return()=>{if(engine===value){engine=null;release?.();release=null;}};},
    prepare(state){
      if(active()){if(lesson==='basic')resetBoard(state);return;}
    },
    beforeStep(state,shellState){
      if(shellState!=='playing'||active()||state.phase!=='PHASE_PRE_FLASH')return;
      const wave=state.waveState;
      let prompted=handled.get(wave);if(!prompted){prompted=new Set();handled.set(wave,prompted);}
      const next=wave.config.decoyCount>0&&!learned('thorns')&&!prompted.has('thorns')?'thorns':
        wave.config.priorityAnchorCount>0&&!learned('priority')&&!prompted.has('priority')?'priority':null;
      if(next&&win.ToenowTutorials?.showLesson(id,next)){
        prompted.add(next);
      }
    },
    phasePrompt(phase,priorityPending){
      if(phase==='PHASE_CLEAR')return 'Wave cleared!';
      if(phase==='PHASE_PRE_FLASH')return 'Get ready to remember the positions.';
      if(phase==='PHASE_FLASH')return 'Remember where the elephants are.';
      if(phase==='PHASE_BREACH')return 'Missed that one. Watch the next pattern.';
      return priorityPending?'Tap Yellow 1 first, then the other elephant bed.':'Tap where the elephants were.';
    },
    handleResult(result,state){
      if(!active())return false;
      state.score=0;
      if(result.status==='MISTAKE')resetBoard(state);
      if(result.status==='WAVE_CLEARED'){
        if(replayQueue.length){lesson=replayQueue.shift();resetBoard(state);}
        else win.ToenowTutorials.complete(id);
      }
      engine?.sync();
      return true;
    }
  };
})(window);
