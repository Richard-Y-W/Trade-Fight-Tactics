import { test,expect } from '@playwright/test';
test('shared regional floor fits desktop viewports, reveals rival, and completes a multi-market week',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date(1)});await page.goto('/');
  await expect(page.locator('#combat-floor')).toHaveAttribute('data-renderer','pixi');
  for(const [width,height] of [[1920,1080],[1440,900],[1366,768]]){
    await page.setViewportSize({width,height});
    const geometry=await page.evaluate(()=>{
      const r=id=>{const b=document.querySelector(id).getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,b:b.bottom};};
      return {board:r('#tactical-board'),bench:r('#bench'),shop:r('#shop'),left:r('.control-sidebar'),right:r('.lobby'),scroll:document.documentElement.scrollHeight,viewport:innerHeight};
    });
    expect(geometry.board.h).toBeGreaterThan(250);expect(geometry.scroll).toBeLessThanOrEqual(height);expect(geometry.shop.b).toBeLessThanOrEqual(height);
    expect(Math.abs(geometry.board.w-geometry.board.h)).toBeLessThan(2);
    expect(geometry.left.x).toBeLessThan(geometry.board.x);expect(geometry.right.x).toBeGreaterThan(geometry.board.x+geometry.board.w);
    await page.screenshot({path:`docs/media/regional-${width}.png`});
  }
  await page.setViewportSize({width:1440,height:900});
  await expect(page.locator('.deployment-tile')).toHaveCount(64);
  await expect(page.locator('[data-market-select]:enabled')).toHaveCount(1);
  await page.locator('[data-buy="0"]').click();
  const reserve=page.locator('#bench [data-instance]').first(),uid=await reserve.getAttribute('data-instance');
  const tile=page.locator('[data-tile-col="0"][data-tile-row="0"]');
  await reserve.dragTo(tile);await expect(tile.locator('[data-tile-side="0"]')).toHaveAttribute('data-tile-uid',uid);
  await expect(page.locator('[data-tile-side="1"]')).toHaveCount(0);
  const advance=async n=>{for(let i=0;i<n;i++)await page.clock.fastForward(500);};
  for(let day=1;day<=5;day++){
    if(day===2){await page.locator('[data-tile-side="0"]').dragTo(page.locator('[data-tile-col="4"][data-tile-row="0"]'));}
    await page.locator('#start').click();await expect(page.locator('body')).toHaveAttribute('data-battle-phase','opening');
    await expect(page.locator('[data-tile-side="1"]').first()).toBeVisible();
    await advance(20);await page.screenshot({path:`docs/media/regional-day-${day}-combat.png`});
    await advance(64);await expect(page.locator('#day-result')).toBeVisible();
    await expect(page.locator('[data-tile-side="1"]')).toHaveCount(0);
    await expect(page.locator('[data-tile-side="0"]')).toHaveCount(1);
    await page.locator('#next').click();
    if(day<5)await expect(page.locator('[data-market-select]:enabled')).toHaveCount([1,2,4,5,6][day]);
  }
  expect(errors).toEqual([]);
});

test('HTML fallback retains regional placement, live accounting, volume and keyboard removal',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'WebGLRenderingContext',{value:undefined}));
  await page.clock.install({time:new Date(1)});await page.goto('/');
  await expect(page.locator('#combat-floor')).toHaveAttribute('data-renderer','fallback');
  await page.locator('#presentation-drawer summary').click();await expect(page.locator('#volume')).toBeVisible();
  await page.locator('[data-buy="0"]').click();await page.locator('#bench [data-move]').click();
  const tile=page.locator('.deployment-tile:has([data-tile-side="0"])');
  await tile.focus();await page.keyboard.press('Delete');await expect(page.locator('[data-tile-side="0"]')).toHaveCount(0);
  await page.locator('#bench [data-move]').click();await page.locator('#reduce-effects').check();await page.locator('#start').click();
  for(let i=0;i<20;i++)await page.clock.fastForward(500);
  await expect(page.locator('[data-tile-side="0"] .fallback-net')).not.toHaveText('');
  await expect(page.locator('[data-tile-side="0"]')).toHaveAttribute('title',/marked net.*filled/);
  await page.screenshot({path:'docs/media/regional-fallback.png'});
});
