
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');

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
