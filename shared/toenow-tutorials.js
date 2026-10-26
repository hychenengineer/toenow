(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./toenow-tutorial-config.js'));
  else {root.ToenowTutorials=factory(root.ToenowTutorialConfig);root.ToenowTutorials.install(root);}
})(globalThis,function(catalog){
  'use strict';
  const VERSION=1;
  function createProgress(storage){
    const memory=new Map();
    const key=id=>'toenow_tutorial_'+id+'_v'+VERSION;
    function status(id){
      if(!catalog[id])throw Error('Unknown tutorial: '+id);
      if(memory.has(id))return memory.get(id);
      try{return storage?.getItem(key(id));}catch(_){return null;}
    }
    return {key,shouldShow(id){return !['completed','skipped'].includes(status(id));},mark(id,value){
      if(!catalog[id]||!['completed','skipped'].includes(value))throw Error('Invalid tutorial completion');
      memory.set(id,value);try{storage?.setItem(key(id),value);}catch(_){}
    }};
  }
  function createLesson(id){
    const spec=catalog[id];if(!spec)throw Error('Unknown tutorial: '+id);
    let index=0,accepted=[];
    return {
      get index(){return index;},get done(){return index===spec.steps.length;},
      get step(){return spec.steps[Math.min(index,spec.steps.length-1)];},
      get accepted(){return accepted.slice();},
      get next(){return this.step.answers[accepted.length];},
      act(value){
        if(this.done)return false;
        const step=this.step;
        const valid=step.unordered?step.answers.includes(value)&&!accepted.includes(value):value===step.answers[accepted.length];
        if(!valid)return false;
        accepted.push(value);
        if(accepted.length===step.answers.length){index++;if(!this.done)accepted=[];}
        return true;
      }
    };
  }
  function install(win){
    const id=/\/games\/([^/]+)/.exec(win.location.pathname)?.[1];
    if(!catalog[id])return;
    const doc=win.document;
    let storage;try{storage=win.localStorage;}catch(_){}
    const progress=createProgress(storage);
    // The tutorial dependency loads before game screen configuration in the head.
    // Resolve IDs at interaction time, after inline and React title mounts finish.
    const screen={
      get startId(){return win.ToenowScreenConfig?.[id]?.startId||'btn-start-game';},
      get titleId(){return win.ToenowScreenConfig?.[id]?.titleId||'menu-screen';}
    };
    let dialog,lesson,pendingStart=false,bypass=false,observationTimer,returnFocus;
    const t=value=>win.ToenowI18n?.t(value)||value;
    function element(tag,className,text){const node=doc.createElement(tag);if(className)node.className=className;if(text)node.textContent=t(text);return node;}
    function button(text,action,className=''){
      const node=element('button','tutorial-choice '+className,text);node.type='button';
      node.dataset.tutorialAction=action;node.addEventListener('click',()=>act(action));return node;
    }
    function titleVisible(){const host=doc.getElementById(screen.titleId);return host&&!host.hidden&&host.getClientRects().length>0&&win.getComputedStyle(host).visibility!=='hidden';}
    function open(start=false){
      if(dialog?.open)return;
      pendingStart=start;returnFocus=doc.activeElement;lesson=createLesson(id);
      dialog=element('dialog','toenow-tutorial');dialog.id='toenow-tutorial';
      dialog.setAttribute('aria-labelledby','tutorial-heading');
      dialog.setAttribute('aria-describedby','tutorial-instruction');
      dialog.addEventListener('cancel',event=>{event.preventDefault();close(false);});
      // Prevent engine-wide Enter/Space/P/Escape listeners from firing behind the modal.
      dialog.addEventListener('keydown',event=>event.stopPropagation());
      doc.body.appendChild(dialog);render();dialog.showModal();
      dialog.querySelector('[data-tutorial-hint]')?.focus();
    }
    function close(launch){
      win.clearTimeout(observationTimer);observationTimer=null;
      dialog?.close();dialog?.remove();dialog=null;
      if(launch&&pendingStart){
        bypass=true;
        try{doc.getElementById(screen.startId)?.click();}finally{bypass=false;pendingStart=false;}
      }else{returnFocus?.isConnected&&returnFocus.focus();pendingStart=false;}
    }
    function act(action){
      if(!lesson||lesson.done)return;
      const oldIndex=lesson.index;
      if(!lesson.act(action)){
        const feedback=dialog.querySelector('[data-tutorial-feedback]');feedback.textContent=t('Try the glowing one. No rush!');return;
      }
      if(lesson.done)progress.mark(id,'completed');
      render();
      // Keep focus inside the new content without jumping to Skip after each action.
      dialog.querySelector('[data-tutorial-hint], [data-tutorial-finish]')?.focus();
      if(oldIndex!==lesson.index)dialog.querySelector('#tutorial-instruction')?.scrollIntoView({block:'nearest'});
    }
    function hint(node,action){
      if(!lesson.done&&((lesson.step.unordered&&!lesson.accepted.includes(action))||lesson.next===action))node.dataset.tutorialHint='true';
      if(lesson.accepted.includes(action)){node.classList.add('tutorial-accepted');node.disabled=true;}
      if(lesson.done)node.disabled=true;
      return node;
    }
    function choices(stage,items){const grid=element('div','tutorial-choices');for(const [text,action]of items)grid.appendChild(hint(button(text,action),action));stage.appendChild(grid);}
    function label(stage,text){stage.appendChild(element('p','tutorial-label',text));}
    function garden(stage,reveal){
      const grid=element('div','tutorial-grid tutorial-garden');
      for(let i=0;i<6;i++){
        const text=reveal?(i===0?'🌼 1':i===4?'🌼':i===2?'🌵':'·'):(lesson.accepted.includes('bed'+i)||lesson.done&&[0,4].includes(i)?'🌼':'▧');
        const node=hint(button(text,'bed'+i),'bed'+i);node.setAttribute('aria-label',t('Flowerbed')+' '+(i+1));
        if(reveal){node.disabled=true;if(i===0)node.classList.add('tutorial-priority');}
        grid.appendChild(node);
      }
      stage.appendChild(grid);
      if(reveal)stage.appendChild(hint(button('I remember — hide them','remember','tutorial-primary'),'remember'));
    }
    function silhouette(pair){
      const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 80');svg.setAttribute('aria-hidden','true');
      for(const shape of pair.split('-')){
        const node=doc.createElementNS('http://www.w3.org/2000/svg',shape==='triangle'?'polygon':shape==='circle'?'circle':'rect');
        const attrs=shape==='triangle'?{points:'40,10 86,70 14,70'}:shape==='circle'?{cx:36,cy:37,r:25}:{x:18,y:15,width:55,height:50};
        for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);svg.appendChild(node);
      }
      return svg;
    }
    function draw(stage){
      const kind=lesson.step.kind;
      if(kind==='numbers')choices(stage,[['3','three'],['1','one'],['2','two']]);
      if(kind==='timber'){
        for(const target of [true,false]){
          label(stage,target?'Target':'Tap away the extra tile');
          const grid=element('div','tutorial-grid tutorial-timber '+(target?'tutorial-target':''));
          for(let i=0;i<9;i++){
            const filled=[0,1,3,4].includes(i)||!target&&i===2&&!lesson.done;
            const node=target?element('div','tutorial-choice',filled?'■':''):button(filled?'■':'','tile'+i);node.classList.toggle('tutorial-wood',filled);
            node.setAttribute('aria-label',t('Tile')+' '+(i+1));
            if(target||!filled||lesson.done)node.disabled=true;else hint(node,'tile'+i);
            grid.appendChild(node);
          }
          stage.appendChild(grid);
        }
      }
      if(kind==='sum'){
        const total=lesson.accepted.reduce((n,v)=>n+(v==='two'?2:3),0);
        label(stage,'Target');stage.appendChild(element('div','tutorial-equation',total+' / 5'));
        choices(stage,[['🌰 2','two'],['🌰 4','four'],['🌰 3','three']]);
      }
      if(kind==='scales'){
        const scale=element('div','tutorial-scale');
        scale.appendChild(element('span','tutorial-pan tutorial-heavy','📦 A'));
        scale.appendChild(element('span','tutorial-pivot','▲'));
        scale.appendChild(element('span','tutorial-pan tutorial-light','📦 B'));
        stage.appendChild(scale);choices(stage,[['📦 A','parcelA'],['📦 B','parcelB']]);
      }
      if(kind==='cards'){
        label(stage,'Target');stage.appendChild(element('div','tutorial-target-card','●'));
        choices(stage,[['▲','triangle'],['●','circle'],['■','square']]);
      }
      if(kind==='photo'){
        const photo=element('div','tutorial-photo','🦋');photo.setAttribute('aria-label',t('Blurry picture'));stage.appendChild(photo);
        choices(stage,[['🐟','fish'],['🦋','butterfly'],['🍃','leaf']]);
      }
      if(kind==='shadows'){
        label(stage,'Target');const target=element('div','tutorial-shadow');target.appendChild(silhouette('circle-triangle'));stage.appendChild(target);
        const grid=element('div','tutorial-choices');
        for(const pair of ['circle-square','circle-triangle','square-triangle']){
          const node=hint(button('',pair),pair);node.setAttribute('aria-label',t(pair));node.appendChild(silhouette(pair));grid.appendChild(node);
        }
        stage.appendChild(grid);
      }
      if(kind.startsWith('otter-')){
        const row=element('div','tutorial-leaves');
        for(let i=0;i<3;i++){
          const node=hint(button((kind==='otter-reveal'&&i===1||lesson.done&&i===2)?'🦦':'🍃','leaf'+i),'leaf'+i);
          if(kind!=='otter-pick')node.disabled=true;
          if(kind==='otter-follow'&&i===1)node.classList.add('tutorial-moving-leaf');
          if(kind==='otter-follow'&&i===2)node.classList.add('tutorial-returning-leaf');
          row.appendChild(node);
        }
        stage.appendChild(row);
        if(kind==='otter-reveal')stage.appendChild(hint(button('Hide and follow','hide','tutorial-primary'),'hide'));
        if(kind==='otter-follow')observationTimer=win.setTimeout(()=>{if(dialog?.open)act('follow');},1600);
      }
      if(kind.startsWith('garden-'))garden(stage,kind==='garden-reveal');
      if(kind==='train'){
        label(stage,'Queue');const queue=hint(button(lesson.accepted.includes('queue')?'🐼 ✓':'🐼 🐼 🐼','queue'),'queue');stage.appendChild(queue);
        label(stage,'Carriage');const car=hint(button(lesson.done?'🚂 🐼 🐼 🐼 ✓':'🚃 🐼 🐼 ＋','carriage'),'carriage');stage.appendChild(car);
      }
    }
    function render(){
      win.clearTimeout(observationTimer);
      // Localization moves its existing switch into the topmost native dialog.
      // Preserve that node across lesson steps instead of creating a second switch.
      const languageSwitch=dialog.querySelector('.toenow-language-switch');
      dialog.replaceChildren();
      const header=element('div','tutorial-header');header.appendChild(element('span','tutorial-badge','Try it — no timer'));
      const cancel=element('button','tutorial-text-button','Close tutorial');cancel.type='button';cancel.addEventListener('click',()=>close(false));header.appendChild(cancel);dialog.appendChild(header);
      const heading=element('h2','',catalog[id].name);heading.id='tutorial-heading';dialog.appendChild(heading);
      const instruction=element('p','tutorial-instruction',lesson.done?'You did it!':lesson.step.prompt);instruction.id='tutorial-instruction';dialog.appendChild(instruction);
      const stage=element('div','tutorial-stage');draw(stage);dialog.appendChild(stage);
      const feedback=element('p','tutorial-feedback',lesson.done?'✓ Ready to play!':'Follow the glow. Try one tap.');feedback.dataset.tutorialFeedback='true';feedback.setAttribute('role','status');dialog.appendChild(feedback);
      if(lesson.done){
        const finish=element('button','tutorial-primary',pendingStart?'START GAME':'Back to title');finish.type='button';finish.dataset.tutorialFinish='true';finish.addEventListener('click',()=>close(true));dialog.appendChild(finish);
      }else{
        const footer=element('div','tutorial-footer');footer.appendChild(element('span','',String(lesson.index+1)+' / '+catalog[id].steps.length));
        const skip=element('button','tutorial-text-button','Skip tutorial');skip.type='button';skip.dataset.tutorialSkip='true';skip.addEventListener('click',()=>{progress.mark(id,'skipped');close(true);});footer.appendChild(skip);dialog.appendChild(footer);
      }
      if(languageSwitch)dialog.appendChild(languageSwitch);
    }
    // Number Pop starts on pointerdown for immediate feedback. Gate that event
    // as well as click so the first pointer cannot launch an engine underneath.
    win.addEventListener('pointerdown',event=>{
      const target=event.target.closest?.('button');
      if(!bypass&&!dialog?.open&&target?.id===screen.startId&&titleVisible()&&progress.shouldShow(id)){
        // Keep the title in place until the matching click, so the pointer's
        // release cannot land on a newly inserted lesson control.
        event.preventDefault();event.stopImmediatePropagation();
      }
    },true);
    // Window capture precedes game handlers, including React's delegated events.
    win.addEventListener('click',event=>{
      if(bypass)return;
      const target=event.target.closest?.('button');if(!target)return;
      if(target.hasAttribute('data-tutorial-replay')){event.preventDefault();event.stopImmediatePropagation();open(false);}
      else if(target.id===screen.startId&&titleVisible()&&progress.shouldShow(id)){
        event.preventDefault();event.stopImmediatePropagation();open(true);
      }
    },true);
    win.addEventListener('keydown',event=>{
      if(dialog?.open){
        if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(false);}
        else event.stopPropagation();
        return;
      }
      if(!bypass&&titleVisible()&&['Enter',' '].includes(event.key)){
        const button=event.target.closest?.('button');
        // Game-wide shortcuts often consume Enter before native button clicks.
        // Explicitly handle the focused title controls ahead of those shortcuts.
        if(button?.hasAttribute('data-tutorial-replay')){
          event.preventDefault();event.stopImmediatePropagation();open(false);
        }else if(progress.shouldShow(id)&&(button?.id===screen.startId||!event.target.closest?.('button,a,input,select,textarea,summary'))){
          event.preventDefault();event.stopImmediatePropagation();open(true);
        }
      }
    },true);
    win.ToenowI18n?.subscribe(()=>{if(dialog?.open)render();});
    return {open,progress};
  }
  return {catalog,createProgress,createLesson,install};
});
