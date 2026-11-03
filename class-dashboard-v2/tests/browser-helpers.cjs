async function watchClose(page,selector){await page.evaluate(selector=>{const d=document.querySelector(selector);d.dataset.testClosed='false';d.addEventListener('close',()=>{d.dataset.testClosed='true';},{once:true});},selector);}
async function closed(page,selector){await page.waitForFunction(selector=>document.querySelector(selector).dataset.testClosed==='true',selector);}
async function closePresentation(page){await watchClose(page,'#presentation-dialog');await page.locator('#close-display-controls').click();await closed(page,'#presentation-dialog');}
// Public display controls now live in a native dialog. Tests follow that user path.
async function choosePresentation(page,selector,value){
 if(!['#focus-mode','#display-font','#display-theme','#display-layout'].includes(selector))return page.locator(selector).selectOption(value);
 const opened=!await page.locator('#presentation-dialog').evaluate(e=>e.open);
 if(opened)await page.locator('#open-display-controls').click();
 await page.locator(selector).selectOption(value);
 if(opened)await closePresentation(page);
}
async function pressPrivacy(page){const opened=!await page.locator('#presentation-dialog').evaluate(e=>e.open);if(opened)await page.locator('#open-display-controls').click();await page.locator('#projection-privacy').click();if(opened)await closePresentation(page);}
async function choosePreset(page,seconds){const details=page.locator('#timer-presets');const wasOpen=await details.evaluate(e=>e.open);if(!wasOpen)await details.locator('summary').click();await page.locator(`[data-preset="${seconds}"]`).click();if(!wasOpen)await details.locator('summary').click();}
async function adjustTimer(page,id){const details=page.locator('#timer-presets'),wasOpen=await details.evaluate(e=>e.open);if(!wasOpen)await details.locator('summary').click();await page.locator(id).click();if(!wasOpen)await details.locator('summary').click();}
async function escapeDialog(page,selector){await watchClose(page,selector);await page.keyboard.press('Escape');await closed(page,selector);}
module.exports={escapeDialog,choosePresentation,pressPrivacy,choosePreset,adjustTimer};
