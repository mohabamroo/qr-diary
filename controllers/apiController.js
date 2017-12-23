validateErrors = function(req, res, next) {
    req.getValidationResult().then(function(result) {
        if (!result.isEmpty()) {
            res.status(400).json({
                msg: "Bad params.",
                errors: result.array()
            });
        } else {
            next();
        }
    });
}

module.exports.validateErrors = validateErrors;

handle = function(err, req, res) {
    if (!err) {
        return true;
    }
    console.log(err);
    if (!Array.isArray(err)) {
        err = [err]
    }
    errors = [];
    err.forEach(function(error) {
        errors.push(error);
    });

    res.status(400).json({
        errors: errors
    });
    return false;
}

sendEmail = function(req, res, next) {
    app.mailer.send('email', req.email, function(err) {
        if (handle(err, req, res)) {
            next();
        }
    });
}

ensureAuthenticatedApi = function(req, res, next) {
    var token = req.body.token || req.body.query || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'ghostrider', function(err, decoded) {
            if (err)
                res.status(401).json({
                    msg: "Not authenticated.",
                    errors: [{ "msg": "Error decoding your token." }]
                });
            else {
                // console.log("hna:\n"+decoded.user._id);
                req.decoded = decoded;
                next();
            }
        });
    } else {
        res.status(401).json({ success: false, msg: "No token provided!" });
    }
}

appendAuth = function(req, res, next) {
    var token = req.body.token || req.body.query || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'ghostrider', function(err, decoded) {
            if (err)
                res.json({ success: false, msg: "Error decoding your token!" });
            else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        next();
    }
}

uniqueName = function(req, filename) {
    var arr = filename.split(".");
    var filetype = arr[arr.length - 1];
    var newfilename = req.decoded.user.username + '-' + Date.now() + '.' + filetype;
    return newfilename;
}

ensureAdmin = function(req, res, next) {
    if (req.isAuthenticated()) {
        console.log("code: " + req.user.verificationCode)
        if (req.user.verificationCode === "X3PpQxaOJ0k95CjnlmgAx2DXm8yHkAR") {
            return next();
        } else {
            req.flash('error_msg', 'You are not verified!\nOpen your GUC email and verify your account to continue');
            res.redirect('/users/signin');
        }
    } else {
        req.flash('error_msg', 'You are not logged in');
        res.redirect('/users/signin');
    }
}

newtoken = function(res, updatedUser) {
    var token = jwt.sign({
        user: updatedUser
    }, 'ghostrider', { expiresIn: '1000h' });
    res.json({
        success: true,
        token: token,
        msg: "Updated profile!"
    });
}