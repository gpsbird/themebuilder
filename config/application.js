'use strict'

const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const os = require('os')
const formidable = require('formidable')
const child_process = require('child_process')

/**
 * Globals
 */

global.__root = path.join(__dirname, '/..')
let port = 53011

/**
 * Locals
 */

app.locals.title = "Theme Builder"
app.locals.views = __root + '/app/views'

/**
 * Settings
 */

app.disable('x-powered-by')

/**
 * View engine: Embedded JavaScript - ejs.co
 */

app.engine('html.ejs', require('ejs').renderFile);
app.set('views', app.locals.views)
app.set('view engine', 'html.ejs')

/**
 * Middleware
 */

app.use(require(__root + '/lib/middleware/setup_instructions'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(require(__root + '/lib/middleware/serve_favicon'))

/**
 * Static assets
 */

app.use('/assets', express.static(__root + '/node_modules/jquery/dist'))
app.use('/assets', express.static(__root + '/node_modules/popper.js/dist/umd'))
app.use('/assets', express.static(__root + '/node_modules/font-awesome'))
app.use('/assets', express.static(__root + '/tmp/bootstrap/dist'))

/**
 * Routes
 */

app.get("/", (req, res) => {
  let scss = fs.readFileSync(__root + '/tmp/bootstrap/scss/_custom.scss', 'utf8')
  res.render("editor", { custom_scss: scss })
})
app.post("/update", (req, res, next) => {
  var form = new formidable.IncomingForm()
  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err)
    } else {
      let custom_scss = fields.style.toLowerCase()
      if (custom_scss.length == 0) {
        fs.writeFileSync(__root + '/tmp/bootstrap/scss/_custom.scss', "// Drink the Sea" + os.EOL, 'utf8')
      } else {
        fs.writeFileSync(__root + '/tmp/bootstrap/scss/_custom.scss', custom_scss + os.EOL, 'utf8')
      }
      child_process.exec('npm install', { cwd: __root + '/tmp/bootstrap' }, (err, stdout, stderr) => {
        if (err) {
          next(err)
        } else {
          child_process.exec('npm run css-main', { cwd: __root + '/tmp/bootstrap' }, (err, stdout, stderr) => {
            if (err) {
              next(err)
            } else {
              res.sendStatus(200)
            }
          })
        }
      })
    }
  })
})
app.get("/download", (req, res) => {
  let css_path = __root + '/tmp/bootstrap/dist/css/bootstrap.min.css'
  res.download(css_path, 'bootstrap.min.css', (err) => {
    if (err) {
      next(err)
    } else {
      console.log('Sent:', 'bootstrap.min.css')
    }
  })
})

/**
 * Error handlers
 */

app.use(require(__root + '/lib/middleware/page_not_found'))
app.use(require(__root + '/lib/middleware/render_error'))


/**
 * Start server
 */

if (!module.parent) {
  app.listen(port, () => {
    console.log(`Running express.js app on port ${port}`)
  })
}

/**
 * Export app
 */

module.exports = app
