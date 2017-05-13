var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var logger = require('./logger');
var config = require('./config');
var validation = require('./validation');

var client = require('../client');
var employee = require('../employee');
var admin = require('../admin');

passport.serializeUser(function(user, done) {
    done(null, {id: user.id, type: user.type});
});

passport.deserializeUser(function(user, done) {
    if (user.type == client.type) {
        client.findById(user.id, done);
    } else if (user.type == employee.type){
        employee.findById(user.id, done);
    } else if (user.type == admin.type){
        admin.findById(user.id, done);
    }
});

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
        usernameLowerCase: true
    },
    function(req, email, password, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            var userType = req.params.userType;
            var userLibraryToCheck;
            if (userType == client.type) {
                userLibraryToCheck = client;
            } else if (userType == employee.type) {
                userLibraryToCheck = employee;
            } else if (userType == admin.type) {
                userLibraryToCheck = admin;
            } else {
                return done(null, false);
            }
            userLibraryToCheck.findByEmail(email, password, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user || user.deleted) {
                    return done(null, false);
                }
                logger.info(userType + ' is authenticated. Email:' + email);
                return done(null, user);
            })
        });
    }
));

exports.ensureAuthenticated = function(role) {

    return function (req, res, next) {

        if (req.isAuthenticated() && (req.user.type == role || !role)){
            return next();
        }
        res.status(401).json({msg: 'You aren’t authenticated!'});
    };
};

exports.getCurrentUser = function(req, res, next){
    logger.debug('getCurrentUser API');
    delete req.user.password;
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(req.user);
};

exports.init = function(app) {
    app.use(passport.initialize());
    app.use(passport.session());

    app.post(config.prefix + '/:userType/login',
        validation.validateUser,
        passport.authenticate('local'),
        function(req, res) {
            if (req.body.remember) {
                req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
            } else {
                req.session.cookie.expires = false;
                //req.session.cookie.maxAge = null;
            }
            res.json({message:'Authenticated!'});
        }
    );

    app.get(config.prefix + '/logout', function(req, res){
        // clear the remember me cookie when logging out
        logger.info('Logout. Email:' + req.user.email);
        res.clearCookie('local');
        req.logout();
        res.end();
    });
};
