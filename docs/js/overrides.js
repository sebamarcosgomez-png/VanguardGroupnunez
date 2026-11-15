/* PLUS VG: overrides from editable JSON config. Runs after original visualizations initialize. */
(()=>{
  'use strict';
  const c=window.PLUS_CONFIG;
  if(!c)return;
  document.title=c.siteTitle||document.title;
  for(const item of Object.values(c.content||{})){
    const el=document.querySelector(item.selector);
    if(el && typeof item.html==='string'){
      // Text-only is intentional; never execute admin-provided markup.
      const text=document.createElement('div');text.innerHTML=item.html;
      el.textContent=text.textContent;
    }
  }
  for(const item of c.gallery||[]){
    const images=document.querySelectorAll(item.selector);
    const el=images[item.index||0];
    if(el && typeof item.src==='string' && /^(?:\/)?(?:assets|uploads)\//.test(item.src))el.src=item.src.replace(/^\//,'');
  }
  (c.scenes||[]).forEach((r,i)=>{
    const slide=document.querySelectorAll('.scene-slide img')[i];
    if(slide && /^(?:\/)?(?:assets|uploads)\//.test(r.image||''))slide.src=r.image.replace(/^\//,'');
    const tab=document.querySelector(`[data-scene-tab="${i}"]`);
    if(tab)tab.textContent=r.title;
  });
  if(c.video && /^(?:\/)?(?:assets|uploads)\//.test(c.video)){
    document.querySelectorAll('video').forEach(v=>{
      v.querySelectorAll('source').forEach(s=>s.src=c.video.replace(/^\//,''));
      v.src=c.video.replace(/^\//,'');v.load(); v.play().catch(()=>{});
    });
  }
  // Refresh the scene details after the admin data has been loaded.
  if(typeof showRoom==='function')showRoom(0);
  if(typeof scenario==='function')scenario('estrenar');
  if(typeof updateSensitivity==='function')updateSensitivity();
})();
