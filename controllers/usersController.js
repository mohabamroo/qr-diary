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
    validateUser
]

module.exports.profile = [
    ensureAuthenticatedApi,
    getUserByEmail
]