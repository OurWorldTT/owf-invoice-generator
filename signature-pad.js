'use strict';
(function(){
  function create(canvas){
    const context=canvas.getContext('2d');let drawing=false,hasInk=false;
    function position(event){const rect=canvas.getBoundingClientRect(),point=event.touches?.[0]||event;return{x:(point.clientX-rect.left)*(canvas.width/rect.width),y:(point.clientY-rect.top)*(canvas.height/rect.height)};}
    function start(event){event.preventDefault();drawing=true;const point=position(event);context.beginPath();context.moveTo(point.x,point.y);}
    function move(event){if(!drawing)return;event.preventDefault();const point=position(event);context.lineWidth=5;context.lineCap='round';context.lineJoin='round';context.strokeStyle='#17120f';context.lineTo(point.x,point.y);context.stroke();hasInk=true;}
    function end(){drawing=false;}
    canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);window.addEventListener('pointerup',end);
    function clear(){context.clearRect(0,0,canvas.width,canvas.height);hasInk=false;}
    function load(dataUrl){clear();if(!dataUrl)return;const image=new Image();image.onload=()=>{context.drawImage(image,0,0,canvas.width,canvas.height);hasInk=true;};image.src=dataUrl;}
    return{clear,load,hasInk:()=>hasInk,toDataURL:()=>hasInk?canvas.toDataURL('image/png'):''};
  }
  window.OWSignaturePad=Object.freeze({create});
})();
