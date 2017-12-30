var matchPassword = function(req, res, next) {
    if (req.body.password === req.body.confirm_password) {
        next();
    } else {
        res.status(400).json({
            msg: "Passwords don't match",
            errors: [{ "msg": "Password and confirm password must match." }]
        });
    }
}

var createUser = function(req, res, next) {
    var password = req.body.password;
    var email = req.body.email;
    var name = req.body.name;
    var country = req.body.country || null;
    var birthdate = req.body.birthdate;
    var rand = randomstring.generate();
    req.rand = rand;

    var newUser = new User({
        name: name,
        email: email,
        password: password,
        country: country,
        usertype: 'normal',
        birthdate: birthdate,
        // profilephoto: "http://s3-api.us-geo.objectstorage.softlayer.net/users-images/default-photo.jpeg",
        verificationCode: rand,
        verified: false
    });

    req.newUser = newUser;
    User.createUser(newUser, function(err, user) {
        if (handle(err, req, res)) {
            req.user = user;
            next();
        }
    });
}

var createInvitation = function(req, res, next) {
    var user = req.user;
    var rand = req.rand;
    var host = req.get('host');
    var link = "http://" + req.get('host') + "/users/verify/" + user.id + "/" + rand;

    req.email = {
        to: user.email,
        subject: 'Amr-Startup <DON\'T REPLY> Email Verification',
        link: link,
        name: user.name
    }
    next();
}

var ensureUniqueEmail = function(req, res, next) {
    var email = req.body.email;
    User.findOne({ email: email }, function(err, findRes) {
        if (handle(err, req, res)) {
            if (findRes != null) {
                res.status(400).json({
                    mag: "This email already exists.",
                    errors: [{ "msg": 'Duplicate Email!\nUse different email.' }]
                });
            } else {
                next();
            }
        }
    });

}

var requireSignup = function(req, res, next) {
    req.checkBody('email', 'Email is empty!').notEmpty();
    req.checkBody('password', 'Password is empty!').notEmpty();
    req.checkBody('confirm_password', 'Confirm password is empty!').notEmpty();
    req.checkBody('name', 'Name is empty!').notEmpty();
    next();
}

var requireSignin = function(req, res, next) {
    req.checkBody('email', 'Email is empty!').notEmpty();
    req.checkBody('password', 'Password is empty!').notEmpty();
    next();
}

var getUserByEmail = function(req, res, next) {
    User.findOne({
        email: req.body.email ||
            req.decoded.user.email
    }, function(err, user) {
        if (handle(err, req, res)) {
            if (user) {
                req.user = user;
                next();
            } else {
                res.status(404).json({
                    msg: "User not found."
                });
            }
        }
    });
}

var validateUser = function(req, res, next) {
    var password = req.body.password;
    User.validatePassword(password, req.user.password, function(err, result) {
        if (handle(err, req, res)) {
            if (result == true) {
                req.user.password = "";
                next();
            } else {
                res.status(401).json({
                    msg: "Not authenticated.",
                    errors: [{ "msg": "Wrong password." }]
                });
            }
        }
    });
}

var requireSocialAuth = function(req, res, next) {
    req.checkBody('email', 'Email is empty!').notEmpty();
    req.checkBody('name', 'Name is empty!').notEmpty();
    req.checkBody('social_id', 'Social Auth ID is empty!').notEmpty();
    req.checkBody('social_type', 'Choose facebook or google!').notEmpty();
    next();
}

var saveSocialUser = function(req, res, next) {
    var type = req.body.social_type;
    var facebook_id = null;
    var google_id = null;
    switch (type) {
        case "facebook":
            facebook_id = req.body.social_id;
            break;
        case "google":
            google_id = req.body.social_id;
            break;
    }
    var new_user = new User({
        name: req.body.name,
        email: req.body.email,
        facebook_id: facebook_id,
        google_id: google_id
    });
    new_user.save(function(err, user) {
        if (handle(err, req, res)) {
            req.user = user;
            console.log(user);
            encodeUser(req, res, next);
        }
    })
}

var getSocialUser = function(req, res, next) {
    var id = req.body.social_id;
    if (!id) {
        next();
    }
    var type = req.body.social_type;
    var search_obj;
    switch (type) {
        case "facebook":
            search_obj = { facebook_id: id };
            break;
        case "google":
            search_obj = { google_id: id };
            break;
        default:
            next();
            break;
    }
    console.log(search_obj)
    User.findOne(search_obj, function(err, user) {
        if (handle(err, req, res)) {
            if (user != null) {
                req.user = user;
                console.log("in get social")
                encodeUser(req, res, next);
            } else {
                next();
            }
        } else {
            next();
        }
    });
}

var encodeUser = function(req, res, next) {
    var token = jwt.sign({
        user: req.user
    }, 'ghostrider', { expiresIn: '1000h' });
    req.user_f = {
        name: req.user.name,
        email: req.user.email,
        country: req.user.country,
        birthdate: req.user.birthdate,
        _id: req.user._id
    };
    req.token = token;
    res.status(200)
        .json({
            token: req.token,
            user: req.user_f,
            msg: "Signed in successfully!"
        });
}

var updateUserSocial = function(req, res, next) {
    var options = { upsert: true, new: true, setDefaultsOnInsert: true };
    User.findOneAndUpdate({ _id: req.user._id }, {
        facebook_id: req.body.facebook_id || req.user.facebook_id,
        google_id: req.body.google_id || req.user.google_id
    }, options, function(err, user) {
        if (handle(err, req, res)) {
            req.user = user;
            console.log("update social")
            encodeUser(req, res, next);
        }
    });
}

var checkExistingUserByEmail = function(req, res, next) {
    var email = req.body.email;
    if (!email) {
        next();
    } else {
        User.findOne({ email: email }, function(err, user) {
            if (handle(err, req, res)) {
                if (user) {
                    req.user = user;
                    console.log(user);
                    console.log("found by email");
                    updateUserSocial(req, res, next);
                } else {
                    next();
                }
            }
        });
    }
}

module.exports.signup = [
    requireSignup,
    validateErrors,
    matchPassword,
    ensureUniqueEmail,
    createUser,
    createInvitation,
    sendEmail
]

module.exports.signin = [
    requireSignin,
    validateErrors,
    getUserByEmail,
    validateUser,
    encodeUser
]

module.exports.profile = [
    ensureAuthenticatedApi,
    getUserByEmail
]

module.exports.social_login = [
    checkExistingUserByEmail,
    getSocialUser,
    requireSocialAuth,
    validateErrors,
    saveSocialUser
]