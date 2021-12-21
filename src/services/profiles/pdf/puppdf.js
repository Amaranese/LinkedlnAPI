const puppeteer = require("puppeteer");
const fs = require("fs-extra");
(async function(){
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
    
        await page.setContent('<h1>HELLO</h1>');
        await page.emulateMediaFeatures("screen");
        await page.pdf({
            path:"CV.pdf",
            format:"A4",
            printBackground: true
        })
        console.log("done");
        await browser.close();
        process.exit();
    } catch (error) {
        console.log(error)
    }
})();