// Cloudflare Pages Function. Secrets stay in runtime bindings, never in the static build.
const MAX_BYTES = 20000;
const fields = {name:120,company:160,email:254,phone:40,location:160,fleet:80,interest:100,screens:200,locations:300,hardware:300,message:3000};
const reply = (status,message) => new Response(JSON.stringify({message}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export function validateLead(data) {
 if(!data || typeof data!=='object' || Array.isArray(data)) return null;
 if(!['demo','vbn','contact'].includes(data.kind)) return null;
 if(data.website) return null;
 if(data.consent!=='on' || typeof data.elapsed!=='number' || data.elapsed<2500) return null;
 const lead={kind:data.kind};
 for(const [key,max] of Object.entries(fields)){
  if(data[key]!==undefined && typeof data[key]!=='string')return null;
  const value=(data[key]||'').trim();
  if(value.length>max)return null;
  lead[key]=value;
 }
 if(!lead.name || !lead.company || !lead.email || !lead.location || !lead.fleet)return null;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email))return null;
 return lead;
}
export async function onRequest({request,env}) {
 if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'POST'}});
 const url=new URL(request.url);
 if(request.headers.get('Origin')!==url.origin)return reply(403,'Invalid request origin.');
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply(415,'JSON required.');
 if(!env.LEAD_WEBHOOK_URL || !env.TURNSTILE_SECRET_KEY)return reply(503,'Lead delivery is not configured.');
 let destination;
 try{destination=new URL(env.LEAD_WEBHOOK_URL);if(destination.protocol!=='https:')throw new Error();}catch{return reply(503,'Lead delivery is not configured.');}
 if(Number(request.headers.get('Content-Length'))>MAX_BYTES)return reply(413,'Request too large.');
 let data;
 try{
  const reader=request.body?.getReader();if(!reader)return reply(400,'Missing body.');
  let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();return reply(413,'Request too large.');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  data=JSON.parse(new TextDecoder().decode(bytes));
 }catch{return reply(400,'Invalid request.');}
 const lead=validateLead(data);
 if(!lead)return reply(400,'Please check the required fields.');
 const token=data['cf-turnstile-response'];
 if(typeof token!=='string'||!token||token.length>4096)return reply(400,'Complete the security check.');
 try {
  const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get('CF-Connecting-IP')||''}),signal:AbortSignal.timeout(8000)});
  if(!verification.ok)return reply(503,'Security verification is unavailable.');
  const check=await verification.json();
  if(!check.success || check.hostname!==url.hostname || check.action!==lead.kind)return reply(400,'Security verification failed. Please try again.');
  const headers={'Content-Type':'application/json'};
  if(env.LEAD_WEBHOOK_TOKEN)headers.Authorization=`Bearer ${env.LEAD_WEBHOOK_TOKEN}`;
  const response=await fetch(destination,{method:'POST',headers,body:JSON.stringify({...lead,consent:true,consentVersion:'draft-v1',receivedAt:new Date().toISOString(),source:url.hostname}),signal:AbortSignal.timeout(8000),redirect:'error'});
  if(!response.ok)return reply(502,'Delivery could not be confirmed.');
  return reply(200,'Enquiry received.');
 }catch{return reply(502,'Delivery could not be confirmed.');}
}
