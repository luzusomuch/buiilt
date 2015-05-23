'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PackageSchema = {
  //owner, it can be home owner, home builder... base on package type
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    // required: 'Package type is required'
  },
  description: {
    type: String,
    default: ''
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

/**
 * exports as mongoose plugin
 *
 * @param {type} schema
 * @param {type} options
 * @returns {undefined}
 */
module.exports = exports = function(schema, options){
  schema.add(PackageSchema);

  if(options){
    //TODO - do something
  }

  /**
  * Pre-save hook
  */
 schema
 .pre('save', function(next) {
   this.wasNew = this.isNew;
   
   if (!this.isNew){
     this.updatedAt = new Date();
   }

   next();
 });
};