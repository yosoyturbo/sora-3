const API = 'https://apihub.agnes-ai.com';
const ALLOWED = ['https://yosoyturbo.github.io'];
const MODELS = { sora3: 'agnes-video-v2.0', flash: 'agnes-video-2.5-flash' };
function cors(origin) { return { 'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0], 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type,Authorization', 'Vary':'Origin' }; }
function json(data,status=200,origin='') { return new Response(JSON.stringify(data),{status,headers:{...cors(origin),'Content-Type':'application/json'}}); }
export default { async fetch(req,env) {
 const origin=req.headers.get('Origin')||''; if(req.method==='OPTIONS') return new Response(null,{headers:cors(origin)});
 const u=new URL(req.url); if(u.pathname==='/health') return json({ok:true,service:'sora-3-agnes',models:MODELS},200,origin);
 if(!env.AGNES_API_KEY) return json({error:'Missing AGNES_API_KEY secret'},500,origin);
 const headers={Authorization:`Bearer ${env.AGNES_API_KEY}`,'Content-Type':'application/json'};
 try {
  if(req.method==='POST'&&u.pathname==='/v1/videos') {
   const b=await req.json(); const model=MODELS[b.model==='flash'?'flash':'sora3'];
   let payload;
   if(model==='agnes-video-v2.0') { const [w,h]=(b.aspect_ratio==='9:16'?'720x1280':'1280x720').split('x').map(Number); const seconds=Math.max(1,Math.min(18,Number(b.seconds)||5)); payload={model,prompt:b.prompt,width:w,height:h,num_frames:Math.min(441,Math.max(17,Math.round(seconds*24/8)*8+1)),frame_rate:24}; }
   else payload={model,prompt:b.prompt,mode:'text',seconds:String(Math.max(4,Math.min(12,Number(b.seconds)||5))),size:'720P',aspect_ratio:b.aspect_ratio||'16:9',n:1};
   const r=await fetch(API+'/v1/videos',{method:'POST',headers,body:JSON.stringify(payload)}); return new Response(await r.text(),{status:r.status,headers:{...cors(origin),'Content-Type':'application/json'}});
  }
  if(req.method==='GET'&&u.pathname==='/agnesapi') { const id=u.searchParams.get('video_id');if(!id)return json({error:'video_id required'},400,origin); const model=u.searchParams.get('model_name')||MODELS.sora3; const r=await fetch(API+'/agnesapi?video_id='+encodeURIComponent(id)+'&model_name='+encodeURIComponent(model),{headers});return new Response(await r.text(),{status:r.status,headers:{...cors(origin),'Content-Type':'application/json'}}); }
  return json({error:'Not found'},404,origin);
 } catch(e){return json({error:e.message||'Upstream failure'},502,origin)}
}};
