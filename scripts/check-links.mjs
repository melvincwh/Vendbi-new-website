import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const root=path.resolve('dist');const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(p.endsWith('.html'))files.push(p);}}
walk(root);let links=0;
const ids=html=>new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
for(const file of files){const html=fs.readFileSync(file,'utf8');assert.equal((html.match(/<h1[\s>]/g)||[]).length,1,`${file}: one h1`);assert.match(html,/<meta name="description"/);assert.match(html,/<link rel="canonical" href="https:\/\/www\.vendbi\.com\//);assert.ok((html.match(/href="https:\/\/app\.vendbi\.com\/ops\/"/g)||[]).length>=3,`${file}: portal in desktop, mobile and footer`);
 for(const [label,pattern] of [['desktop',/<div class="header-actions">([\s\S]*?)<\/div>/],['mobile',/<nav aria-label="Mobile navigation">([\s\S]*?)<\/nav>/],['footer',/<footer>([\s\S]*?)<\/footer>/]]){const region=html.match(pattern)?.[1];assert.ok(region?.includes('href="https://app.vendbi.com/ops/"'),`${file}: direct portal link in ${label}`);}
 for(const match of html.matchAll(/(?:href|src)="([^"?]+)(?:\?[^"#]*)?"/g)){
  const link=match[1];if(!link.startsWith('/')&&!link.startsWith('#'))continue;if(link.startsWith('//'))continue;
  const [pathname,hash]=link.split('#');const target=pathname?path.join(root,pathname):file;const candidates=[target,path.join(target,'index.html')];const found=candidates.find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());assert.ok(found,`${file}: broken link ${link}`);if(hash&&found.endsWith('.html'))assert.ok(ids(fs.readFileSync(found,'utf8')).has(hash),`${file}: missing anchor ${link}`);links++;
 }
}
const titles=files.map(f=>fs.readFileSync(f,'utf8').match(/<title>(.*?)<\/title>/)?.[1]);assert.equal(new Set(titles).size,titles.length,'Unique page titles');console.log(`Validated ${files.length} HTML pages, ${links} internal links/assets, unique titles, canonical URLs, H1s and portal links.`);
