var express = require('express');
var mongoose = require('mongoose');
var chalk = require('chalk');

var app = express();
mongoose.connect('mongodb://localhost/splash');

var drinksController = require('./controllers/drinks');

app.get('/*', function(req, res, next) {
  var referrer = req.get('Referer');
  console.log(referrer);
  if (referrer === "http://chrisaoakley.com:3000/"){
      res.header('Access-Control-Allow-Origin', "*");
  }
  next();
});

app.use('/drinks', drinksController);

app.listen(6543);

console.log(chalk.green('Lisening on port - 6543'));
