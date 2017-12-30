var router = express.Router();
var multer = require('multer');
var profilephotoUpload = multer().single('profilePhoto');


router.post('/signup', usersController.signup, function(req, res) {
    res.status(200).json({
        msg: 'You signed up successfully! Please, check and verify your email.',
        user: req.user
    });
});

router.post('/signin', usersController.signin);
router.post('/social_login', usersController.social_login);

router.get('/profile', usersController.profile, function(req, res) {
    req.user.password = null;
    res.status(200).json({
        user: req.user
    });
});

// --------------------------- old code ------------------------------------
// use the new token!
// error validation?
router.post('/update', ensureAuthenticatedApi, function(req, res) {
    User.findById(req.decoded.user._id, function(err, user) {
        var phone = req.body.phone || user.phone;
        var bio = req.body.bio || user.bio;
        var public = req.body.public || user.public;
        var first_name = req.body.first_name || user.first_name;
        var location = req.body.location || user.location;
        var last_name = req.body.last_name || user.last_name;
        var birthdate = req.body.birthdate || user.birthdate;
        var home_city = req.body.home_city || user.home_city;
        var current_city = req.body.current_city || user.current_city;
        var profilephoto = req.body.profilephoto || user.profilephoto;
        var languages = req.body.languages || user.languages;
        var gender = req.body.gender || user.gender;
        var lat = req.body.lat || user.location.lat;
        var lng = req.body.lng || user.location.lng;
        User.findOneAndUpdate({ _id: req.decoded.user._id }, {
            $set: {
                phone: phone,
                birthdate: birthdate,
                gender: gender,
                bio: bio,
                first_name: first_name,
                last_name: last_name,
                home_city: home_city,
                current_city: current_city,
                languages: languages,
                public: public,
                profilephoto: profilephoto,
                location: { lat: lat, lng: lng }
            }
        }, { new: true }, function(err, updatedUser) {
            printError(err, req, res);
            if (req.body.tags != null && req.body.tags != "")
                addTags(req, res, oldTags, function() {
                    newtoken(res, updatedUser);
                });
            else
                newtoken(res, updatedUser);
        });
    })

});

// authenticated?
router.get('/profile/:username', function(req, res) {
    User.findOne({ username: req.params.username }, { password: 0, verificationCode: 0, _id: 0 },
        function(err, resuser) {
            if (!resuser) {
                res.status(400).json({
                    success: false,
                    errors: [{ "msg": "User doesn't exist." }]
                });
                return;
            }
            var Bdate = resuser.birthdate;
            var Bday = +new Date(Bdate);
            var Q4A = ~~((Date.now() - Bday) / (31557600000));
            var dude = resuser;
            dude.age = Q4A;
            if (resuser.public == true) {
                res.status(200).json({
                    success: true,
                    data: dude
                });
            } else {
                res.status(403).json({
                    success: false,
                    errors: [{ "msg": "Private profile." }]
                });
            }
        });

});

router.get('/search/:username', function(req, res) {
    User.find({
        $or: [
            { username: { '$regex': '.*' + req.params.username + '.*' } },
            { email: { '$regex': '.*' + req.params.username + '.*' } },
        ]
    }, function(err, results) {
        if (!printError(err, req, res)) {
            res.status(200).json(results);
        }
    });
});

module.exports = router;