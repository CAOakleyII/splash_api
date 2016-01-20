/**
* @author: Chris Oakley
* @date: 1/14/2016
*
*  Scrapes the website drinksmixer.com for all of it's drinks found on the
*  catalog pages. The drinks are then added to the local mongo databse.
*/

var request = require('superagent');
var mongoose = require('mongoose');
var cheerio = require('cheerio');
var async = require('async');
var Drinks = require('./models/drinks');
var _ = require('lodash');
var chalk = require('chalk');

var drinksAdded = 0;

mongoose.connect('mongodb://localhost/splash');

/**
* Our entry function to start the scrape process.
*
*/
function scrape() {

  var website = {
    links : [],
    nextPage : 'http://www.drinksmixer.com/cat/1/1/',
    domain: 'http://www.drinksmixer.com'
  };

  // traverse the website building a list of all the links to an individual drink
  traverseWebsite(website, function(err){
    async.each(website.links, addDrink, function(err) {
      if (err) {
        // one of the drinks couldn't be added
        console.log(chalk.red('\n\nCould not add a drink to the database.'), err);
        exit();
      } else {
        console.log(chalk.green('\n\nAll possible drinks were added.'));
        exit();
      }
    });
  });
}



/**
* Recursively walk down the linked list of pages.
*
* @param {object}   website  - The website node that we are we
*                              going to taverse down using a linked list approach.
* @param {function} callback - The callback function
*/
function traverseWebsite(website, callback) {
  buildLinksToDrinks(website, function(err, result) {
    // if there is no longer a next page we reached the end of the list
    if (!result.nextPage) {
      callback();
      console.log(chalk.green('\n\n Scrapping finished!'));
      return;
    }

    // scrape the next page.
    traverseWebsite(result, callback);
  });
}

/**
* Build a list of urls to each individual drink page that is found on the current
* web page.
*
* @param {object} website    - the website node that is going to be searched for
*                              any individual drink urls.
* @param {function} callback - the callback function
*/
function buildLinksToDrinks(website, callback) {
  request
  .get(website.nextPage)
  .set('Accept', 'text/html')
  .end(function(err, res) {
    if (err || !res.ok) {
      console.log("There was an issue with the request.", err, res.status);
      return;
    }

    var $ = cheerio.load(res.text);

    // get all drinks on page.
    var drinkLinks = $('div.min > div.pm table a');

    drinkLinks.each(function(index, anchor) {
      website.links.push(website.domain + $(anchor).attr('href'));
    });

    // move to next page
    var relativeLink = $('img[alt="Next page"]').parent().attr('href');
    website.nextPage = relativeLink ? website.domain + relativeLink : "";

    // print progress
    process.stdout.write(chalk.yellow('Scraping page - ' + website.nextPage + '.\x1b[0G'));

    callback(null, website);
  });
}

/**
* Using the specified link to an individual drink page. Gather information about
* that drink, create a drink document and add it to the database.
*
* @param {string} link - The direct url to the drink we should add.
* @param {function} callback - The callback function.
*/
function addDrink(link, callback) {
  request
  .get(link)
  .set('Accept', 'text/html')
  .end(function(err, res) {
    if (err) {
      // skip this one
      console.log('Error retriving drink for url: ', link);
      callback();
      return;
    }
    if (!res.ok) {
      // skip this one
      console.log('Error retriving drink for url: ', link);
      callback();
      return;
    }

    var $ = cheerio.load(res.text);
    var drinkName = $('.recipe_title').text();
    var summary = $('.summary.RecipeDirections').text();
    var instructions = $('.RecipeDirections.instructions').text();
    var ingredients = _.map($('.ingredient'), function(item) {
      return $(item).text();
    });

    var model = {
      name : drinkName || '',
      summary : summary,
      ingredients : ingredients,
      instructions : instructions
    };


    Drinks.update({ name : model.name}, model, { upsert : true }, function(err, raw) {
      if (err) {
        console.log(chalk.red('Error saving drink to database - '), raw);
        callback(err);
      }

      drinksAdded++;
      process.stdout.write(chalk.yellow('Drink Added. ' + drinksAdded + '.\x1b[0G'));
      callback();
    });
  });
}

/**
* Because this is going to be run as a cron task, we have to make sure we
* disconnect from mongoose and exit the process when we are done.
*/
function exit() {
  mongoose.disconnect();
  process.exit(0);
}

// start the scrapping.
scrape();
