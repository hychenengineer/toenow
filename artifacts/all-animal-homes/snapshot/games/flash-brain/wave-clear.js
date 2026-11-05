(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FlashBrainWaveClear=api;
})(globalThis,function(root){
  'use strict';
  let host,heading,detail,next;
  function describe(state,shell){
    return shell==='playing'&&state.phase==='PHASE_CLEAR'?{wave:state.waveState.config.wave}:null;
  }
  function update(state,shell){
    const view=describe(state,shell);
    if(!root.document)return;
    if(!view){if(host&&!host.hidden)host.hidden=true;return;}
    if(!host){
      host=root.document.createElement('section');host.className='flash-wave-clear';host.dataset.i18nIgnore='';
      host.setAttribute('role','status');host.setAttribute('aria-live','polite');host.setAttribute('aria-atomic','true');
      const card=root.document.createElement('div');card.className='flash-wave-clear-card';
      const mark=root.document.createElement('span');mark.className='flash-wave-clear-mark';mark.textContent='✓';mark.setAttribute('aria-hidden','true');
      heading=root.document.createElement('h2');detail=root.document.createElement('p');next=root.document.createElement('p');
      card.append(mark,heading,detail,next);host.appendChild(card);root.document.body.appendChild(host);
    }
    const translate=text=>root.ToenowI18n?.t(text)||text;
    const labels=[translate('Wave cleared!'),translate('Completed wave')+' '+view.wave,translate('The next pattern is coming.')];
    [heading,detail,next].forEach((node,index)=>{if(node.textContent!==labels[index])node.textContent=labels[index];});
    if(host.hidden)host.hidden=false;
  }
  return {describe,update};
});
