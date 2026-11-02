import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-gpu']});
for(const size of [{width:1440,height:900},{width:390,height:844}]){
 const page=await browser.newPage({viewport:size,hasTouch:size.width<600,reducedMotion:'reduce',timezoneId:'Europe/Zurich'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const RealDate=Date;window.__fakeTime=Date.parse('2026-11-02T22:59:59.800Z');window.__times=[];class MockDate extends RealDate{constructor(...args){super(...(args.length?args:[window.__fakeTime]));}static now(){return window.__fakeTime;}}window.Date=MockDate;const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(value,...args){if(/^\d\d:\d\d$/.test(String(value)))window.__times.push(value);return original.call(this,value,...args);};});
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 await page.evaluate(()=>scrollTo(0,document.querySelector('#skills').offsetTop));await page.waitForTimeout(400);await page.screenshot({path:`readability-${size.width}-keyboard.png`});
 await page.evaluate(()=>scrollTo(0,document.querySelector('#kontakt').offsetTop));await page.waitForTimeout(400);await page.screenshot({path:`readability-${size.width}-phone.png`});
 await page.evaluate(()=>{window.__fakeTime=Date.parse('2026-11-02T23:00:00.000Z');});await page.waitForTimeout(700);
 console.log(JSON.stringify({size,errors,times:await page.evaluate(()=>window.__times),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}));await page.close();
}
await browser.close();
