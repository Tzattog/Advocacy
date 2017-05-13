var log = require('./logger');

module.exports = function(err, req, res, next) {
    var message = 'Oopps... We are working on your problem.';
    if(err.message) {
        message = err.message;
    }
    log.error(message + '; Stack: ' + err.stack, {error: err});
    var code = 500;
    if(err.code) {
        code = err.code;
    }

    res.status(code).json({error: message});
};
