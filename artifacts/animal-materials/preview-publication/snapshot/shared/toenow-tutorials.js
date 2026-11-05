(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./toenow-tutorial-config.js'));
  else {root.ToenowTutorials=factory(root.ToenowTutorialConfig);root.ToenowTutorials.install(root);}
})(globalThis,function(catalog){
  'use strict';
  const VERSION=2,adapters=new Map(),installations=new Map();let current=null,refresh=()=>{};
  function createProgress(storage){
    const memory=new Map(),key=id=>'toenow_tutorial_'+id+'_v'+VERSION;
    return {key,shouldShow(id){
      if(!catalog[id])throw Error('Unknown tutorial: '+id);
      let value=memory.get(id);if(!value)try{value=storage?.getItem(key(id));}catch(_){}
      return !['completed','skipped'].includes(value);
    },mark(id,value){
      if(!catalog[id]||!['completed','skipped'].includes(value))throw Error('Invalid tutorial completion');
      memory.set(id,value);try{storage?.setItem(key(id),value);}catch(_){}
    }};
  }
  function createSession(id,adapter,progress,options={}){
    if(!catalog[id]||!adapter||!['start','stop','getGuide'].every(k=>typeof adapter[k]==='function'))throw Error('Invalid game tutorial adapter: '+id);
    let active=false,done=false;
    return {id,get active(){return active;},get done(){return done;},
      start(){if(active)return;active=true;adapter.start(options);},
      stop(confirmed=false){if(!active)return;adapter.stop(confirmed);active=false;},
      complete(){if(!active||done)return;done=true;progress.mark(id,'completed');},
      skip(){if(active&&!done)progress.mark(id,'skipped');},
      guide(){return active?adapter.getGuide():null;}
    };
  }
  function register(id,adapter){
    if(!catalog[id])throw Error('Unknown tutorial: '+id);
    adapters.set(id,adapter);return()=>{if(adapters.get(id)===adapter)adapters.delete(id);};
  }
  function isActive(id){return !!current?.active&&current.id===id;}
  function isComplete(id){return isActive(id)&&current.done;}
  function complete(id){if(!isActive(id))return false;current.complete();refresh();return true;}
  function getState(){return current?{id:current.id,active:current.active,complete:current.done,guide:current.guide()}:null;}
  function showLesson(id,lesson){return installations.get(id)?.(false,{lesson})||false;}
  function getViewport(win=globalThis){
    const region=win.document?.getElementById('toenow-tutorial-game');
    return {width:region?.clientWidth||win.innerWidth,height:region?.clientHeight||win.innerHeight};
  }
  function install(win){
    const id=/\/games\/([^/]+)/.exec(win.location.pathname)?.[1];if(!catalog[id])return;
    const doc=win.document;let storage;try{storage=win.localStorage;}catch(_){}
    const progress=createProgress(storage);
    const screen={get startId(){return win.ToenowScreenConfig?.[id]?.startId||'btn-start-game';},get titleId(){return win.ToenowScreenConfig?.[id]?.titleId||'menu-screen';}};
    let coach,highlight,gameRegion,prompt,finish,skip,cancel,advance,pendingStart=false,bypass=false,raf,returnFocus,sessionOptions={};
    const t=value=>win.ToenowI18n?.t(value)||value;
    function el(tag,className,text){const n=doc.createElement(tag);if(className)n.className=className;if(text)n.textContent=t(text);return n;}
    function control(text,action,attribute){const n=el('button','tutorial-coach-button',text);n.type='button';n.setAttribute(attribute,'');n.addEventListener('click',action);return n;}
    function titleVisible(){const n=doc.getElementById(screen.titleId);return n&&!n.hidden&&n.getClientRects().length>0&&win.getComputedStyle(n).visibility!=='hidden';}
    function close(launch){
      if(!current)return;win.cancelAnimationFrame(raf);
      // The engine must clean up while protection is still enabled.
      current.stop(launch);current=null;coach?.remove();highlight?.remove();coach=highlight=null;
      delete doc.body.dataset.tutorial;
      if(gameRegion){gameRegion.replaceWith(...gameRegion.childNodes);gameRegion=null;}
      win.dispatchEvent(new win.Event('resize'));
      if(launch&&pendingStart){
        pendingStart=false;
        // React mounts its title host asynchronously after the engine stops.
        // Launch only once the current, real Start button is available again.
        let attempts=0;
        const resume=()=>{
          const button=doc.getElementById(screen.startId);
          if(button&&titleVisible()){
            bypass=true;try{button.click();}finally{bypass=false;}
          }else if(++attempts<120)win.requestAnimationFrame(resume);
          else console.error('Title did not return after tutorial: '+id);
        };
        resume();
      }else{pendingStart=false;if(returnFocus?.isConnected)returnFocus.focus();}
    }
    function render(){
      if(!current?.active||!coach)return;
      const guide=current.guide()||{};
      if(guide.done&&!current.done)current.complete();
      const done=current.done;
      const text=t(done?(guide.completePrompt||'You did it!'):guide.prompt||catalog[id].prompt);
      if(prompt.textContent!==text)prompt.textContent=text;
      finish.hidden=!done;finish.textContent=t(sessionOptions.lesson?(guide.finishLabel||'Continue challenge'):pendingStart?'START GAME':'Back to title');
      advance.hidden=done||!guide.action;advance.textContent=t(guide.action?.label||'Continue');
      skip.hidden=done;skip.textContent=t('Skip tutorial');cancel.textContent=t('Close tutorial');
      coach.querySelector('[data-tutorial-badge]').textContent=t(guide.badge||'Tutorial — no timer, no score');
      const rect=guide.rect;
      highlight.hidden=done||!rect||guide.waiting===true;
      if(!highlight.hidden){
        const width=Math.max(20,rect.width),height=Math.max(20,rect.height);
        Object.assign(highlight.style,{left:rect.x+'px',top:rect.y+'px',width:width+'px',height:height+'px'});
      }
    }
    function frame(){render();if(current?.active)raf=win.requestAnimationFrame(frame);}
    function open(start=false,options={}){
      if(current?.active)return false;
      const adapter=adapters.get(id);
      if(!adapter){console.error('Tutorial adapter not ready: '+id);return;}
      pendingStart=start;returnFocus=doc.activeElement;sessionOptions=options;
      const sessionProgress=options.lesson?{mark:(_,value)=>adapter.markLesson?.(options.lesson,value)}:progress;
      current=createSession(id,adapter,sessionProgress,{...options,replay:!start&&!options.lesson});doc.body.dataset.tutorial=id;
      // A containing block gives fixed HUDs and canvases a real, smaller viewport.
      // Keep the original nodes/listeners and restore them when the lesson closes.
      gameRegion=el('div','toenow-tutorial-game');gameRegion.id='toenow-tutorial-game';
      const nodes=[...doc.body.children].filter(n=>!['SCRIPT','STYLE','LINK'].includes(n.tagName));
      gameRegion.append(...nodes);doc.body.append(gameRegion);
      current.start();
      win.dispatchEvent(new win.Event('resize'));
      coach=el('section','toenow-coach');coach.id='toenow-tutorial';coach.dataset.i18nIgnore='';coach.setAttribute('role','region');coach.setAttribute('aria-label',t('Play tutorial'));
      const header=el('div','tutorial-coach-header');const badge=el('span','','Tutorial — no timer, no score');badge.dataset.tutorialBadge='';header.appendChild(badge);
      cancel=control('Close tutorial',()=>close(false),'data-tutorial-cancel');coach.appendChild(header);
      prompt=el('p','tutorial-coach-prompt');prompt.id='tutorial-instruction';prompt.setAttribute('role','status');prompt.setAttribute('aria-live','polite');coach.appendChild(prompt);
      const controls=el('div','tutorial-coach-actions');
      advance=control('Continue',()=>{if(!current?.done)current?.guide()?.action?.run();render();},'data-tutorial-advance');controls.appendChild(advance);
      skip=control('Skip tutorial',()=>{current.skip();close(true);},'data-tutorial-skip');controls.appendChild(skip);
      controls.appendChild(cancel);
      finish=control('START GAME',()=>close(true),'data-tutorial-finish');controls.appendChild(finish);coach.appendChild(controls);
      coach.addEventListener('keydown',event=>event.stopPropagation());
      highlight=el('div','tutorial-real-target');highlight.id='toenow-tutorial-highlight';highlight.setAttribute('aria-hidden','true');
      doc.body.append(highlight,coach);refresh=render;render();raf=win.requestAnimationFrame(frame);
      return true;
    }
    function tutorialControl(target){return !!target.closest?.('#toenow-tutorial,.toenow-language-switch');}
    function blockedGameControl(target){
      const button=target.closest?.('button');
      return !!button&&!tutorialControl(button)&&(
        button.hasAttribute('data-start')||/restart|pause|resume|menu|continue|exit|title|help/i.test(button.id)||
        /restart|pause/i.test(button.getAttribute('aria-label')||'')
      );
    }
    win.addEventListener('pointerdown',event=>{
      if(bypass)return;
      if(current?.active){
        if(!tutorialControl(event.target)&&(current.done||blockedGameControl(event.target))){event.preventDefault();event.stopImmediatePropagation();}
        return;
      }
      const button=event.target.closest?.('button');
      if(button?.id===screen.startId&&titleVisible()&&progress.shouldShow(id)){event.preventDefault();event.stopImmediatePropagation();}
    },true);
    win.addEventListener('click',event=>{
      if(bypass)return;
      if(current?.active){
        if(!tutorialControl(event.target)&&(current.done||blockedGameControl(event.target))){event.preventDefault();event.stopImmediatePropagation();}
        return;
      }
      const button=event.target.closest?.('button');if(!button)return;
      if(button.hasAttribute('data-tutorial-replay')){event.preventDefault();event.stopImmediatePropagation();open(false);}
      else if(button.id===screen.startId&&titleVisible()&&progress.shouldShow(id)){event.preventDefault();event.stopImmediatePropagation();open(true);}
    },true);
    win.addEventListener('keydown',event=>{
      if(current?.active){
        if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(false);}
        else if(!tutorialControl(event.target)&&['Enter',' ','r','R','p','P'].includes(event.key)){
          event.preventDefault();event.stopImmediatePropagation();
          const button=event.target.closest?.('button');
          // Preserve keyboard activation of the game's actual choice buttons,
          // while preventing engine-wide start/restart shortcuts underneath.
          if(['Enter',' '].includes(event.key)&&button&&!button.disabled&&!current.done&&!blockedGameControl(button))button.click();
        }
        return;
      }
      if(!bypass&&titleVisible()&&['Enter',' '].includes(event.key)){
        const button=event.target.closest?.('button');
        if(button?.hasAttribute('data-tutorial-replay')){event.preventDefault();event.stopImmediatePropagation();open(false);}
        else if(progress.shouldShow(id)&&(button?.id===screen.startId||!event.target.closest?.('button,a,input,select,textarea,summary'))){event.preventDefault();event.stopImmediatePropagation();open(true);}
      }
    },true);
    installations.set(id,open);
    win.ToenowI18n?.subscribe(()=>render());
    return {open,progress};
  }
  return {catalog,createProgress,createSession,register,isActive,isComplete,complete,getState,showLesson,getViewport,install};
});
