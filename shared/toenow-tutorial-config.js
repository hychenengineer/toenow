// Data only: short, interactive lessons. The shared controller owns presentation.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ToenowTutorialConfig=factory();})(globalThis,function(){
  return {
    'number-pop': {name:'NUMBER POP',steps:[{kind:'numbers',prompt:'Tap from smallest to largest.',answers:['one','two','three']}]},
    'ball-track': {name:'BALL TRACK',steps:[
      {kind:'otter-reveal',prompt:'Remember where the otter hides.',answers:['hide']},
      {kind:'otter-follow',prompt:'Follow this leaf as it moves.',answers:['follow']},
      {kind:'otter-pick',prompt:'Where is the otter? Tap its leaf.',answers:['leaf2']}
    ]},
    'block-match': {name:'BLOCK MATCH',steps:[{kind:'timber',prompt:'Tap the extra tile. Make both boards match.',answers:['tile2']}]},
    'add-up': {name:'ADD UP',steps:[{kind:'sum',prompt:'Tap bags that add up to 5.',answers:['two','three'],unordered:true}]},
    'space-scale': {name:'SPACE SCALE',steps:[{kind:'scales',prompt:'The lower side is heavier. Tap the heaviest parcel.',answers:['parcelA']}]},
    'tap-match': {name:'TAP MATCH',steps:[{kind:'cards',prompt:'Find the same shape. Tap the matching card.',answers:['circle']}]},
    'spot-quick': {name:'SPOT QUICK',steps:[{kind:'photo',prompt:'Look at the blurry picture. Tap what you see.',answers:['butterfly']}]},
    'shadow-match': {name:'SHADOW MATCH',steps:[{kind:'shadows',prompt:'Find the card with the same shapes.',answers:['circle-triangle']}]},
    'flash-brain': {name:'FLASH BRAIN',steps:[
      {kind:'garden-reveal',prompt:'Remember the beds. Yellow 1 goes first. Avoid thorns.',answers:['remember']},
      {kind:'garden-pick',prompt:'Tap the remembered beds. Yellow 1 first.',answers:['bed0','bed4']}
    ]},
    'animal-rescue-train': {name:'Animal Rescue Train',steps:[{kind:'train',prompt:'Tap a queue, then a carriage. Three of a kind depart!',answers:['queue','carriage']}]}
  };
});
