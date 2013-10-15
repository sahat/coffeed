
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;

var app = express();
mongoose.connect('localhost');

var Item = mongoose.model('Item', {
  name: String
});

var Order = mongoose.model('Order', {
  type: String,
  items: [{
    name: String,
    quantity: Number
  }],
  location: String,
  user: String,
  created_at: Date
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/' })
);
app.get('/signup', function(req, res) {
  res.render('signup');
});

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/orders/sell/new', function(req, res) {
  Item.find(function(err, items) {
    res.render('new_order', { items: items });
  });
});
app.get('/orders/create/new', function(req, res) {
  Item.find({ type: 'create' }, function(err, items) {
    res.render('new_order', { items: items });
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
