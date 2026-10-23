// Keep the game and accessible HTML usable when WebGL or external art is unavailable.
export function createCombatFloor(root=document) {
  const host=root.getElementById('combat-floor');let renderer=null,latest=null,failed=false;
  const reduced=()=>root.getElementById('reduce-effects')?.checked||root.defaultView.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(host&&root.defaultView.WebGLRenderingContext)import('/assets/vendor/floor-pixi.js').then(m=>m.createFloorRenderer(host,{reduced,onSelect:(side,key)=>root.dispatchEvent(new root.defaultView.CustomEvent('watch-unit',{detail:{side,key}}))})).then(r=>{renderer=r;host.dataset.renderer='pixi';if(latest)r.update(latest);}).catch(error=>{failed=true;host.dataset.renderer='fallback';host.textContent='Trading floor uses accessible unit cards below. Canvas could not start.';console.warn('Combat canvas fallback:',error.message);});
  return {paint(s){latest=s;renderer?.update(s);const debug=root.getElementById('debug-state');if(debug?.closest('details').open)debug.textContent=JSON.stringify({seed:s.seed,tick:s.tick,eventCount:s.replay?.length,publicMarks:s.prices,hiddenReference:s.fundamentals,beliefs:s.firms.map(f=>f.beliefs),inventory:s.firms.map(f=>f.inv),render:renderer?.metrics()||{fallback:failed}},null,2);},metrics:()=>renderer?.metrics()||{fallback:true},get ready(){return !!renderer;}};
}
