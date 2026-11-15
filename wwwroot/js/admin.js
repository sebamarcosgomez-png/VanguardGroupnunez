'use strict';
let cfg=null,active='textos',dirty=false;
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const tabs=[['textos','Textos'],['escenas','Recorrido 3D'],['galeria','Galería'],['video','Video'],['finanzas','Finanzas'],['cronograma','Cronograma'],['niveles','Niveles'],['avanzado','JSON']];
async function api(path,opt={}){let r=await fetch(path,{...opt,headers:{'X-Requested-With':'PLUS-VG-ADMIN',...(opt.headers||{})}});if(!r.ok)throw Error((await r.text()).slice(0,200));return r.json()}
function message(m,error=false){const x=$('#msg');x.style.display='block';x.className='message'+(error?' error':'');x.textContent=m;setTimeout(()=>x.style.display='none',5000)}
function changed(){dirty=true;$('#dirty').textContent='● Cambios pendientes de guardar';}
function field(label,value,fn,opts={}){const wrap=document.createElement('div');wrap.className='field';const l=document.createElement('label');l.textContent=label;const inp=document.createElement(opts.long?'textarea':'input');if(!opts.long)inp.type=opts.type||'text';inp.value=value??'';inp.addEventListener('input',()=>{fn(inp.value);changed()});wrap.append(l,inp);return wrap}
function card(title){let c=document.createElement('div');c.className='card';let h=document.createElement('h3');h.textContent=title;c.append(h);return c}
function head(t,n){let p=document.createElement('div');p.className='sectionInfo';p.innerHTML='<h2>'+esc(t)+'</h2><div class="muted">'+esc(n)+'</div>';return p}
function uploadBox(value,onUploaded,accept='image/*'){const w=document.createElement('div');w.className='field';let l=document.createElement('label');l.textContent='Reemplazar archivo';let f=document.createElement('input');f.type='file';f.accept=accept;let b=document.createElement('button');b.textContent='Subir archivo';b.onclick=async()=>{if(!f.files.length)return message('Seleccioná un archivo',true);try{let fd=new FormData();fd.append('file',f.files[0]);let r=await api('/api/admin/upload',{method:'POST',body:fd});onUploaded(r.url);changed();message('Archivo subido. Guardá los cambios para publicarlo.');render()}catch(e){message('No se pudo subir: '+e.message,true)}};w.append(l,f,b);return w}
function render(){const w=$('#workspace');w.replaceChildren();const tab=active;if(tab==='textos'){
 w.append(head('Textos editables','Encabezados y descripciones de las secciones públicas. Los textos se muestran sin HTML ejecutable.'));
 w.append(field('Título de la pestaña',cfg.siteTitle,v=>cfg.siteTitle=v));
 for(let [k,it] of Object.entries(cfg.content)){w.append(field(it.label,it.html,v=>it.html=v,{long:true}))}
 w.append(field('Nota editorial',cfg.draftNote,v=>cfg.draftNote=v,{long:true}));
 }else if(tab==='escenas'){
 w.append(head('Recorrido inmersivo','Las imágenes son renders conceptuales, no planos ejecutivos.'));
 const g=document.createElement('div');g.className='grid';cfg.scenes.forEach((s,i)=>{let c=card('Escena '+(i+1));let img=document.createElement('img');img.src=s.image;c.append(img,field('Título',s.title,v=>s.title=v),field('Subtítulo',s.subtitle,v=>s.subtitle=v),field('Detalle técnico',s.detail,v=>s.detail=v,{long:true}),uploadBox(s.image,v=>s.image=v));g.append(c)});w.append(g)
 }else if(tab==='galeria'){
 w.append(head('Galería del producto','Podés reemplazar las fotos del proyecto sin editar HTML.'));
 const g=document.createElement('div');g.className='grid';cfg.gallery.forEach((s,i)=>{let c=card(s.label);let img=document.createElement('img');img.src=s.src;c.append(img,uploadBox(s.src,v=>s.src=v));g.append(c)});w.append(g)
 }else if(tab==='video'){
 w.append(head('Video promocional','Video MP4 en ciclo, utilizado en portada y sección audiovisual.'));
 let p=document.createElement('video');p.src=cfg.video;p.controls=true;p.loop=true;p.muted=true;p.style.width='100%';p.style.maxHeight='430px';w.append(p,uploadBox(cfg.video,v=>cfg.video=v,'video/mp4'));
 }else if(tab==='finanzas'){
 w.append(head('Escenarios de inversión','Cifras en millones de USD. Modelo en revisión: actualizar únicamente con valores conciliados.'));
 for(const [key,name] of [['estrenar','Venta a estrenar'],['pozo','Venta por pozo']]){let c=card(name),s=cfg.finance.scenarios[key];for(const [k,label] of [['income','Ingresos (USD M)'],['cost','Inversión / exposición (USD M)'],['profit','Resultado económico (USD M)']])c.append(field(label,s[k],v=>s[k]=Number(v),{type:'number'}));c.append(field('Nota',s.description,v=>s.description=v,{long:true}));w.append(c)}
 let c=card('TIR por horizonte / %');cfg.finance.horizons.forEach((h,i)=>{let r=document.createElement('div');r.className='row';r.append(field('Plazo '+h,cfg.finance.tirEstrenar[i],v=>cfg.finance.tirEstrenar[i]=Number(v),{type:'number'}),field('Pozo '+h,cfg.finance.tirPozo[i],v=>cfg.finance.tirPozo[i]=Number(v),{type:'number'}));c.append(r)});w.append(c)
 }else if(tab==='cronograma'){
 w.append(head('Etapas constructivas','Meses relativos desde H0. Los intervalos son orientativos hasta validar ruta crítica.'));
 cfg.stages.forEach((s,i)=>{let c=card('Etapa '+(i+1));c.append(field('Nombre',s[0],v=>s[0]=v),field('Descripción',s[1],v=>s[1]=v),field('Inicio · mes',s[2],v=>s[2]=Math.max(1,Math.min(18,Number(v))),{type:'number'}),field('Fin · mes',s[3],v=>s[3]=Math.max(1,Math.min(18,Number(v))),{type:'number'}));w.append(c)})
 }else if(tab==='niveles'){
 w.append(head('Explorador de niveles','Editar funciones y descripciones de los pisos y subsuelos.'));
 cfg.levels.forEach((s,i)=>{let d=document.createElement('details');d.innerHTML='<summary>'+esc(s.name)+'</summary>';d.append(field('Nombre',s.name,v=>s.name=v),field('Tipo',s.type,v=>s.type=v),field('Descripción',s.desc,v=>s.desc=v,{long:true}));w.append(d)})
 }else if(tab==='avanzado'){
 w.append(head('Editor avanzado','Para correcciones masivas. Se validará la estructura mínima al guardar.'));
 const ta=document.createElement('textarea');ta.style.minHeight='420px';ta.style.fontFamily='monospace';ta.value=JSON.stringify(cfg,null,2);ta.addEventListener('input',()=>changed());w.append(ta);let b=document.createElement('button');b.textContent='Aplicar JSON al editor';b.onclick=()=>{try{let d=JSON.parse(ta.value);if(!d.content||!d.finance||!Array.isArray(d.scenes))throw Error('Campos requeridos faltantes');cfg=d;changed();message('JSON incorporado; recordá guardar')}catch(e){message('JSON inválido: '+e.message,true)}};w.append(b)
 }}
async function init(){try{await enter()}catch(e){message("No se pudo abrir el editor local: "+e.message,true)}}
async function enter(){cfg=await api('/api/admin/config');let nav=$('#tabs');nav.replaceChildren();tabs.forEach(([id,label])=>{let b=document.createElement('button');b.textContent=label;b.className=id===active?'active':'';b.onclick=()=>{active=id;nav.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');render()};nav.append(b)});render()}
$('#saveBtn').onclick=async()=>{try{await api('/api/admin/config',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg)});dirty=false;$('#dirty').textContent='✓ Guardado';message('Cambios guardados. Actualizá la página pública para verlos.')}catch(e){message('Error al guardar: '+e.message,true)}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
init();
