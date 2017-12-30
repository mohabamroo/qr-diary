var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
require('mongoose-type-email');

var userSchema = mongoose.Schema({
    name: String,
    password: {
        type: String
    },
    birthdate: {
        type: String
    },
    gender: String,
    country: String,
    email: {
        type: mongoose.SchemaTypes.Email
    },
    bio: {
        type: String
    },
    profilephoto: {
        type: String
    },
    verificationCode: {
        type: String
    },
    verified: {
        type: Boolean,
        default: true
    },
    type: {
        type: String,
        default: "normal"
    },
    google_id: {
        type: String
    },
    facebook_id: {
        type: String
    },

});

User = module.exports = mongoose.model('User', userSchema);

module.exports.createUser = function(newUser, callback) {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}

module.exports.getUserById = function(userid, callback) {
    User.findById(userid, callback);
}

module.exports.validatePassword = function(givenpassword, hash, callback) {
    bcrypt.compare(givenpassword, hash, function(err, res) {
        if (err) {
            throw err;
        } else {
            callback(null, res);
        }
    });
}