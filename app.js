const browserObject = require('./browser')
const pageController = require('./pageController')
const express = require('express')
const cors = require('cors')
let browserInstance = browserObject.startBrowser()

const app = express()
const port = 2000

app.use(cors())

app.get('/', async (req, res) => {
  console.log(req.query.url, 'sdfjkhsdfhkdfskjhdsfhkjds')

  try {
    const d = await pageController(browserInstance, req.query.url)
    res.json(d)
  } catch (err) {
    console.log(err)
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
