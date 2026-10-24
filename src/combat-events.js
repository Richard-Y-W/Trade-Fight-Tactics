export const EVENT_SCHEMA=1;
const kinds={quote:'quote_updated',fill:'order_filled',cancel:'order_cancelled',signal:'research_signal_generated',hedge:'hedge_executed',limit:'risk_limit_triggered',contest:'execution_contested',option:'option_settled',signal_result:'signal_evaluated',settlement:'round_settled'};
export function stampEvents(s) {
  s.replay??=[];s.eventSequence??=0;
  for(const e of s.events)if(e.eventId==null){e.eventId=++s.eventSequence;e.schemaVersion=EVENT_SCHEMA;e.tick=s.tick;e.simTimeMs=s.tick*500;e.kind=kinds[e.type]||e.type;s.replay.push({...e});}
}
export function replayRecord(s) {
  return {schemaVersion:EVENT_SCHEMA,seed:s.seed,scenario:s.scenario,marketModel:s.regional?'regional':'legacy-proxy',instruments:s.instruments.map(m=>({id:m.id||m.ticker,market:m.market||m.ticker,multiplier:m.multiplier||1,priceScale:m.priceScale||100})),active:[...s.active],board:{...s.board},tickMs:500,units:s.firms.map(f=>f.units),events:s.replay.map(e=>({...e})),finalMarks:[...s.prices]};
}
