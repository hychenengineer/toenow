// Adapter for the existing React shell and memory engine. No separate game UI.
(function(win){
  'use strict';
  const id='flash-brain';let shell=null,engine=null,release=null;
  const active=()=>!!win.ToenowTutorials?.isActive(id);
  function register(){
    if(!shell||!engine)return;
    release?.();
    release=win.ToenowTutorials?.register(id,{
      start(){shell.start();},
      stop(){shell.stop();},
      getGuide(){
        const state=engine.getState(),wave=state?.waveState;
        if(!wave)return {waiting:true};
        if(['PHASE_PRE_FLASH','PHASE_FLASH'].includes(state.phase))return {prompt:'Remember the beds. Yellow 1 goes first. Avoid thorns.',waiting:true};
        const target=wave.cells.find(c=>!c.tapped&&c.type==='PRIORITY')||wave.cells.find(c=>!c.tapped&&c.type==='TARGET');
        const cell=state.cellScreenGeometries.find(c=>c.id===target?.id),box=engine.canvas.getBoundingClientRect();
        return {prompt:wave.prioritySatisfied?'Tap the other remembered flowerbed.':'Tap the remembered beds. Yellow 1 first.',
          rect:cell?{x:box.left+cell.centerX-cell.cellSize/2,y:box.top+cell.centerY-cell.cellSize/2,width:cell.cellSize,height:cell.cellSize}:null,
          waiting:!cell,done:wave.tappedTargetsCount>=wave.totalTargetsRequired};
      }
    });
  }
  win.FlashBrainTutorial={
    bindShell(value){shell=value;register();return()=>{if(shell===value){shell=null;release?.();release=null;}};},
    bindEngine(value){engine=value;register();return()=>{if(engine===value){engine=null;release?.();release=null;}};},
    prepare(state){
      if(!active())return;
      const wave=state.waveState;
      Object.assign(wave.config,{gridSize:3,wave:1,level:1,priorityAnchorCount:1,cyanTargetCount:1,decoyCount:1,preFlashDuration:.6,flashDuration:2.2,retentionDuration:.25});
      wave.cells=Array.from({length:9},(_,index)=>({id:index,row:Math.floor(index/3),col:index%3,type:index===0?'PRIORITY':index===4?'TARGET':index===2?'DECOY':'EMPTY',tapped:false,offending:false}));
      wave.totalTargetsRequired=2;wave.tappedTargetsCount=0;wave.prioritySatisfied=false;wave.signature='tutorial-real-memory-v2';
      state.score=0;state.combo=1;state.globalTimeRemaining=60;
    },
    handleResult(result,state){
      if(!active())return false;
      state.score=0;
      if(result.status==='MISTAKE'){
        for(const cell of state.waveState.cells)cell.offending=false;
        state.phase='PHASE_FLASH';state.phaseElapsed=0;
      }
      engine?.sync();
      if(result.status==='WAVE_CLEARED')win.ToenowTutorials.complete(id);
      return true;
    }
  };
})(window);
