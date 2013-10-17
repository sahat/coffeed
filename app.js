
/**
 * Module dependencies.
 */

var express = require('express');
var flash = require('connect-flash');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt')

var app = express();
mongoose.connect('localhost');

var User = mongoose.model('User', {
  firstName: String,
  lastName: String,
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true}
});

User.pre('save', function(next) {
	var user = this;

	if(!user.isModified('password')) return next();

	bcrypt.genSalt(10, function(err, salt) {
		if(err) return next(err);

		bcrypt.hash(user.password, salt, function(err, hash) {
			if(err) return next(err);
			user.password = hash;
			next();
		});
	});
});

User.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if(err) return cb(err);
		cb(null, isMatch);
	});
};

/**
 * Database Schema
 */
var Item = mongoose.model('Item', {
  name: String
});

var Order = mongoose.model('Order', {
  orderNumber: Number, // auto-increment?
  orderType: String,
  items: [{
    name: String,
    quantity: Number
  }],
  location: String,
  user: String,
  created_at: Date
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (err) { return done(err); }
    if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if(isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid password' });
      }
    });
  });
}));

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'Aw82m9q' }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
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
    failureRedirect: '/login',
    failureFlash: true })
);

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;

  var user = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password
  });

  user.save(function(err) {
    req.login(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/users/' + req.user.username);
    });
  });
});

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/orders/sell', function(req, res) {
  res.render('view_orders')
});

app.get('/orders', function(req, res) {
  var q = req.querystring.orderType;
  res.render('view_orders')
});


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
