import { test,expect } from '@playwright/test';

test('complete playable week, Pixi combat, inspection, resized layout and reduced effects',async({page})=>{
  const advance=async(ms)=>{for(let t=0;t<ms;t+=500)await page.clock.fastForward(Math.min(500,ms-t));};
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date(1)});await page.goto('/');
  await expect(page.locator('#combat-floor')).toHaveAttribute('data-renderer','pixi');
  await page.screenshot({path:'docs/media/ui-preparation.png',fullPage:true});
  for(const slot of [0,1,3]){await page.locator(`[data-buy="${slot}"]`).click();await page.locator('#bench [data-move]').last().click();}
  await expect(page.locator('#desk .company-unit')).toHaveCount(3);
  await page.locator('#start').click();await advance(8500);
  await page.locator('[data-tile-side="0"]').first().click();
  await expect(page.locator('#battle-readout')).toContainText('Trades & costs');
  await page.locator('.inspection-advanced summary').click();await expect(page.locator('.inspection-advanced')).toContainText('Realized');
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'docs/media/ui-combat.png',fullPage:true});
  if(!await page.locator('#presentation-drawer').evaluate(e=>e.open))await page.locator('#presentation-drawer summary').click();await page.locator('#reduce-effects').check();await page.setViewportSize({width:780,height:1050});await advance(1000);
  await expect(page.locator('.unit-clash')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'docs/media/ui-compact.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1050});await advance(33000);
  await expect(page.locator('#day-result')).toBeVisible();await expect(page.locator('#closing-highlights')).toContainText('TOP ORDER STREAM');
  await page.screenshot({path:'docs/media/ui-closing.png',fullPage:true});
  await page.locator('#next').click();for(let a=0;a<2;a++)await page.clock.fastForward(500);
  for(let d=2;d<=5;d++){await page.locator('#start').click();await advance(42000);await expect(page.locator('#day-result')).toBeVisible();await page.locator('#next').click();for(let a=0;a<2;a++)await page.clock.fastForward(500);}
  await expect(page.locator('#phase-label')).toHaveText('WEEKEND DRAFT');await page.screenshot({path:'docs/media/ui-weekend.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('missing characters preserve the live renderer and reduced-motion preference',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.route('**/roguelikeChar_transparent.png',r=>r.abort());await page.goto('/');
  await expect(page.locator('#combat-floor')).toHaveAttribute('data-renderer','pixi');
  await page.locator('[data-buy="0"]').click();await page.locator('#bench [data-move]').click();await page.locator('#start').click();
  await expect(page.locator('#control-status')).toHaveText('CONNECTED');
});
