var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
var compression = require('compression');

var logger = require('./backend/libs/logger');
var config = require('./backend/libs/config');
var authentication = require('./backend/libs/authentication');
var dbConfig = require('./backend/libs/dbConfig');
var errorHandler = require('./backend/libs/errorHandler');

var router = require('./backend/router');

var app = express();

app.use(cookieParser());
app.use(compression());
app.use(express.static('frontend'));
app.use(config.prefix, bodyParser.json());

app.use(expressValidator());

var sessionConfig = {
    secret: 'super secret',
    name: 'surasis',
    resave: true,
    saveUninitialized: true
};

var MySQLStore = require('connect-mysql')(session);
var options = {
    config: dbConfig
};
sessionConfig.store = new MySQLStore(options);
app.use(session(sessionConfig));

authentication.init(app);

app.use('/reports', authentication.ensureAuthenticated(), express.static('reports'));

app.use(config.prefix, router.versionRouter);

//Angular html5Mode support. Shoud be the last HTTP call
app.get('/*', function (req, res, next) {
    res.sendFile('frontend/index.html', {root: __dirname});
});

app.use(errorHandler);
logger.info('Error handler is initialized!');

app.listen(config.port, function(){
  logger.info('Server is up on port ' + config.port);
});
