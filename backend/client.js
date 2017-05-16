var async = require('async');

var db = require('./libs/dbConnection');
var logger = require('./libs/logger');
var config = require('./libs/config');

var type = 'client';
exports.type = type;

exports.findById = function(id, callback) {
    findClient('SELECT clients.*, emails.email, names.firstname, names.lastname, addresses.address, phones.phone ' +
        'FROM clients ' +
        'LEFT JOIN emails ON clients.emailId = emails.id ' +
        'LEFT JOIN names ON clients.nameId = names.id ' +
        'LEFT JOIN addresses ON clients.addressId = addresses.id ' +
        'LEFT JOIN phones ON clients.phoneId = phones.id ' +
        'WHERE clients.id = ?', [id], callback);
};

exports.findByEmail = function(email, password, callback) {
    findClient('SELECT clients.*, emails.email, names.firstname, names.lastname, addresses.address, phones.phone ' +
        'FROM clients ' +
        'LEFT JOIN emails ON clients.emailId = emails.id ' +
        'LEFT JOIN names ON clients.nameId = names.id ' +
        'LEFT JOIN addresses ON clients.addressId = addresses.id ' +
        'LEFT JOIN phones ON clients.phoneId = phones.id ' +
        'WHERE emails.email = ? AND clients.password = ?', [email, password], callback);
};

function findClient(query, args, callback){
    return db.getConnection(function(err, connection){
        if(err) {
            callback(err);
        } else {
            connection.query(query, args, function (err, rows) {
                if (err) {
                    logger.warn('Cannot find client');
                }
                if (rows[0]) {
                    rows[0].type = type;
                }
                callback(err, rows[0]);
                connection.release();
            });
        }
    });
}

exports.register = function(req, res, next){
    logger.debug('register API, email : %s', req.body.email.toLowerCase());
    db.getConnection(function(err, connection){
        if(err) {
            return next(err);
        }
        var body = req.body;
        connection.query('SELECT * FROM \'CreateClient\'(?, ?, ?, ?, ?, ?, ?)',
        [body.email, body.password, body.firstname, body.lastname, body.address, body.phone, body.birthday],
            function (err, result) {
                if (err) {
                    logger.error(err);
                    next(err);
                } else {
                    logger.info('User was created successfully, client id ', result);
                    res.end();
                }
                connection.release();
            });
    });
};

exports.changePersonalInfo = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            return next(err);
        }
        connection.beginTransaction(function () {
            if (err) {
                connection.release();
                return next(err);
            }
            var tasks = {};
            if (req.body.address){
                if (req.user.addressId) {
                    tasks.address = generateAsync('UPDATE addresses SET ? WHERE id = ?', [{ address: req.body.address }, req.user.addressId]);
                } else {
                    tasks.address = generateAsync('INSERT INTO addresses SET ?', [{ address: req.body.address }]);
                }
            }
            if (req.body.phone){
                if (req.user.phoneId) {
                    tasks.phone = generateAsync('UPDATE phones SET ? WHERE id = ?', [{ phone: req.body.phone }, req.user.phoneId]);
                } else {
                    tasks.phone = generateAsync('INSERT INTO phones SET ?', [{ phone: req.body.phone }]);
                }
            }
            async.parallel(tasks, function (err, results) {
                if (err) {
                    return handleTransactionError(connection, err);
                }
                connection.query('UPDATE clients SET ? WHERE id = ?',
                    [{
                        addressId: results.address && results.address.insertId ? results.address.insertId : req.user.addressId,
                        phoneId: results.phone && results.phone.insertId ? results.phone.insertId : req.user.phoneId,
                        birthday: req.body.birthday || req.user.birthday
                    }, req.user.id], function(err, result) {
                    if (err) {
                        return handleTransactionError(connection, err);
                    }
                    connection.commit(function () {
                       connection.release();
                       res.end();
                    });
                });
            });
        });

        function handleTransactionError(connection, err) {
            logger.error(err);
            connection.rollback(function () {
                connection.release();
            });
            return next(err);
        }

        function generateAsync(query, params) {
            return function (callback) {
                connection.query(query, params, function (err, data) {
                    callback(err, data);
                })
            }
        }
    });
};

exports.changePassword = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            next(err);
        } else {
            connection.query('SELECT * FROM clients WHERE id = ?', req.user.id, function(err, rows){
              if (err){
                next(err);
              } else if (rows[0].password == req.body.oldPassword && req.body.newPassword == req.body.newPasswordAgain){
                connection.query('UPDATE clients SET password = ? WHERE id = ?',
                  [req.body.newPassword, req.user.id], function(err, result) {
                    if(err) {
                        logger.error(err);
                        next({error: 'Cannot change password'});
                    } else {
                        res.json(result);
                    }
                    connection.release();
                });
              } else{
                connection.release();
                res.status(400).json({error: 'Passwords don\'t match!'});
              }
            });
        }
    });
};

exports.getAssignmentList = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            next(err);
        } else {
            connection.query('SELECT assignments.*, status_type.status ' +
                'FROM assignments, status_type ' +
                'WHERE clientId = ? AND assignments.statusId = status_type.id',
              req.user.id, function(err, rows) {
                if(err) {
                    logger.error(err);
                    next({error: 'Cannot get assignments'});
                } else {
                    res.json(rows);
                }
                connection.release();
            });
        }
    });
};

exports.getAssignmentProcedures = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            next(err);
        } else {
            connection.query('SELECT procedures.*, CONCAT_WS(" ", names.firstname, names.lastname) as employee ' +
                'FROM employees, procedures, names ' +
                'WHERE procedures.employeeId = employees.id AND assignmentId = ? AND employees.nameId = names.id ORDER BY date DESC',
                req.params.id, function(err, rows) {
                if(err) {
                    logger.error(err);
                    next({error: 'Cannot get procedures'});
                } else {
                    res.json(rows);
                }
                connection.release();
            });
        }
    });
};
