import { regionAt,compatibleMarkets,unlockedMarkets } from './markets.js';
export function boardConfig({cols=8,rows=8,supportRange=2,shared=false}={}) {
  if(!Number.isInteger(cols)||cols<2||!Number.isInteger(rows)||rows<4||rows%2)throw new TypeError('Board requires at least 2 columns and an even row count >= 4');
  if(shared&&(cols!==8||rows!==8))throw new TypeError('Regional map requires 8 by 8');
  return {cols,rows,half:rows/2,supportRange,shared};
}
export const BOARD=boardConfig();
export const unitKey=u=>String(u.uid??u.id);
export const sameTile=(a,b)=>!!a&&!!b&&a.col===b.col&&a.row===b.row;
export function validPosition(p,b=BOARD){return !!p&&Number.isInteger(p.col)&&Number.isInteger(p.row)&&p.col>=0&&p.col<b.cols&&p.row>=0&&p.row<(b.shared?b.rows:b.half);}
export function boardTile(p,side=0,b=BOARD){return {col:p.col,row:b.shared?p.row:side?b.half-1-p.row:b.half+p.row};}
export function localTile(col,row,side=0,b=BOARD){const p={col,row:b.shared?row:side?b.half-1-row:row-b.half};return validPosition(p,b)?p:null;}
export function assignPositions(units,b=BOARD,active=unlockedMarkets(2,1)){
  const occupied=[];
  for(const u of units){const allowed=p=>!b.shared||(active.includes(regionAt(p))&&compatibleMarkets(u.id).includes(regionAt(p)));if(!validPosition(u.position,b)||!allowed(u.position)||occupied.some(p=>sameTile(p,u.position))){let found=null;for(let row=0;row<(b.shared?b.rows:b.half)&&!found;row++)for(let col=0;col<b.cols;col++)if(allowed({col,row})&&!occupied.some(p=>p.row===row&&p.col===col)){found={col,row};break;}if(!found)throw Error('No active compatible deployment tile');u.position=found;}else u.position={...u.position};occupied.push(u.position);}
  return units;
}
export function placeUnit(company,uid,target,b=company.board||BOARD){
  const u=company.units.find(u=>u.uid===uid);if(!u||company.eliminated)return false;
  if(target==null){if(!u.deployed)return true;if(company.units.filter(u=>!u.deployed).length>=company.benchLimit)return false;u.deployed=false;delete u.position;return true;}
  if(!validPosition(target,b))return false;
  if(b.shared&&(!(company.activeRegions||['equities']).includes(regionAt(target))||!compatibleMarkets(u.id).includes(regionAt(target))))return false;
  const other=company.units.find(v=>v!==u&&v.deployed&&sameTile(v.position,target));
  if(!u.deployed&&!other&&company.units.filter(v=>v.deployed).length>=company.floorLimit)return false;
  if(other&&u.deployed&&b.shared&&!compatibleMarkets(other.id).includes(regionAt(u.position)))return false;
  if(other){if(u.deployed)other.position={...u.position};else{other.deployed=false;delete other.position;}}
  u.deployed=true;u.position={...target};return true;
}
export function scoutSnapshot(player,{day=1,week=1}={}){return {firmId:player.id,name:player.name,day,week,units:player.company.units.filter(u=>u.deployed).map(u=>({...u,position:{...u.position}}))};}
export function enableRegionalCompany(company,week=1,day=1){if(!company.board?.shared)for(const u of company.units)delete u.position;company.marketSchema=2;company.board=boardConfig({shared:true});company.activeRegions=unlockedMarkets(week,day);for(const u of company.units)if(u.deployed&&!compatibleMarkets(u.id).some(id=>company.activeRegions.includes(id)))u.deployed=false;assignPositions(company.units.filter(u=>u.deployed),company.board,company.activeRegions);return company;}
