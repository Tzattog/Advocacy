var async = require('async');

var db = require('./libs/dbConnection');
var logger = require('./libs/logger');
var config = require('./libs/config');

var type = 'employee';
exports.type = type;

exports.findById = function(id, callback) {
    findEmployee('SELECT employees.*, emails.email, names.firstname, names.lastname, addresses.address, phones.phone ' +
        'FROM employees ' +
        'LEFT JOIN emails ON employees.emailId = emails.id ' +
        'LEFT JOIN names ON employees.nameId = names.id ' +
        'LEFT JOIN addresses ON employees.addressId = addresses.id ' +
        'LEFT JOIN phones ON employees.phoneId = phones.id ' +
        'WHERE employees.id = ?', [id], callback);
};

exports.findByEmail = function(email, password, callback) {
    findEmployee('SELECT employees.*, emails.email, names.firstname, names.lastname, addresses.address, phones.phone ' +
        'FROM employees ' +
        'LEFT JOIN emails ON employees.emailId = emails.id ' +
        'LEFT JOIN names ON employees.nameId = names.id ' +
        'LEFT JOIN addresses ON employees.addressId = addresses.id ' +
        'LEFT JOIN phones ON employees.phoneId = phones.id ' +
        'WHERE emails.email = ? AND employees.password = ?', [email, password], callback);
};

function findEmployee(query, args, callback){
    return db.getConnection(function(err, connection){
        if(err) {
            callback(err);
        } else {
            connection.query(query, args, function (err, rows) {
                if (err) {
                    logger.warn('Cannot find employee');
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

exports.getAssignmentList = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            next(err);
        } else {
            connection.query('SELECT assignments.*, status_type.status ' +
                'FROM assignments, employeestoassignments, status_type ' +
                'WHERE employeestoassignments.employeeId = ? AND employeestoassignments.assignmentId = assignments.id ' +
                'AND assignments.statusId = status_type.id',
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

exports.addProcedure = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            next(err);
        } else {
          var procedure = {
            assignmentId: req.body.id,
            details: req.body.details,
            date: new Date(),
            employeeId: req.user.id,
            price: req.body.price
          };
            connection.query('INSERT INTO procedures SET ?', procedure, function(err, result) {
                if(err) {
                    logger.error(err);
                    next({error: 'Cannot add procedure'});
                } else {
                    res.json(result);
                }
                connection.release();
            });
        }
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
                connection.query('UPDATE employees SET ? WHERE id = ?',
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
            connection.query('SELECT * FROM employees WHERE id = ?', req.user.id, function(err, rows){
              if (err){
                next(err);
              } else if (rows[0].password == req.body.oldPassword && req.body.newPassword == req.body.newPasswordAgain){
                connection.query('UPDATE employees SET password = ? WHERE id = ?',
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
}
