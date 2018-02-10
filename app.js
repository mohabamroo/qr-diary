express = require("express");
path = require("path");
http = require("http");
https = require('https');
fs = require('fs');
ejs = require("ejs");
publicPath = path.resolve(__dirname, "public");
cookieParser = require('cookie-parser');
bodyParser = require('body-parser');
expressValidator = require('express-validator');
session = require('express-session');
passport = require('passport');
LocalStrategy = require('passport-local').Strategy;
userUploadsPath = path.resolve(__dirname, "user_uploads");
publicPath = path.join(__dirname, 'public');
mongo = require('mongodb');
mongoose = require('mongoose');
jwt = require('jsonwebtoken');
randomstring = require("randomstring");

// database config
mongoose.connect('mongodb://mohabamroo:ghostrider@ds131237.mlab.com:31237/qr-diary');
db = mongoose.connection;

mailer = require('express-mailer');
app = express();

cfenv = require('cfenv');
mailer = require('express-mailer');
session = require('express-session');

mailer.extend(app, {
    from: 'amr.qr.code@gmail.com',
    host: 'smtp.gmail.com', // hostname 
    secureConnection: true, // use SSL 
    port: 465, // port for secure SMTP 
    transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts 
    auth: {
        user: 'amr.qr.code@gmail.com',
        pass: 'reismonrach'
    }
});

module.exports = app;

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("html", ejs.renderFile);
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '5000mb' }));
app.use(bodyParser.urlencoded({ limit: '5000mb', extended: true }));
app.use(cookieParser());

app.use(express.static(publicPath));
app.use(express.static(userUploadsPath));
app.use(express.static(path.resolve(__dirname, './public/frontend')));

// sessions
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.'),
            root = namespace.shift(),
            formParam = root;
        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));


// Global Vars
app.use(function(req, res, next) {
    res.locals.user = req.user || null;
    next();
});

// enable CROS
app.all("/*", function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With, X-HTTP-Method-Override, Accept, X-Access-Token", "app_token");
    return next();
});

// before any request
app.use(function(req, res, next) {
    console.log("before any request");
    var token = req.headers['app_token'];
    console.log(req.headers);
    console.log(req.headers['app_token']);
    console.log(token);
    if (token === 'ncY12VakiZ7vW1j') {
        next();
    } else {
        res.status(403).json({
            msg: "Unauthorized to communicate with our API."
        });
    }
});

// load models
require('./models/user');

// load controllers
apiController = require('./controllers/apiController.js');
usersController = require('./controllers/usersController.js');

// json api routes
var usersApi = require('./routes/api/users');

// json api routes
app.use('/api/users', usersApi);

port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("Express app started on port: " + port + ".");
    console.log("\nhttp://localhost:" + port + "\n")
});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
// app.listen(appEnv.port, appEnv.bind, function() {
//   console.log("server starting on " + appEnv.url);
// });