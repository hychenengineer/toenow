// Rabbit compatibility entry point; all scenes use the shared renderer.
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./toenow-homes.js'),require('./toenow-homes-config.js'));
  else root.ToenowRabbitHome=factory(root.ToenowHomes,root.ToenowHomesConfig);
})(typeof globalThis!=='undefined'?globalThis:this,function(homes,configs){
  'use strict';
  return {PROJECTS:configs.get('number-pop').projects,
    getModel:(snapshot)=>homes.getModel('number-pop',snapshot),
    getDialogue:(snapshot,index)=>homes.getDialogue('number-pop',snapshot,index),
    markup:(options={})=>homes.markup({...options,gameId:'number-pop'})};
});
