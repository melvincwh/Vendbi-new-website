import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/scripts/analytics.js',import.meta.url),'utf8');
function setup(host='www.vendbi.com',saved=null){
 const handlers={},scripts=[],store=new Map(saved?[['vendbi-analytics-consent',saved]]:[]);
 const button=name=>({focus(){},addEventListener(type,fn){handlers[name]=fn;}});
 const accept=button('accept'),decline=button('decline'),settings=button('settings');
 const banner={hidden:true,querySelector:s=>s.includes('decline')?decline:accept};
 const document={cookie:'',referrer:'https://example.com/private?email=secret',head:{appendChild:s=>scripts.push(s)},createElement:()=>({}),getElementById:id=>id==='analytics-consent'?banner:settings,addEventListener:(n,fn)=>handlers[n]=fn};
 const location={hostname:host,origin:'https://'+host,pathname:'/book-demo/',reload(){handlers.reloaded=true;}};
 const context={window:{},document,location,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},URL,Element:class{}};
 vm.runInNewContext(source,context);
 return {handlers,scripts,store,banner,window:context.window};
}
test('no Google requests before consent or after decline',()=>{
 const s=setup();assert.equal(s.scripts.length,0);assert.equal(s.banner.hidden,false);
 s.handlers.decline();assert.equal(s.scripts.length,0);assert.equal(s.banner.hidden,true);
 s.handlers.settings();s.handlers.accept();assert.equal(s.scripts.length,1);assert.equal(s.window['ga-disable-G-LF9P2WJGEB'],false);
});
test('accept loads one tag and sends only safe lead metadata',()=>{
 const s=setup();s.handlers.accept();s.handlers.accept();assert.equal(s.scripts.length,1);
 const config=s.window.dataLayer.find(x=>x[0]==='config')[2];assert.equal(config.page_location,'https://www.vendbi.com/book-demo/');assert.equal(config.page_referrer,'https://example.com');
 s.handlers['vendbi:lead-success']({detail:{kind:'vbn',email:'private@example.com'}});
 const last=s.window.dataLayer.at(-1);assert.equal(last[1],'generate_lead');assert.equal(JSON.stringify(last[2]),'{"form_type":"vbn"}');
 s.handlers.decline();assert.equal(s.window['ga-disable-G-LF9P2WJGEB'],true);assert.equal(s.handlers.reloaded,true);
});
test('return visits honour consent',()=>{assert.equal(setup('vendbi.com','accepted').scripts.length,1);assert.equal(setup('vendbi.com','declined').scripts.length,0);});
test('preview, local and portal hosts never initialize tracking',()=>{
 for(const host of ['localhost','vendbi-new-website.pages.dev','app.vendbi.com']){const s=setup(host,'accepted');assert.equal(s.scripts.length,0);assert.deepEqual(s.handlers,{});}
});
