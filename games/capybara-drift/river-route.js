// One projection for riverbanks, swimmers, drifting items and finger input.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CapybaraRiver=factory();})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function center(){return .5;}
 function width(viewWidth){return Math.min(viewWidth*.58,620);}
 function project(s,x,y,viewWidth){return center(s,y)*viewWidth+(x-.5)*width(viewWidth);}
 function unproject(s,pixelX,y,viewWidth){return (pixelX-center(s,y)*viewWidth)/width(viewWidth)+.5;}
 function heading(){return 0;}
 function screen(s,x,y,screenWidth,screenHeight){return {x:screenWidth*(1-y),y:project(s,x,y,screenHeight)};}
 function input(s,pixelX,pixelY,screenWidth,screenHeight){const y=1-pixelX/screenWidth;return {x:unproject(s,pixelY,y,screenHeight),y};}
 return {center,width,project,unproject,heading,screen,input};
});
