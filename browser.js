const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const cloudflareScraper = require('cloudflare-scraper')
puppeteer.use(StealthPlugin())

async function startBrowser() {
  let browser
  try {
    console.log('Opening the browser......')
    browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      ignoreHTTPSErrors: true,
      slowMo: 0,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-infobars'],
    })
  } catch (err) {
    console.log('Could not create a browser instance => : ', err)
  }
  return browser
}

module.exports = {
  startBrowser,
}
