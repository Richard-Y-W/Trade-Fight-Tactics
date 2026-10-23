import { Application,Container,Graphics,Text,Sprite,Texture,Rectangle,Assets } from 'pixi.js';
import { byId } from './roster.js';
import { policyFor } from './strategies.js';
import { selectVisualEvents,animationFor,advanceAnimation } from './floor-model.js';

const colors=[0x8ee8ac,0x85beff],roleColors={maker:0x94dfac,execution:0x74bbff,research:0xc59af1,manual:0xffc17c,hedge:0x75ded0,sizing:0xc8da88,volatility:0xe49bd5};
const label=(text,size=12,fill=0xe6eddf)=>new Text({text,style:{fontFamily:'Arial',fontSize:size,fill,align:'center',wordWrap:true,wordWrapWidth:128}});
export async function createFloorRenderer(host,{onSelect=()=>{},reduced=()=>false}={}) {
  const app=new Application();
  await app.init({width:1100,height:370,background:0x101b18,antialias:false,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,preference:'webgl'});
  host.replaceChildren(app.canvas);app.canvas.setAttribute('aria-label','Live trading floor: select units in the accessible floor cards below');
  let sheet=null;try{sheet=await Assets.load('/assets/kenney/characters/Spritesheet/roguelikeChar_transparent.png');sheet.source.scaleMode='nearest';}catch{/* Shape-based workstations remain fully playable. */}
  const scene=new Container(),effects=new Container();app.stage.addChild(scene,effects);
  const nodes=new Map(),markets=new Map(),pool=[],active=[];let state=null,signature='',lastEvent=0,frameMs=[],previousFrame=performance.now();
  for(let i=0;i<24;i++){const g=new Graphics();g.visible=false;effects.addChild(g);pool.push(g);}
  const resize=()=>{const width=host.clientWidth||1100;app.renderer.resize(width,370);scene.scale.set(width/1100);effects.scale.set(width/1100);};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function pulse(from,to,color,kind='ticket') {
    const g=pool.find(g=>!g.visible);if(!g||reduced())return;
    g.clear();if(kind==='link')g.rect(-3,-3,6,6).fill(color);else g.rect(-7,-4,14,8).fill(color).rect(-4,-1,8,2).fill(0x15241c);
    g.visible=true;g.alpha=1;active.push({g,from,to,start:performance.now(),duration:kind==='link'?650:850});
  }
  function rebuild(s) {
    scene.removeChildren().forEach(c=>c.destroy({children:true}));nodes.clear();markets.clear();
    const grid=new Graphics();for(let x=22;x<1100;x+=36)grid.moveTo(x,0).lineTo(x,370);grid.stroke({width:1,color:0x1a2b23});scene.addChild(grid);
    const marketIndexes=s.active.flatMap((v,a)=>v?[a]:[]);
    marketIndexes.forEach((a,i)=>{
      const x=90+i*(920/Math.max(1,marketIndexes.length-1));
      const box=new Graphics().roundRect(x-64,156,128,58,5).fill(0x283b30).stroke({width:1,color:0x526d51});scene.addChild(box);
      const title=label(['NOVA','VOLT','ORE','BOND','FX'][a],12,0xd6e7bc);title.anchor.set(.5);title.position.set(x,169);scene.addChild(title);
      const price=label('',15);price.anchor.set(.5);price.position.set(x,195);scene.addChild(price);markets.set(a,{x,y:185,price});
    });
    s.firms.forEach((f,side)=>f.units.forEach((u,i)=>{
      const c=byId(u.id),role=u.id==='specialist'?'volatility':c.capability,x=f.units.length===1?550:75+i*(950/(f.units.length-1)),y=side?31:265;
      const group=new Container();group.position.set(x,y);group.eventMode='static';group.cursor='pointer';group.on('pointertap',()=>onSelect(side,String(u.uid??u.id)));scene.addChild(group);
      const pad=new Graphics().roundRect(-65,-16,130,94,5).fill(0x192b22).stroke({width:1,color:colors[side],alpha:.5});group.addChild(pad);
      const desk=new Graphics();const col=roleColors[role];
      desk.rect(-30,23,60,5).fill(0x8a7255).rect(-25,28,5,10).fill(0x4e5446).rect(22,28,5,10).fill(0x4e5446);
      const screens=role==='execution'?3:role==='maker'||role==='sizing'?2:1;
      for(let n=0;n<screens;n++)desk.rect(-27+n*19,role==='execution'?3-n*4:3,17,17).fill(0x293e38).rect(-25+n*19,role==='execution'?5-n*4:5,13,10).fill(col);
      if(role==='research')desk.moveTo(9,-1).lineTo(18,-12).lineTo(27,-1).stroke({width:3,color:col});
      if(role==='hedge')desk.moveTo(-26,-5).lineTo(0,-15).lineTo(26,-5).lineTo(20,22).lineTo(0,32).lineTo(-20,22).closePath().stroke({width:3,color:col});
      if(role==='manual')desk.moveTo(9,-9).lineTo(25,1).lineTo(15,2).lineTo(13,12).closePath().fill(col);
      if(role==='sizing')desk.rect(25,3,9,30).fill(col).rect(36,13,9,20).fill(col);
      if(role==='volatility')desk.moveTo(-24,-9).lineTo(0,15).lineTo(24,-9).stroke({width:4,color:col});
      group.addChild(desk);
      if(sheet){const rows={maker:5,execution:6,research:7,hedge:8,manual:9,sizing:10,volatility:7};const sprite=new Sprite(new Texture({source:sheet.source,frame:new Rectangle(0,rows[role]*17,16,16)}));sprite.scale.set(2);sprite.position.set(-15,-14);group.addChildAt(sprite,1);}
      const name=label(c.name,11,colors[side]);name.anchor.set(.5,0);name.position.set(0,40);group.addChild(name);
      const metric=label('',10);metric.anchor.set(.5,0);metric.position.set(0,65);group.addChild(metric);
      nodes.set(`${side}:${u.uid??u.id}`,{group,desk,metric,pad,x,y,animation:{name:'idle',until:Infinity},unit:u,role});
    }));
  }
  function update(s) {
    state=s;const next=s.firms.map(f=>f.units.map(u=>`${u.uid??u.id}:${u.star}`).join(',')).join('/')+s.active.join();
    if(next!==signature){signature=next;rebuild(s);}
    if(s.tick===0&&s.eventSequence<lastEvent)lastEvent=0;
    for(const [a,m] of markets)m.price.text=`$${s.prices[a].toFixed(2)}`;
    for(const [key,n] of nodes){const side=Number(key[0]),f=s.firms[side],a=f.activity[n.unit.uid??n.unit.id],account=f.unitLedger[n.unit.uid??n.unit.id];
      const net=account?account.cash+account.inv.reduce((v,q,i)=>v+q*s.prices[i],0):0;
      n.metric.text=n.role==='research'?`${a?.signalCorrect||0}/${a?.signalChecked||0} next-move` :n.role==='hedge'?(n.unit.id==='clerk'?`${a?.guarded||0} quote guards`:`${a?.hedged||0} trimmed`):`${net<0?'-':'+'}$${Math.abs(net).toFixed(2)} · ${a?.fills||0} fills`;
      n.metric.style.fill=net<-.01?0xffb68b:colors[side];
    }
    const events=s.events.filter(e=>e.eventId>lastEvent);lastEvent=Math.max(lastEvent,...events.map(e=>e.eventId||0));
    for(const e of events.filter(e=>e.type==='quote'&&e.source&&e.support?.length).slice(0,2)){
      const trader=nodes.get(`${e.firm}:${e.source.uid??e.source.id}`),research=nodes.get(`${e.firm}:${e.support[0].uid??e.support[0].id}`);if(trader&&research)pulse(research,trader,0xc59af1,'link');
    }
    for(const e of selectVisualEvents(events,{reduced:reduced()})){
      const n=nodes.get(`${e.firm}:${e.source.uid??e.source.id}`);if(!n)continue;
      n.animation={name:animationFor(e),until:performance.now()+650};
      const market=markets.get(e.asset);if(market)pulse(n,market,colors[e.firm]);
      if(e.type==='quote'&&e.support?.length){const helper=nodes.get(`${e.firm}:${e.support[0].uid??e.support[0].id}`);if(helper)pulse(helper,n,0xc59af1,'link');}
      if(e.type==='hedge')for(const a of (e.affected||[]).slice(0,2)){const ally=nodes.get(`${e.firm}:${a.source?.uid??a.source?.id}`);if(ally)pulse(n,ally,0x75ded0,'link');}
      if(e.type==='contest'){const rival=nodes.get(`${1-e.firm}:${e.opponent.uid??e.opponent.id}`);if(rival){rival.animation={name:'stress',until:performance.now()+650};pulse(n,rival,colors[e.firm],'link');}}
      if(e.type==='quote'&&e.pair!=null&&market&&markets.has(e.pair))pulse(market,markets.get(e.pair),0x85e3df,'link');
    }
  }
  app.ticker.maxFPS=60;
  app.ticker.add(()=>{
    const now=performance.now();frameMs.push(now-previousFrame);previousFrame=now;if(frameMs.length>300)frameMs.shift();
    for(const n of nodes.values()){
      n.animation=advanceAnimation(n.animation,now);const mode=reduced()?'idle':n.animation.name;
      n.desk.y=mode==='action'?Math.sin(now/55)*2:0;n.group.alpha=mode==='stress'?.7+Math.sin(now/45)*.15:1;
      n.desk.tint=mode==='success'?0xc5ffbf:mode==='stress'?0xffb393:mode==='synergy'?0xdfbeff:0xffffff;
    }
    for(let i=active.length-1;i>=0;i--){const p=active[i],t=Math.min(1,(now-p.start)/p.duration);p.g.position.set(p.from.x+(p.to.x-p.from.x)*t,p.from.y+(p.to.y-p.from.y)*t-25*Math.sin(t*Math.PI));p.g.alpha=1-t*.4;if(t===1||reduced()){p.g.visible=false;active.splice(i,1);}}
  });
  return {update,metrics:()=>({renderer:app.renderer.name,effects:active.length,pool:pool.length,frameMs:[...frameMs]}),destroy(){observer.disconnect();app.destroy(true,{children:true});}};
}
