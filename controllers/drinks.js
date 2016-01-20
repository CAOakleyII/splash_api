var chalk = require('chalk');
var express = require('express');
var Drinks = require('./../models/drinks');
var router = express.Router();
var _ = require('lodash');

router.get('/', function(req, res) {

  var defaults = {
    selector : {},
    sort: {},
    limit : 50,
    skip : 0
  };

  if(req.query.selector) {
    req.query.selector = JSON.parse(req.query.selector);
  }

  var sort = {};
  var query = {};

  _.extend(query, defaults, req.query);

  Drinks.find(query.selector)
  .limit(query.limit)
  .skip(query.skip)
  .sort(query.sort)
  .exec(function(err, drinks){
    if (err) {
      console.log(chalk.red('Error retrieving drinks from database using query - '), query);
      return res.status(400).send('Bad Request');
    }
    res.json(drinks);
  });

});


router.get('/:id', function(req, res){
  Drinks.find({ _id : req.params.id }, function(err, drinks){
    if (err) {
      console.log(chalk.red('Error retrieving drinks from database with id - '), req.params.id, err);
      return res.status(400).send('Bad Request');
    }
    if(drinks.length === 0){
      return res.status(404).send('Not Found');
    }
    res.json(drinks);
  });
});

module.exports = router;
