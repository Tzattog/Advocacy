var validator = require('validator');

exports.validateUser = function(req, res, next) {
    req.checkBody('email','Email is not valid').notEmpty().isEmail().isLength({max: 255});
    req.checkBody('password','Password is not valid').notEmpty().isLength({min:5, max: 255});
    returnErrors(req, res, next);
};

exports.validateNewClient = function(req, res, next) {
    req.checkBody('firstname','First name is not valid').notEmpty().isLength({max: 45});
    req.checkBody('lastname','Last name is not valid').notEmpty().isLength({max: 45});
    req.checkBody('email','Email is not valid').notEmpty().isEmail().isLength({max: 255});
    req.checkBody('password','Password is not valid').notEmpty().isLength({min:5, max: 255});
    returnErrors(req, res, next);
};

exports.validateEmail = function(req, res, next) {
    req.checkBody('email','Email is not valid').notEmpty().isEmail();
    returnErrors(req, res, next);
};

exports.validatePassword = function(req, res, next) {
    req.checkBody('newPassword','Password is not valid').notEmpty().isLength({min:5, max: 255});
    returnErrors(req, res, next);
};

exports.validateNewPassword = function(req, res, next) {
    req.checkBody('oldPassword','Old password is not valid').notEmpty().isLength({min:5, max: 255});
    req.checkBody('newPassword','New password is not valid').notEmpty().isLength({min:5, max: 255});
    req.checkBody('newPasswordAgain','New password is not valid').notEmpty().isLength({min:5, max: 255});
    returnErrors(req, res, next);
};

exports.validatePersonalInfo = function(req, res, next) {
    req.checkBody('birthday','Birthday is not valid').optional().isDate();
    returnErrors(req, res, next);
};

exports.validateParamsId = function(req, res, next) {
    req.checkParams('id','Id is not valid').notEmpty().isInt({gt: 0});
    returnErrors(req, res, next);
};

exports.validateProcedure = function(req, res, next) {
    req.checkBody('id','Id is not valid').notEmpty().isInt({gt: 0});
    returnErrors(req, res, next);
};

exports.validateAssignment = function(req, res, next) {
    req.checkBody('id','Id is not valid').notEmpty().isInt({gt: 0});
    req.checkBody('employees','Employees is not valid').notEmpty();
    req.body.employees.forEach(function(employee){
      validator.isInt(employee, {gt: 0})
    });
    returnErrors(req, res, next);
};

exports.validateStatus = function(req, res, next) {
    req.checkBody('id','Id is not valid').notEmpty().isInt({gt: 0});
    req.checkBody('status','Status is not valid').notEmpty().isIn(['in progress', 'successful', 'failed']);
    returnErrors(req, res, next);
};

function returnErrors(req, res, next) {
    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
}
