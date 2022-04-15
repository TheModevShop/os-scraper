const randomUseragent = require('random-useragent')
const proyPup = require('puppeteer-proxy')
const proxyRequest = proyPup.proxyRequest
const Promise = require('bluebird')
const moment = require('moment')
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36'

function pick() {
  const proxiesList = [
    '141.98.155.112',
    '195.7.5.140',
    '104.233.48.37',
    '181.177.71.83',
    '186.179.25.200',
  ]
  return proxiesList[Math.floor(Math.random() * proxiesList.length)]
}

const scraperObject = {
  async scraper(browser, url) {
    let page = await browser.newPage()
    await page.setRequestInterception(true)
    page.on('request', async request => {
      const dd = pick()
      await proxyRequest({
        page,
        proxyUrl: `http://vincent_pr-esut3:3859pEJAZD@${dd}:3199`,
        request,
      })
    })

    const userAgent = randomUseragent.getRandom()
    const UA = userAgent || USER_AGENT
    const navigationPromise = page.waitForNavigation({
      waitUntil: 'domcontentloaded',
    })

    // await page.setViewport({
    //   width: 1920 + Math.floor(Math.random() * 100),
    //   height: 1000 + Math.floor(Math.random() * 100),
    //   deviceScaleFactor: 1,
    //   hasTouch: false,
    //   isLandscape: false,
    //   isMobile: false,
    // })

    await page.setUserAgent(UA)
    await page.setJavaScriptEnabled(true)
    await page.setDefaultNavigationTimeout(25000)
    await page.setDefaultTimeout(10000)
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en',
    })

    await page.goto(url)
    await navigationPromise

    try {
      await page.waitForSelector('.CollectionLink--link', {timeout: 3000})
    } catch (err) {
      try {
        await page.waitForSelector('h1 .code-label', {timeout: 3000})
        return {blocked: true}
      } catch (err) {}

      const data = await page.evaluate(
        () => document.querySelector('*').outerHTML,
      )
      await page.close()
      return {page: data}
    }

    await page.evaluate(() => {
      window.scrollBy(0, 2400)
    })

    let dataObj = {}

    const tables = await getTables(page)
    tables.forEach(({table, value}) => {
      dataObj[value] = table
    })
    dataObj['currentPrice'] = await tradeStationParser(page)
    dataObj['activity'] = await eventHistoryTable(
      page,
      '.item--trading-history',
    )
    await page.close()
    return dataObj
  },
}

async function tradeStationParser(page) {
  const title = await page.$(`.TradeStation--price`)
  const price = await title?.evaluate(el => el.textContent)

  const title2 = await page.$('.Price--fiat-amount-secondary')
  const fiat = await title2?.evaluate(el => el.textContent)
  return {
    price,
    fiat,
  }
}

async function getTables(page) {
  const tableLength = await page.$$(`.item--orders`)
  return await Promise.map(tableLength, async (cell, index) => {
    const accordianTitle = await page.$(
      `.item--orders:nth-child(${index + 1}) button span`,
    )
    const value = await accordianTitle?.evaluate(el => el.textContent)
    const table = await tableParser(
      page,
      `.item--orders:nth-child(${index + 1}) li`,
    )
    return {table, value}
  })
}

async function tableParser(page, wrapper) {
  const headers = await page.$$(`${wrapper} div[role="columnheader"]`)
  const headerValues = await getCells(headers, page)
  const rows = await page.$$(`${wrapper}`)
  return await Promise.map(rows, async (row, index) => {
    const cells = await row.$$(`div[role="cell"]`)
    const cellValues = await getCells(cells, page)
    return cellValues.reduce((acc, {value, index}) => {
      const key = headerValues.find(hv => hv.index === index)?.value
      if (key) {
        acc[key.toLowerCase().replace(/ /g, ' ')] = value
      }
      return acc
    }, {})
  })
}

async function eventHistoryTable(page, wrapper) {
  const headers = await page.$$(`${wrapper} .Row--isHeader .Row--cell`)
  const headerValues = await getCells(headers, page)
  const rows = await page.$$(`${wrapper} .EventHistory--row`)
  return await Promise.map(rows, async (row, index) => {
    const cells = await row.$$(`.Row--cell`)
    const cellValues = await getFormattedCells(cells, page)

    async function getFormattedCells(cells, page) {
      return await Promise.map(cells, async (cell, index) => {
        const value = await page.evaluate(el => el.innerText, cell)
        const result = [{value, index}]

        const img = await cell.$(`img`)
        if (img) {
          const value = await page.evaluate(el => el.alt, img)
          result.push({value, ko: 'currency'})
        }

        return result
      }).reduce((acc, val) => [...acc, ...val], [])
    }

    return cellValues.reduce((acc, {value, index, ko}) => {
      const key = ko || headerValues.find(hv => hv.index === index)?.value

      if (key === 'Date' && value.includes('ago')) {
        value = moment()
          .subtract(value.split(' ')[0], value.split(' ')[1])
          .format()
      }

      if (key) {
        acc[key.toLowerCase().replace(/ /g, ' ')] =
          value.split(/\n/)[1] || value
      }
      return acc
    }, {})
  })
}

async function getCells(cells, page) {
  return await Promise.map(cells, async (cell, index) => {
    const value = await page.evaluate(el => el.innerText, cell)
    return {value, index}
  })
}

module.exports = scraperObject
