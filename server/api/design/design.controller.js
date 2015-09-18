'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var Design = require('./../../models/design.model');
var Notification = require('./../../models/notification.model');
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
    console.log(req.body);
    var user = req.user;
    var invitees = [];
    var design = new Design();
    design.name = req.body.name,
    design.owner = user.team._id;
    design.project = req.params.id;
    design.descriptions = req.body.descriptions,
    design.type = 'design';
    _.each(req.body.staffs, function(item){
        invitees.push(item._id);
    })    
    design.invitees = invitees;
    design.markModified('invitees');
    design._editUser = user;
    design.save(function(err) {
        if (err) {
            return res.send(500, err);
        }
        return res.json(design)
    });
};

/**
 * Get all staff pacakge
 * @param req
 * @param res
 */
exports.getAll = function(req,res) {
  // var project = req.project;
  var user = req.user;
  Design.find({'project' : req.params.id},function(err,designs) {
    if (err) {
      return res.status(400).json(err);
    }
    async.each(designs,function(item,callback) {
      Notification.find({owner: user._id,'element.package' : item._id, unread : true}).count(function(err,count) {
        item.__v = count;
        callback();
      })
    },function() {
      return res.json(designs)
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