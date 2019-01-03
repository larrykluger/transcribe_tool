// github_auth.js

const passport = require('passport')
    , ds_configuration = require('../ds_configuration.js').config
    ;

const github_auth = exports;

// See https://www.npmjs.com/package/passport-github2
github_auth.login = (req, res, next) => {
  passport.authenticate('github')(req, res, next);
  // Use the following if you want more info from the user's profile
  //passport.authenticate('github', { scope: [ 'user:email' ] })(req, res, next);
}


const login_callback_1 = (req, res, next) => {
        passport.authenticate('github', { failureRedirect: '/login' })(req, res, next)
      }
    , login_callback_2 = (req, res) => {
        // Successful authentication, redirect home.
        req.flash('info', 'Success: You have logged in via GitHub');
        res.redirect('/');
      };
github_auth.login_callback = [login_callback_1, login_callback_2];

github_auth.logout = (req, res) => {
  req.logout();
  res.redirect('/');
}
