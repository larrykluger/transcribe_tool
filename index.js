#!/usr/bin/env node

const express = require('express')
    , session = require('express-session')  // https://github.com/expressjs/session
    , MemoryStore = require('memorystore')(session) // https://github.com/roccomuso/memorystore
    , path = require('path')
    , PORT = process.env.PORT || 5000
    , flash = require('express-flash')
    , helmet = require('helmet') // https://expressjs.com/en/advanced/best-practice-security.html
    , _ = require('lodash')
    , csp = require('helmet-csp')
    , tt = require('./lib/tt.js')
    ;

const max_session_min = 6000;

let session_store = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
    })
  , app = express()
  .use(helmet())
  .use(express.static(path.join(__dirname, 'public')))
  .use(session({
    secret: 'jhbasdlib328y2389u2y3rhn',
    name: 'transcribe-tool-session',
    cookie: {maxAge: max_session_min * 60000},
    saveUninitialized: true,
    resave: true,
    store: session_store}))
  .use((req, res, next) => {res.locals.user = req.user; next()}) // Send user info to views
  .use(flash())
  .use(csp({
    // Specify directives as normal.
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'self'", "https://code.jquery.com","https://cdnjs.cloudflare.com",
        "https://maxcdn.bootstrapcdn.com", "https://cdn.jsdelivr.net",
        "'unsafe-inline'"], // inline needed for audio player
      styleSrc: ["'self'", "'unsafe-inline'", "https://maxcdn.bootstrapcdn.com",
        "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
      mediaSrc: ["'self'", "data:"],
      sandbox: ['allow-forms', 'allow-scripts', 'allow-modals',
        'allow-popups', 'allow-same-origin'],
      // Don't set the following
      upgradeInsecureRequests: false,
      workerSrc: false,
      fontSrc: false,
      objectSrc: false,
    },
    // This module will detect common mistakes in your directives and throw errors
    // if it finds any. To disable this, enable "loose mode".
    loose: false,
    reportOnly: false,
    setAllHeaders: false,
    // Set to true if you want to disable CSP on Android where it can be buggy.
    disableAndroid: true,
    browserSniff: true
  }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  // Routes
  .get('/', tt.index_controller)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));
