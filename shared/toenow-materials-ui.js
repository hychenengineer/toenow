// Small reward receipt shared by HTML games, React hosts and the train exception.
(function(root){
  'use strict';
  let pending=null,frame=null;
  const t=s=>root.ToenowI18n?.t(s)||s;
  function clear(){pending=null;if(frame!=null)root.cancelAnimationFrame(frame);frame=null;root.document.querySelectorAll('.toenow-material-reward').forEach(n=>n.remove());}
  function render(){
    if(!pending)return;
    const {id,reward}=pending,item=root.ToenowMaterials.ITEMS[id];
    const success=root.document.getElementById('success-dialog');
    const host=id==='animal-rescue-train'?(success?.open?success:root.document.getElementById('result')):root.document.getElementById(root.ToenowScreenConfig?.[id]?.endId);
    if(!host||!item)return;
    let banner=host.querySelector('.toenow-material-reward');
    if(!banner){banner=root.document.createElement('aside');banner.className='toenow-material-reward';banner.setAttribute('role','status');banner.setAttribute('data-i18n-ignore','');const anchor=host.querySelector('.modal-actions, #success-actions');if(anchor)anchor.before(banner);else host.append(banner);}
    banner.replaceChildren();
    const title=root.document.createElement('strong'),detail=root.document.createElement('span');
    banner.dataset.rewardStatus=reward.error||reward.reason||'collected';
    if(reward.verificationReason)banner.dataset.verificationReason=reward.verificationReason;
    else delete banner.dataset.verificationReason;
    if(reward.error){title.textContent=t('Materials could not be saved.');detail.textContent=t('Allow browser storage to collect materials.');}
    else if(reward.progress!==undefined){
      title.textContent=`${item.icon} +${reward.amount} ${t(item.name)}`;
      detail.textContent=t('Successful actions: {count}. {remaining} more for the next material.')
        .replace('{count}',reward.successes).replace('{remaining}',root.ToenowMaterials.SUCCESSES_PER_ITEM-reward.progress);
    }
    else if(!reward.amount){
      title.textContent=t('No materials collected this time.');
      detail.textContent=t(reward.reason==='practice'?'Practice mode does not award materials.':reward.reason==='preview'?'Tutorials do not award materials.':reward.reason==='no-score'?'Score points in normal play to collect materials.':reward.reason==='too-short'?'Finish a normal game to collect materials.':'This result could not be verified. Please start a new game.');
    }
    else {title.textContent=`${item.icon} +${reward.amount} ${t(item.name)}`;const state=root.ToenowMaterials.create({storage:root.localStorage}).snapshot(),next=root.ToenowMaterials.upgradeRecipe(id,state.homes[id].stage+1);detail.textContent=next?`${t('Next home stage')}: ${Object.entries(next).map(([source,n])=>`${root.ToenowMaterials.ITEMS[source].icon} ${state.balances[source]} / ${n}`).join(' · ')}`:t('Home complete! Keep collecting decorations.');}
    banner.append(title,detail);
    if(reward.progress!==undefined){const rule=root.document.createElement('span');rule.textContent=t('Every 5 successful actions earns 1 material. Progress carries over.');banner.append(rule);}
    if(reward.amount){const button=root.document.createElement('button');button.type='button';button.textContent=t('Build on island');button.onclick=()=>{if(root.parent!==root)root.parent.postMessage({type:'CLOSE_GAME',gameId:id,home:true},root.location.origin);else root.location.href='../../?home='+encodeURIComponent(id);};banner.append(button);}
  }
  root.ToenowMaterialUI={clear,show(id,reward){pending={id,reward};frame=root.requestAnimationFrame(()=>{frame=null;render();});}};
  root.addEventListener('toenow:languagechange',render);
  // Some games save partial scores on pagehide. Leaving is not a reward claim.
  root.addEventListener('pagehide',()=>{for(const id of Object.keys(root.ToenowMaterials.ITEMS))root.ToenowGameSDK?.getInstance(id)?.cancelMaterials();},true);
})(globalThis);
