var nodemailer = require('nodemailer'),
  htmlToText = require('nodemailer-html-to-text').htmlToText,
  smtpTransport = require('nodemailer-smtp-transport'),
  mailgunTransport = require('nodemailer-mailgun-transport'),
  config = require('./../config/environment'),
  okay = require('okay'),
  path = require('path'),
  _ = require('lodash'),
  viewsPath = '../views/emails/',
  SwigEngine = require('swig').Swig,
  swig = new SwigEngine({
    varControls: ['<%=', '%>'],
    cache : false
  });

function Mailer(options) {
  this.transport = nodemailer.createTransport(options);
};

Mailer.prototype.render = function(template, options, callback) {
  swig.renderFile(path.join(__dirname, viewsPath, template), options || {}, callback);
};

Mailer.prototype.send = function(options, callback) {
  var options = options || {};

  _.defaults(options, {
    from : config.emailFrom,
    bcc : config.bccEmails || []
  });
  this.transport.sendMail(options, function(err, data){
    if(err){
      return console.log('mailer error', err);
    }

    return callback && callback(null, data);
  });
};

Mailer.prototype.sendMail = function(template, emails, options, callback) {
  var self = this;
  self.render(template, options, okay(callback, function(output) {
    self.send({
      to : emails,
      subject : options.subject,
      html : output
    }, callback);
  }));
};

Mailer.prototype.close = function() {
  this.transport.close();
};

var mailer;
if(config.mailer.service === 'smtp'){
  mailer = new Mailer(smtpTransport(config.mailer.auth));
} else if(config.mailer.service === 'mailgun'){
  mailer = new Mailer(mailgunTransport({auth: config.mailer.auth}));
} else{
  mailer = new Mailer(config.mailer);
}

module.exports = mailer;