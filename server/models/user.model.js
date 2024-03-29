'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var authTypes = ['github', 'twitter', 'facebook', 'google'];
var EventBus = require('./../components/EventBus');

var UserSchema = new Schema({
    name: String,
    firstName: String,
    lastName: String,
    email: {type: String, lowercase: true},
    emailVerified: {type: Boolean, default: false},
    emailChange: {type: String, lowercase: true},
    changeEmailToken: String,
    hasChangedEmail: {type: Boolean, default: false},
    expired : Date,
    emailVerifyToken: String,
    phoneNumberVerifyToken: String,
    role: {
        type: String,
        default: 'user'
    },
    team: {
        _id: {type: Schema.Types.ObjectId, ref: "Team"},
        role: {type:String, enum: ['member', 'admin']}
    },
    hashedPassword: String,
    provider: String,
    salt: String,
    facebook: {},
    twitter: {},
    google: {},
    github: {},
    phoneNumber: String,
    phoneNumberVerified: {type: Boolean, default: false},
    country: String,
    packageToken: String,
    status: {type: String, default: 'offline'},
    projects: [{type: Schema.Types.ObjectId, ref: 'Project'}],
    favouriteProjects: [{type: Schema.Types.ObjectId, ref: "Project"}],
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    plan: {type: String, enum:["small", "medium", "large"]},
    creditCard: {
        number: String,
        exp_month: String,
        exp_year: String,
        cvc: String
    },
    phoneNumberLoginToken: String
}, {
    strict: true,
    minimize: false
});

/**
 * Virtuals
 */
UserSchema
.virtual('password').set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
}).get(function () {
    return this._password;
});
  
// Public profile information
UserSchema
.virtual('profile').get(function () {
    return {
        'name': this.name,
        'role': this.role
    };
});

// Non-sensitive info we'll be putting in the token
UserSchema
.virtual('token').get(function () {
    return {
        '_id': this._id,
        'role': this.role
    };
});

/**
 * Validations
 */

// Validate empty email
UserSchema
.path('email')
.validate(function (email) {
    if (authTypes.indexOf(this.provider) !== -1)
        return true;
    return email.length;
}, 'Email cannot be blank');

// Validate empty password
UserSchema
.path('hashedPassword')
.validate(function (hashedPassword) {
    if (authTypes.indexOf(this.provider) !== -1)
        return true;
    return hashedPassword.length;
}, 'Password cannot be blank');

// Validate email is not taken
UserSchema
.path('email')
.validate(function (value, respond) {
    var self = this;
    this.constructor.findOne({email: value}, function (err, user) {
        if (err)
            throw err;
        if (user) {
            if (self.id === user.id)
                return respond(true);
            return respond(false);
        }
        respond(true);
    });
}, 'The specified email address is already in use.');

// Validate phone number is existed
UserSchema.path('phoneNumber').validate(function(value, respond) {
    var self = this;
    this.constructor.findOne({phoneNumber: value}, function(err, user) {
        if (err) {throw err;}
        if (user) {
            if (self.id===user.id) {
                return respond(true);
            }else {
                return respond(false);
            }
        } else {
            respond(true);
        }
    });
}, "The specified phone number is already in use.");

var validatePresenceOf = function (value) {
    return value && value.length;
};

/**
 * Pre-save hook
 */
UserSchema
.pre('save', function (next) {
    this.wasNew = this.isNew;
    this.evtName = this._evtName;
    if (!this.isNew) {
        return next();
    } else if (this.isNew && !this.emailVerified) {
        //create email verify token
        this.emailVerifyToken = crypto.randomBytes(20).toString('hex');
    }
    if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1) {
        next(new Error('Invalid password'));
    } else {
        next();
    }
});

UserSchema.post('save', function (doc) {
    var evtName;
    if (this.evtName) {
        evtName = this.evtName;
    } else {
        evtName = this.wasNew ? 'User.Inserted' : 'User.Updated';
    }
    EventBus.emit(evtName, doc);
});

/**
 * Methods
 */
UserSchema.methods = {
    /**
    * Authenticate - check if the passwords are the same
    *
    * @param {String} plainText
    * @return {Boolean}
    * @api public
    */
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.hashedPassword;
    },
    /**
    * Make salt
    *
    * @return {String}
    * @api public
    */
    makeSalt: function () {
        return crypto.randomBytes(16).toString('base64');
    },
    /**
    * Encrypt password
    *
    * @param {String} password
    * @return {String}
    * @api public
    */
    encryptPassword: function (password) {
        if (!password || !this.salt)
            return '';
        var salt = new Buffer(this.salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
    }
};

UserSchema.methods.confirmEmail = function (callback) {
    //remove keychain and update email verified status
    delete this.emailVerifyToken;
    this.emailVerified = true;
    this.save(callback);
};

UserSchema.methods.confirmEmailChange = function (callback) {
    this.hasChangedEmail = true;
    this.email = this.emailChange;
    //remove keychain and update email verified status
    this.set('changeEmailToken', undefined);
    this.set('expired', undefined);
    this.set('emailChange', undefined);
    this.save(callback);
};

module.exports = mongoose.model('User', UserSchema);
