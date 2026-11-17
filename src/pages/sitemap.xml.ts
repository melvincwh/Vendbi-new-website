import type { APIRoute } from 'astro';
import {guides} from '../data/content';
export const GET:APIRoute=()=>{
const paths=['','platform','features','vbn-advertising-network','solutions','solutions/operators','solutions/enterprise','how-it-works','pricing','resources','resources/faq','about','book-demo','contact','privacy','terms',...guides.map(g=>'resources/'+g.slug)];
return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>'<url><loc>https://www.vendbi.com/'+(p?p+'/':'')+'</loc></url>').join('')+'</urlset>',{headers:{'Content-Type':'application/xml'}});
};
