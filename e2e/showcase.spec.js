import { test,expect } from '@playwright/test';
import { copyFile,writeFile } from 'node:fs/promises';
test('record an actual 40-second browser battle and measure rendering',async({browser})=>{
  const context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:'test-results/videos',size:{width:1280,height:900}}});
  const page=await context.newPage();await page.addInitScript(()=>{Date.now=()=>1;});await page.goto('http://127.0.0.1:5173');
  await expect(page.locator('#combat-floor')).toHaveAttribute('data-renderer','pixi');
  for(const slot of [0,1,3]){await page.locator(`[data-buy="${slot}"]`).click();await page.locator('#bench [data-move]').last().click();}
  await page.evaluate(()=>{window.__frames=[];let previous=performance.now();function frame(now){window.__frames.push(now-previous);previous=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);});
  await page.locator('#start').click();await page.locator('.scoreboard').scrollIntoViewIfNeeded();
  await page.waitForTimeout(8000);await page.screenshot({path:'docs/media/ui-battle-viewport.png'});
  await expect(page.locator('body')).toHaveAttribute('data-battle-phase','results',{timeout:45000});
  await expect(page.locator('body')).toHaveAttribute('data-battle-phase','prep',{timeout:10000});await page.waitForTimeout(500);
  const frames=await page.evaluate(()=>window.__frames.slice(20));frames.sort((a,b)=>a-b);
  await writeFile('docs/audits/browser-frame-times.json',JSON.stringify({scope:'Real-time headless Edge browser, full UI and Pixi; requestAnimationFrame intervals, not GPU timings. One real-time continuous cycle: preparation, reveal, 40-second market, settled results and automatic next preparation; screenshot/recording overhead included. Machine-specific, not an FPS guarantee.',samples:frames.length,meanMs:frames.reduce((n,v)=>n+v,0)/frames.length,p95Ms:frames[Math.floor(frames.length*.95)],p99Ms:frames[Math.floor(frames.length*.99)]},null,2));
  const video=page.video();await context.close();await copyFile(await video.path(),'docs/media/browser-battle.webm');
});
