// Translate ledger events into compact role cues. This module does not change the simulation.
export function feedbackFor(events, firm = 0) {
  const units = new Map(), traits = new Map();
  const priority = {quote:1,limit:1,signal:2,capacity:2,fill:3,press:4,hedge:5};
  for(const event of events) {
    if(event.firm!==firm)continue;
    if(event.trait)traits.set(event.trait,event);
    if(!event.source || !priority[event.type])continue;
    const key=event.source.uid??event.source.id, previous=units.get(key);
    if(!previous || priority[event.type]>priority[previous.type]) units.set(key,{...event});
    else if(previous.type===event.type) {
      // Aggregate the same action across markets; avoid pretending one trader earned all firm P&L.
      if(event.type==='fill') { previous.qty+=event.qty; previous.edge+=event.edge; }
      if(event.type==='hedge') { previous.qty+=event.qty; previous.cost+=event.cost; previous.before+=event.before; previous.after+=event.after; }
    }
  }
  return {units:[...units.values()],traits:[...traits.entries()]};
}
