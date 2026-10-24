import { MARKETS,regionAt,assignedAssets } from './markets.js';
import { Application,Container,Graphics,Text,Sprite,Texture,Rectangle,Assets } from 'pixi.js';
import { byId } from './roster.js';
import { policyFor } from './strategies.js';
import { selectVisualEvents,animationFor,advanceAnimation } from './floor-model.js';
import { boardTile,unitKey } from './board.js';
import { overlayData } from './board-overlays.js';
import { supportGraph } from './positioning.js';

const colors=[0x8ee8ac,0x85beff],roleColors={maker:0x94dfac,execution:0x74bbff,research:0xc59af1,manual:0xffc17c,hedge:0x75ded0,sizing:0xc8da88,volatility:0xe49bd5};
const label=(text,size=12,fill=0xe6eddf)=>new Text({text,style:{fontFamily:'Arial',fontSize:size,fill,align:'center',wordWrap:true,wordWrapWidth:88}});
export async function createFloorRenderer(host,{onSelect=()=>{},reduced=()=>false}={}) {
  const app=new Application();
  await app.init({width:800,height:800,background:0x101b18,antialias:false,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,preference:'webgl'});
  host.replaceChildren(app.canvas);app.canvas.setAttribute('aria-label','Live trading floor: select units in the accessible floor cards below');
  let sheet=null;try{sheet=await Assets.load('/assets/kenney/characters/Spritesheet/roguelikeChar_transparent.png');sheet.source.scaleMode='nearest';}catch{/* Shape-based workstations remain fully playable. */}
  const backdrop=new Container(),scene=new Container(),effects=new Container(),heat=new Graphics(),links=new Graphics();app.stage.addChild(backdrop,heat,scene,links,effects);
  const nodes=new Map(),markets=new Map(),pool=[],active=[];let state=null,signature='',lastEvent=0,frameMs=[],previousFrame=performance.now(),view={};
  for(let i=0;i<24;i++){const g=new Graphics();g.visible=false;effects.addChild(g);pool.push(g);}
  const numberPool=Array.from({length:8},()=>{const t=label('',15);t.anchor.set(.5);t.visible=false;effects.addChild(t);return t;}),numbers=[];
  const resize=()=>{const width=host.clientWidth||640,height=width*(state?.board.rows||8)/(state?.board.cols||8);host.style.height=`${height}px`;if(app.renderer.width!==Math.round(width)||app.renderer.height!==Math.round(height))app.renderer.resize(width,height);for(const layer of [backdrop,scene,effects,heat,links])layer.scale.set(width/800);};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function pulse(from,to,color,kind='ticket') {
    const g=pool.find(g=>!g.visible);if(!g||reduced())return;
    g.clear();if(kind==='link')g.rect(-3,-3,6,6).fill(color);else if(kind==='quote')g.rect(-8,-6,12,7).fill(0x91dfad).rect(-3,2,12,7).fill(0x8fc1f0);else g.rect(-7,-4,14,8).fill(color).rect(-4,-1,8,2).fill(0x15241c);
    g.visible=true;g.alpha=1;active.push({g,from,to,start:performance.now(),duration:kind==='link'?650:850});
  }
  function rebuild(s) {
    scene.removeChildren().forEach(c=>c.destroy({children:true}));backdrop.removeChildren().forEach(c=>c.destroy());nodes.clear();markets.clear();
    const cell=800/s.board.cols,height=s.board.rows*cell,grid=new Graphics();
    for(let row=0;row<s.board.rows;row++)for(let col=0;col<s.board.cols;col++){
      const m=MARKETS.find(m=>m.id===regionAt({col,row})),a=MARKETS.indexOf(m),active=s.active[a],x=col*cell,y=row*cell;
      grid.rect(x,y,cell,cell).fill({color:m.color,alpha:active?.85:.24}).rect(x+1,y+1,cell-2,cell-2).stroke({width:1,color:0xffffff,alpha:.035});
      for(const [dc,dr] of [[1,0],[0,1],[-1,0],[0,-1]])if(regionAt({col:col+dc,row:row+dr})!==m.id){const x1=x+(dc===1?cell:0),y1=y+(dr===1?cell:0);grid.moveTo(x1,y1).lineTo(x1+(dr?cell:0),y1+(dc?cell:0)).stroke({width:2,color:0xb5c8bb,alpha:active?.35:.12});}
    }backdrop.addChild(grid);
    MARKETS.forEach((m,a)=>{
      const x=(m.anchor.col+.5)*cell,y=(m.anchor.row+.5)*cell;
      const title=label(m.short+(s.active[a]?'':' / '+m.unlock.toUpperCase()),20);title.style.wordWrapWidth=170;title.anchor.set(.5);title.position.set(x,y-28);title.alpha=s.active[a]?.42:.21;backdrop.addChild(title);
      const box=new Graphics().roundRect(x-42,y-6,84,13,3).fill({color:0x0c1614,alpha:.5});backdrop.addChild(box);
      const price=label('',12);price.anchor.set(.5);price.position.set(x,y+1);backdrop.addChild(price);
      const result=label('',14);result.anchor.set(.5);result.position.set(x,y+19);backdrop.addChild(result);markets.set(a,{x,y,price,result});
    });
    s.firms.forEach((f,side)=>(side?(view.opponent||[]):f.units).forEach((u,i)=>{
      const tile=boardTile(u.position,side,s.board),c=byId(u.id),role=u.id==='specialist'?'volatility':c.capability,x=(tile.col+(side?.75:.25))*cell,y=tile.row*cell+25;
      const group=new Container();group.position.set(x,y);group.scale.set(.65);group.eventMode='static';group.cursor='pointer';group.on('pointertap',()=>onSelect(side,String(u.uid??u.id)));scene.addChild(group);
      const pad=new Graphics().roundRect(-35,-12,70,105,5).fill(0x192b22).stroke({width:1,color:colors[side],alpha:.5});group.addChild(pad);
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
      const displayName=c.name.replace(/^Junior /,'').replace(/ Lead$| PM$| Apprentice$| Founder$/,'').replace('Microstructure','Micro').replace('Allocation','Alloc.');
      const name=label(displayName.split(' ').map(w=>w[0]).join(''),26,colors[side]);name.anchor.set(.5,0);name.position.set(0,36);group.addChild(name);
      const star=label('★'.repeat(u.star||1),10,0xe9d87f);star.position.set(-cell/2+8,-10);group.addChild(star);
      const metric=label('',25);metric.anchor.set(.5,0);metric.position.set(0,72);group.addChild(metric);
      nodes.set(`${side}:${u.uid??u.id}`,{group,desk,metric,pad,x,y,animation:{name:'idle',until:Infinity},unit:u,role});
    }));
  }
  function update(s,options={}) {
    state=s;view={...options,opponent:options.phase==='close'?s.firms[1].units:options.opponent};const next=JSON.stringify([s.firms[0].units,view.opponent||[]].map(us=>us.map(u=>[u.uid??u.id,u.star,u.position])))+s.active.join()+view.market+view.phase+JSON.stringify(s.board);
    if(next!==signature){signature=next;rebuild(s);}
    resize();
    if(s.tick===0&&s.eventSequence<lastEvent)lastEvent=0;
    for(const [a,m] of markets){m.price.text=s.active[a]?`${s.instruments[a].ticker} $${s.prices[a].toFixed(a===4?4:2)}`:'';m.result.text=s.active[a]&&s.tick?`${s.firms[0].pnl[a].toFixed(1)} / ${s.firms[1].pnl[a].toFixed(1)} net`:'';}
    heat.clear();links.clear();const overlay=overlayData(s,view.overlay,view.market),max=Math.max(1,...overlay.map(v=>Math.abs(v.value))),cell=800/s.board.cols;
    for(const h of overlay){const node=nodes.get(`${h.side}:${h.key}`);if(!node||!h.value||view.phase==='prep')continue;heat.rect(h.position.col*cell+2,h.position.row*cell+2,cell-4,cell-4).fill({color:view.overlay==='risk'?0xe8b46f:h.value<0?0xe89874:colors[h.side],alpha:.08+Math.min(.27,Math.abs(h.value)/max*.27)});}
    const selectedNode=nodes.get(`${view.selectedSide||0}:${view.selectedUnit}`);
    if(selectedNode){for(const [side,f] of s.firms.entries())for(const e of (side&&view.phase==='prep'?supportGraph(view.opponent||[],s.board):f.supportLinks)||[]){if(side!==(view.selectedSide||0)||(unitKey(e.source)!==String(view.selectedUnit)&&unitKey(e.target)!==String(view.selectedUnit)))continue;const a=nodes.get(`${side}:${unitKey(e.source)}`),b=nodes.get(`${side}:${unitKey(e.target)}`);if(a&&b)links.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width:2,color:e.kind==='risk'?0x75ded0:e.kind==='research'?0xc59af1:0xe2d690,alpha:.5});}}
    for(const [key,n] of nodes){const side=Number(key[0]),f=s.firms[side],a=f.activity[n.unit.uid??n.unit.id],account=f.unitLedger[n.unit.uid??n.unit.id];
      const net=account?account.cash+account.inv.reduce((v,q,i)=>v+q*s.prices[i]*(s.instruments[i].multiplier||1),0):0;
      if(s.tick>0&&n.lastNet!=null&&Math.abs(net-n.lastNet)>=.5&&!reduced()){
        const prior=numbers.find(p=>p.key===key),text=prior?.text||numberPool.find(t=>!t.visible);if(text){const delta=(prior?.delta||0)+net-n.lastNet;text.text=`Δ ${delta<0?'-':'+'}$${Math.abs(delta).toFixed(2)}`;text.style.fill=delta<0?0xffb28b:0xc7f291;text.visible=true;text.position.set(n.x,n.y);if(prior){prior.delta=delta;prior.start=performance.now();}else numbers.push({key,delta,text,x:n.x,y:n.y,start:performance.now()});}
      }n.lastNet=net;
      n.metric.text=n.role==='research'?`${a?.signals||0} signals` :n.role==='hedge'?(n.unit.id==='clerk'?`${a?.guarded||0} guards`:`${a?.hedged||0} trimmed`):`${net<0?'-':'+'}$${Math.abs(net).toFixed(Math.abs(net)>=100?0:1)} · ${a?.fills||0} fills`;
      n.metric.style.fill=net<-.01?0xffb68b:colors[side];
      if(view.phase==='prep'&&side)n.metric.text='SCOUT SNAPSHOT';
    }
    const events=s.events.filter(e=>e.eventId>lastEvent);lastEvent=Math.max(lastEvent,...events.map(e=>e.eventId||0));
    for(const e of events.filter(e=>e.type==='quote'&&e.source&&e.support?.length).slice(0,2)){
      const trader=nodes.get(`${e.firm}:${e.source.uid??e.source.id}`),research=nodes.get(`${e.firm}:${e.support[0].uid??e.support[0].id}`);if(trader&&research)pulse(research,trader,0xc59af1,'link');
    }
    for(const e of selectVisualEvents(events,{reduced:reduced()})){
      const n=nodes.get(`${e.firm}:${e.source.uid??e.source.id}`);if(!n)continue;
      n.animation={name:animationFor(e),until:performance.now()+650};
      const assigned=assignedAssets(s,n.unit)[0];const market=markets.get(e.asset??assigned) || (e.type==='order_routed'?markets.get(assigned??view.market??0):null);if(market)pulse(e.type==='fill'||e.type==='cancel'?market:n,e.type==='fill'||e.type==='cancel'?n:market,e.type==='cancel'?0xe7a894:e.type==='fill'?(e.edge<0?0xffad7a:0xd7efb8):colors[e.firm],e.type==='quote'?'quote':'ticket');
      if(e.type==='support_applied'&&e.target){const target=nodes.get(`${e.firm}:${unitKey(e.target)}`);if(target)pulse(n,target,e.supportKind==='manager'?0xe2d690:0x74bbff,'link');}
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
      n.desk.y=mode==='action'?Math.sin(now/55)*2:0;const rival=nodes.get(`1:${unitKey(n.unit)}`)===n;n.group.alpha=rival&&view.phase==='close'&&!reduced()?Math.max(0,1-(now-(n.closedAt??=now))/1000):rival&&view.phase==='opening'&&!reduced()?Math.min(1,(now-(n.revealedAt??=now))/1000):mode==='stress'?.7+Math.sin(now/45)*.15:1;
      n.desk.tint=mode==='success'?0xc5ffbf:mode==='stress'?0xffb393:mode==='synergy'?0xdfbeff:0xffffff;
    }
    for(let i=active.length-1;i>=0;i--){const p=active[i],t=Math.min(1,(now-p.start)/p.duration);p.g.position.set(p.from.x+(p.to.x-p.from.x)*t,p.from.y+(p.to.y-p.from.y)*t-25*Math.sin(t*Math.PI));p.g.alpha=1-t*.4;if(t===1||reduced()){p.g.visible=false;active.splice(i,1);}}
    for(let i=numbers.length-1;i>=0;i--){const n=numbers[i],t=Math.min(1,(now-n.start)/850);n.text.position.set(n.x,n.y-20-25*t);n.text.alpha=1-t;n.text.scale.set(1+Math.sin(t*Math.PI)*.15);if(t===1||reduced()){n.text.visible=false;numbers.splice(i,1);}}
  });
  return {update,metrics:()=>({renderer:app.renderer.name,effects:active.length,pool:pool.length,frameMs:[...frameMs]}),destroy(){observer.disconnect();app.destroy(true,{children:true});}};
}
