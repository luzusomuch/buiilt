'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var Design = require('./../../models/design.model');
var _ = require('lodash');
var async = require('async');

/**
 * Get a single project
 * @param req
 * @param res
 * @param next
 */
exports.project = function(req,res,next) {
  Project.findById(req.params.id,function(err,project) {
    if (err || !project) {
      return res.send(500, err);
    }
    req.project = project;
    next();
  })
};

/**
 * Get a single staff package
 * @param req
 * @param res
 * @param next
 */
exports.Design = function(req,res,next) {
  Design.findById(req.params.id,function(err,Design) {
    if (err || !Design) {
      return res.send(500, err);
    }
    req.Design = Design;
    next();
  })
}

/**
 * Create a new staff package
 * @param req
 * @param res
 */
exports.createDesign = function(req,res) {
  var user = req.user;
  var project = req.project;
  Validator.validateCreate(req,function(err,data) {
    if (err) {
      return res.send(422, err);
    }
    var Design = new Design(data);
    Design.owner = user.team._id;
    Design.project = project;
    Design.type = 'Design';
    Design.staffs = data.staffs;
    Design.markModified('staffs');
    Design._editUser = user;
    Design.save(function(err) {
      if (err) {
        return res.send(500, err);
      }
      return res.json(Design)
    })
  });
};

/**
 * Get all staff pacakge
 * @param req
 * @param res
 */
exports.getAll = function(req,res) {
  var project = req.project;
  var user = req.user;
  Design.find({'project' : project._id},function(err,packages) {
    if (err) {
      return res.status(400).json(err);
    }
    async.each(packages,function(item,callback) {
      Notification.find({owner: user._id,'element.package' : item._id, unread : true}).count(function(err,count) {
        item.__v = count;
        callback();
      })
    },function() {
      return res.json(packages)
    });
  })
};

exports.getAllDesign = function(req, res){
  Design.find({}, function(err, Designs){
    if (err) {return res.send(500,err);}
    return res.send(200,Designs);
  })
};

exports.destroy = function (req, res) {
  Design.findByIdAndRemove(req.params.id, function (err, Design) {
    if (err) {
      return res.send(500, err);
    }
    console.log(Design);
    Design.find({}, function(err,Designs){
      if (err) {return res.send(500,err);}
      return res.send(200, Designs);
    })
  });
};

/**
 * Get a staff package
 * @param req
 * @param res
 */
exports.get = function(req,res) {
  var Design = req.Design;
  Design.populate(Design,
    [{path:"project"},
      {path:"owner"},
      {path:"staffs"}
    ], function(err, staffPakacge ) {
      if (err) {
        return res.status(400).json(err);
      }
      return res.json(Design);
  });
};

exports.complete = function(req,res) {
  var Design = req.Design;
  Design.isCompleted = !Design.isCompleted;
  Design.save(function(err) {
    if (err) {
      return res.status(400).json(err);
    }
    Design.populate(Design,
      [{path:"project"},
        {path:"owner"},
        {path:"staffs"}
      ], function(err, staffPakacge ) {
        if (err) {
          return res.status(400).json(err);
        }
        return res.json(Design);
      });
  })
};

exports.updateDesign = function(req, res) {
  var requestPackage = req.body.package;
  Design.update({_id: req.params.id},
  {name: requestPackage.name, descriptions: requestPackage.descriptions}, function(err, saved) {
    if (err) {return res.send(500,err);}
    return res.send(200,saved);
  })
};