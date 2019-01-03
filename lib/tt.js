// tt.js
//
// These methods support the transcribe tool. They do not maintain any state
//
//

const fs = require('fs')
    , path = require('path')
    ;

const tt = exports;

const debug = true  // should debug statements be printed?
    , debug_prefix = 'tt'
    ;

// public variables

/** Index controller */
tt.index_controller = (req, res) => {
  res.render('pages/index', {title: "Home"});
}
