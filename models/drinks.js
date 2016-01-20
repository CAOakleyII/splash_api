var mongoose = require('mongoose');

/**
*
* @class Drink
* @classdesc A mongoose model that defines the types and structure of the drinks schema.
* @param {string} name - The name of the drink.
* @param {string} summary - A summary of what the drink is like and when it's best served.
* @param {string} instructions - Special instructions for making the drink.
* @param {Array}  ingredients - An array of the ingredients needed for the drink.
*/
module.exports = mongoose.model('Drink', {
  name : String,
  summary : String,
  instructions : String,
  ingredients : Array
});
