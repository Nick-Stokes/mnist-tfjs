let data=null, index=0;
const DATA_URL=new URL('./data/test_evaluation.json', document.baseURI).href;
const status=document.getElementById('result-status');
function heatColor(v,max){
  const n=Math.max(0,Math.min(1,v/(max||1)));
  const q=Math.round(n*255);
  return `rgb(${q},${q},${q})`;
}
function drawOriginal(image){
  // The supplied test_evaluation JSON stores original_image as:
  // { shape:[28,28], data:[[...],[...],...] }
  // Accept the older/simple array form too.
  const arr=Array.isArray(image)?image:image?.data;
  if(!Array.isArray(arr)||!Array.isArray(arr[0])) throw new Error('original_image 형식이 올바르지 않습니다. {shape:[28,28], data:[...]} 형식이 필요합니다.');
  const c=document.getElementById('original'),g=c.getContext('2d'),h=arr.length,w=arr[0].length;
  const img=g.createImageData(w,h);
  let max=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++) max=Math.max(max,Number(arr[y][x])||0);
  const scale=max>1?255/max:255;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const v=Math.max(0,Math.min(255,Math.round((Number(arr[y][x])||0)*scale)));
    const k=(y*w+x)*4;img.data[k]=img.data[k+1]=img.data[k+2]=v;img.data[k+3]=255;
  }
  const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;
  tmp.getContext('2d').putImageData(img,0,0);
  g.imageSmoothingEnabled=false;g.clearRect(0,0,c.width,c.height);g.drawImage(tmp,0,0,c.width,c.height);
}
function renderMaps(id,source,shapeOverride){
  const shape=shapeOverride||source?.shape;
  const flat=Array.isArray(source)?source:source?.data;
  if(!Array.isArray(shape)||shape.length!==3||!Array.isArray(flat)) throw new Error(`${id} feature map 형식이 올바르지 않습니다.`);
  const [h,w,ch]=shape,wrap=document.getElementById(id);wrap.innerHTML='';
  const expected=h*w*ch;
  if(flat.length<expected) throw new Error(`${id} feature map 데이터 부족: ${flat.length}/${expected}`);
  let max=0;for(const v of flat)if(v>max)max=v;
  for(let c=0;c<ch;c++){
    const item=document.createElement('div');item.className='feature';
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;
    const gg=cv.getContext('2d'),im=gg.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=flat[(y*w+x)*ch+c];const q=Math.round(255*Math.max(0,Math.min(1,v/(max||1))));const k=(y*w+x)*4;im.data[k]=im.data[k+1]=im.data[k+2]=q;im.data[k+3]=255;}
    gg.putImageData(im,0,0); item.appendChild(cv); const label=document.createElement('span');label.textContent=String(c).padStart(2,'0');item.appendChild(label);wrap.appendChild(item);
  }
}
function render(){
  const s=data.samples[index];
  if(!s) throw new Error(`sample ${index}를 찾을 수 없습니다.`);
  document.getElementById('sample-number').textContent=`${index+1} / ${data.samples.length}`;
  document.getElementById('truth').textContent=`TRUE ${s.true_label}`;
  document.getElementById('result-pred').textContent=s.predicted_label;
  document.getElementById('result-conf').textContent=(s.confidence*100).toFixed(2)+'%';
  drawOriginal(s.original_image);
  document.getElementById('result-probs').innerHTML=s.probabilities.map((v,i)=>`<div class="prob-row"><span>${i}</span><div><i style="width:${(v*100).toFixed(2)}%"></i></div><b>${(v*100).toFixed(1)}%</b></div>`).join('');
  renderMaps('conv1',s.conv1_feature_maps);
  renderMaps('conv2',s.conv2_feature_maps);
}
async function init(){
  try{
    if(location.protocol==='file:') throw new Error('result.html을 직접 열지 말고 카페24 또는 HTTP 서버에서 실행하세요.');
    const r=await fetch(DATA_URL,{cache:'no-store'});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    data=await r.json();
    if(!data.samples?.length)throw new Error('samples 데이터를 찾을 수 없습니다.');
    status.textContent=`TEST ACCURACY ${(data.test_accuracy*100).toFixed(2)}% · ${data.total_test_samples} TEST SAMPLES · ${data.saved_test_samples} VISUALIZED`;
    render();
  }catch(e){status.textContent=`데이터를 불러오지 못했습니다: ${e.message||'data/test_evaluation.json 확인 필요'}`;}
}
document.getElementById('prev').onclick=()=>{if(data){try{index=(index-1+data.samples.length)%data.samples.length;render();}catch(e){status.textContent=`렌더링 오류: ${e.message}`;}}};
document.getElementById('next').onclick=()=>{if(data){try{index=(index+1)%data.samples.length;render();}catch(e){status.textContent=`렌더링 오류: ${e.message}`;}}};
init();
