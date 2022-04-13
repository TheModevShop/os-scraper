const pageScraper = require('./scraper')
async function scrapeAll(browserInstance, url) {
  let browser
  try {
    browser = await browserInstance
    let scrapedData = {}
    // Call the scraper for different set of books to be scraped
    scrapedData['lda'] = await pageScraper.scraper(browser, url)
    return scrapedData
  } catch (err) {
    console.log('Could not resolve the browser instance => ', err)
    return {error: err.message}
  }
}
module.exports = (browserInstance, url) => scrapeAll(browserInstance, url)
