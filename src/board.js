export function boardConfig({cols=8,rows=8,supportRange=2}={}) {
  if(!Number.isInteger(cols)||cols<2||!Number.isInteger(rows)||rows<4||rows%2)throw new TypeError('Board requires at least 2 columns and an even row count >= 4');
  return {cols,rows,half:rows/2,supportRange};
}
export const BOARD=boardConfig();
export const unitKey=u=>String(u.uid??u.id);
export const sameTile=(a,b)=>!!a&&!!b&&a.col===b.col&&a.row===b.row;
export function validPosition(p,b=BOARD){return !!p&&Number.isInteger(p.col)&&Number.isInteger(p.row)&&p.col>=0&&p.col<b.cols&&p.row>=0&&p.row<b.half;}
export function boardTile(p,side=0,b=BOARD){return {col:p.col,row:side?b.half-1-p.row:b.half+p.row};}
export function localTile(col,row,side=0,b=BOARD){const p={col,row:side?b.half-1-row:row-b.half};return validPosition(p,b)?p:null;}
export function assignPositions(units,b=BOARD){
  const occupied=[];
  for(const u of units){if(!validPosition(u.position,b)||occupied.some(p=>sameTile(p,u.position))){let found=null;for(let row=0;row<b.half&&!found;row++)for(let col=0;col<b.cols;col++)if(!occupied.some(p=>p.row===row&&p.col===col)){found={col,row};break;}if(!found)throw Error('Deployment exceeds board area');u.position=found;}else u.position={...u.position};occupied.push(u.position);}
  return units;
}
export function placeUnit(company,uid,target,b=company.board||BOARD){
  const u=company.units.find(u=>u.uid===uid);if(!u||company.eliminated)return false;
  if(target==null){if(!u.deployed)return true;if(company.units.filter(u=>!u.deployed).length>=company.benchLimit)return false;u.deployed=false;delete u.position;return true;}
  if(!validPosition(target,b))return false;
  const other=company.units.find(v=>v!==u&&v.deployed&&sameTile(v.position,target));
  if(!u.deployed&&!other&&company.units.filter(v=>v.deployed).length>=company.floorLimit)return false;
  if(other){if(u.deployed)other.position={...u.position};else{other.deployed=false;delete other.position;}}
  u.deployed=true;u.position={...target};return true;
}
export function scoutSnapshot(player,{day=1,week=1}={}){return {firmId:player.id,name:player.name,day,week,units:player.company.units.filter(u=>u.deployed).map(u=>({...u,position:{...u.position}}))};}
