const MODEL_URL='https://raw.githubusercontent.com/Nick-Stokes/mnist-tfjs/refs/heads/main/model.json';
const DATA_URL=new URL('./data/training_log.json', document.baseURI).href;
let model=null;
const canvas=document.getElementById('draw-canvas');
const ctx=canvas.getContext('2d');
const predicted=document.getElementById('predicted');
const confidence=document.getElementById('confidence');
const probList=document.getElementById('prob-list');
const statusEl=document.getElementById('status');
const modelStatus=document.getElementById('model-status');

function setupCanvas(){
  ctx.fillStyle='#050505'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#fff'; ctx.lineWidth=42; ctx.lineCap='round'; ctx.lineJoin='round';
}
setupCanvas();
let drawing=false, last=null;
function point(e){
  const r=canvas.getBoundingClientRect();
  return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};
}
canvas.addEventListener('pointerdown',e=>{drawing=true; last=point(e); canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{
  if(!drawing)return; const p=point(e);
  ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;
});
canvas.addEventListener('pointerup',()=>{drawing=false;last=null});
canvas.addEventListener('pointercancel',()=>{drawing=false;last=null});

function clearAll(){
  setupCanvas(); predicted.textContent='—'; confidence.textContent='—';
  probList.innerHTML=''; statusEl.textContent='Ready. Draw a digit.';
}
document.getElementById('clear-btn').onclick=clearAll;

function preprocess(){
  const src=document.createElement('canvas'); src.width=28;src.height=28;
  const s=src.getContext('2d');
  s.fillStyle='#000';s.fillRect(0,0,28,28);
  s.drawImage(canvas,0,0,28,28);
  const data=s.getImageData(0,0,28,28).data;
  const vals=new Float32Array(784);
  for(let i=0;i<784;i++) vals[i]=data[i*4]/255;
  return tf.tensor4d(vals,[1,28,28,1]);
}
function renderProbs(arr){
  probList.innerHTML=arr.map((v,i)=>`<div class="prob-row"><span>${i}</span><div><i style="width:${(v*100).toFixed(2)}%"></i></div><b>${(v*100).toFixed(1)}%</b></div>`).join('');
}
async function loadModel(){
  if(location.protocol==='file:') throw new Error('index.html을 파일로 직접 열지 말고 카페24의 HTTP/HTTPS 주소에서 실행하세요.');
  if(typeof tf==='undefined') throw new Error('TensorFlow.js CDN을 불러오지 못했습니다.');
  modelStatus.textContent='MODEL — CHECKING';
  statusEl.textContent='Checking GitHub Raw model…';
  const probe=await fetch(MODEL_URL,{cache:'no-store'});
  if(!probe.ok) throw new Error(`GitHub model.json 요청 실패: HTTP ${probe.status}`);
  const json=await probe.json();
  if(!json.weightsManifest?.length) throw new Error('model.json에 weightsManifest가 없습니다.');
  const weightPath=json.weightsManifest[0]?.paths?.[0];
  if(!weightPath) throw new Error('model.json에서 weights.bin 경로를 찾지 못했습니다.');
  statusEl.textContent=`Model JSON OK · loading ${weightPath}…`;
  model=await tf.loadLayersModel(MODEL_URL);
  modelStatus.textContent='MODEL — READY';
  statusEl.textContent='Model loaded. Draw a digit.';
}
async function predict(){
  if(!model){statusEl.textContent='Model is still loading.';return;}
  statusEl.textContent='Running inference…';
  const x=preprocess();
  const y=model.predict(x);
  const values=Array.from(await y.data());
  const idx=values.indexOf(Math.max(...values));
  predicted.textContent=idx;
  confidence.textContent=(values[idx]*100).toFixed(2)+'%';
  renderProbs(values);
  x.dispose(); y.dispose();
  statusEl.textContent='Inference complete.';
}
document.getElementById('predict-btn').onclick=predict;

async function loadTraining(){
  const el=document.getElementById('training-status');
  try{
    if(location.protocol==='file:') throw new Error('HTTP/HTTPS 환경에서 실행하세요.');
    const r=await fetch(DATA_URL,{cache:'no-store'});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const d=await r.json();
    if(!Array.isArray(d.epochs)||!d.epochs.length) throw new Error('epochs 배열을 찾을 수 없습니다.');
    el.textContent='DATA — READY'; drawChart(d.epochs);
  }catch(e){el.textContent='DATA — MISSING'; document.getElementById('training-chart').replaceWith(Object.assign(document.createElement('div'),{className:'missing',textContent:'training_log.json을 data/ 폴더에 넣어주세요.'}));}
}
function drawChart(rows){
  const c=document.getElementById('training-chart'), box=c.parentElement, dpr=devicePixelRatio||1;
  const w=box.clientWidth,h=360;c.width=w*dpr;c.height=h*dpr; c.style.width=w+'px';c.style.height=h+'px';
  const g=c.getContext('2d');g.scale(dpr,dpr);g.font='12px Arial';
  const pad={l:42,r:42,t:24,b:34}, iw=w-pad.l-pad.r,ih=h-pad.t-pad.b;
  const x=i=>pad.l+iw*(i/(rows.length-1||1));
  const yLoss=v=>pad.t+ih*(1-v/Math.max(0.2,...rows.map(r=>r.val_loss||0),...rows.map(r=>r.loss||0)));
  const yAcc=v=>pad.t+ih*(1-(v-0.9)/0.1);
  g.strokeStyle='#bbb';g.lineWidth=1;g.beginPath();g.moveTo(pad.l,pad.t);g.lineTo(pad.l,h-pad.b);g.lineTo(w-pad.r,h-pad.b);g.stroke();
  function line(key,fn,dash=[]){g.setLineDash(dash);g.beginPath();rows.forEach((r,i)=>{const yy=fn(r[key]);i?g.lineTo(x(i),yy):g.moveTo(x(i),yy)});g.stroke();}
  g.setLineDash([]);g.strokeStyle='#111';line('loss',yLoss);g.strokeStyle='#777';line('val_loss',yLoss,[5,4]);g.strokeStyle='#111';line('accuracy',yAcc);g.strokeStyle='#777';line('val_accuracy',yAcc,[5,4]);
  g.setLineDash([]);
  rows.forEach((r,i)=>{g.fillStyle='#111';g.fillRect(x(i)-2,h-pad.b-2,4,4);g.fillStyle='#777';g.fillText(r.epoch,x(i)-4,h-10)});
  g.fillStyle='#111';g.fillText('LOSS',6,18);g.fillText('ACCURACY',w-68,18);
}
loadModel().catch(e=>{modelStatus.textContent='MODEL — ERROR';statusEl.textContent=e.message||'Model load failed.';});
loadTraining();
