var nodemailer = require('nodemailer'),
  htmlToText = require('nodemailer-html-to-text').htmlToText,
  smtpTransport = require('nodemailer-smtp-transport'),
  mailgunTransport = require('nodemailer-mailgun-transport'),
  // sgTransport = require('nodemailer-sendgrid-transport');
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
    from : options.from,
    bcc : config.bccEmails || [],
    headers: {
        'In-Reply-To': config.emailFrom,
        'place-id': options.placeId
    },
    "h:Reply-to": options.placeId+"@mg.buiilt.com.au",
  });
  this.transport.sendMail(options, function(err, data){
    if(err){
      console.log('mailer error', err);
    }
    return callback && callback(null, data);
  });
};

Mailer.prototype.sendMail = function(template, from, emails, options, callback) {
  var self = this;
  self.render(template, options, okay(callback, function(output) {
    self.send({
      from: from,
      to : emails,
      subject : options.subject,
      html : output
    }, callback);
  }));
};

Mailer.prototype.close = function() {
  this.transport.close();
};

var options = {
  auth: {
    api_user: config.mailer.auth.api_user,
    api_key: config.mailer.auth.api_key
   }
}

var mailer;
if(config.mailer.service === 'smtp'){
  mailer = new Mailer(smtpTransport(config.mailer.auth));
} else if(config.mailer.service === 'mailgun'){
  mailer = new Mailer(mailgunTransport({auth: config.mailer.auth}));
} else if (config.mailer.service == 'sendgrid') {
  // mailer = new Mailer(sgTransport(options));
} else{
  mailer = new Mailer(config.mailer);
}

module.exports = mailer;