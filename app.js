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
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var _ = require('underscore');

var app = express();
mongoose.connect('localhost');

var userSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true}
});

userSchema.pre('save', function(next) {
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

userSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if(err) return cb(err);
		cb(null, isMatch);
	});
};

/**
 * Database Schema and Models
 */

var User = mongoose.model('User', userSchema);

var Item = mongoose.model('Item', {
  name: String,
  itemType: String
});

var Location = mongoose.model('Location', {
  name: String
});


var Order = mongoose.model('Order', {
  orderType: String,
  items: [{
    name: String,
    quantity: Number
  }],
  location: String,
  user: String,
  created: { type: Date, default: Date.now }
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

app.get('/login', function(req, res) {
  res.render('login', {
    user: req.user
  });
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true })
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/signup', function(req, res) {
  res.render('signup', {
    user: req.user
  });
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
      if (err) throw err;
      res.redirect('/');
    });
  });
});

app.get('/', function(req, res){
  res.render('index', {
    user: req.user
  });
});

app.get('/admin', function(req, res) {
  Item.find(function(err, items) {
    Location.find(function(err, locations) {
      res.render('admin', {
        items: items,
        locations: locations,
        user: req.user
      });
    });
  });
});

// Create a new item
app.post('/admin/items', function(req, res) {
  var item = new Item({
    itemType: req.body.type,
    name: req.body.name
  });
  item.save(function(err) {
    res.redirect('/admin');
  });
});

// Create a new location
app.post('/admin/locations', function(req, res) {
  var location = new Location({
    name: req.body.name
  });
  location.save(function(err) {
    res.redirect('/admin');
  });
});

// Update a location or an item
app.put('/admin', function(req, res) {
  if (req.body.name === 'location') {
    Location.update({ _id: req.body.pk }, { $set: { name: req.body.value } }, function() {
      res.send(200);
    });
  } else if (req.body.name === 'item') {
    Item.update({ _id: req.body.pk }, { $set: { name: req.body.value } }, function() {
      res.send(200);
    });
  }
});

app.del('/admin/items/:id', function(req, res) {
  Item.remove({ _id: req.params.id }, function() {
    res.send(200);
  });
});

app.del('/admin/locations/:id', function(req, res) {
  Location.remove({ _id: req.params.id }, function() {
    res.send(200);
  });
});

/**
 * Existing Orders
 */
app.get('/orders', function(req, res) {
  var orderType = req.query.type;
  Order.find({ orderType: orderType }, function(err, orders) {
    var locations = [];
    for (var i = 0; i < orders.length; i++) {
      locations.push(orders[i].location);
    };
    locations = _.uniq(locations);
    console.log(locations)
    res.render('existingOrders', { orders: orders, locations: locations });
  });
});

app.post('/orders', function(req, res) {

  if (!req.body.location) return res.send(500, 'Please select a store');

  var order = new Order({
    orderType: req.body.orderType,
    items: req.body.items,
    location: req.body.location
  });

  order.save(function(err) {
    if (err) throw err;
    res.send(200, 'Your order has been placed');
  });
});

app.get('/orders/new/:type', function(req, res) {

  var stores = ['Northern Blvd', 'Port Washington', 'CUNYLaw'];

  var items = {
    create: ['Cucumber', 'Tomato', 'Lettuce', 'Sugar', 'Salt', 'Spices', 'Ginger', 'Apples', 'Potatoes'],
    sell: ['Hot Latte', 'Iced Latte', 'Americano', 'Cappuccino', 'Cinnamon', 'Hot Chocolate', 'Panini', 'Fruit Salad']
  };

  res.render('placeOrder', {
    items: items,
    stores: stores,
    orderType: req.params.type,
    user: req.user
  });
});

app.get('/orders/:id', function(req, res) {
  var orderNumber = req.params.id;
  Order.findOne({ orderNumber: orderNumber }, function(err, order) {
    return res.render('orderDetail', { order: order });
  });
});

app.put('/orders/:id', function(req, res) {
  var order = req.body.order;
  var orderNumber = req.params.id;
  Order.findOne({ orderNumber: orderNumber }, function(err, order) {
    // update the whole order object if attribute is changed
    return res.render('orderDetail', { order: order });
  });
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
