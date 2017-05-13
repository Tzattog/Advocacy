var db = require('./libs/dbConnection');
var logger = require('./libs/logger');
var config = require('./libs/config');

var type = 'admin';
exports.type = type;

exports.findById = function(id, callback) {
    findAdmin('SELECT * from admin WHERE id = ?', [id], callback);
};

exports.findByEmail = function(email, password, callback) {
    findAdmin('SELECT * from admin WHERE email = ? AND password = ?', [email, password], callback);
};

function findAdmin(query, args, callback){
    return db.getConnection(function(err, connection){
        if(err) {
            callback(err);
        } else {
            connection.query(query, args, function (err, rows) {
                if (err) {
                    logger.warn('Cannot find admin');
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

//CLIENTS

exports.getClientList = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            next(err);
        } else {
            connection.query('SELECT clients.id, emails.email, names.firstname, names.lastname, addresses.address, phones.phone, clients.birthday ' +
                'FROM clients, emails, names, addresses, phones ' +
                'WHERE clients.emailId = emails.id AND clients.nameId = names.id AND clients.addressId = addresses.id and clients.phoneId = phones.id',
                function(err, rows) {
                if(err) {
                    logger.error(err);
                    next({error: 'Cannot get clients'});
                } else {
                    res.json(rows);
                }
                connection.release();
            });
        }
    });
};

exports.getClientAssignmentList = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            next(err);
        } else {
            connection.query('SELECT assignments.*, status_type.status ' +
                'FROM assignments, status_type ' +
                'WHERE clientId = ? AND assignments.statusId = status_type.id',
              req.params.id, function(err, rows) {
                if(err) {
                    logger.error(err);
                    next({error: 'Cannot get client\'s assignments'});
                } else {
                    res.json(rows);
                }
                connection.release();
            });
        }
    });
};

//EMPLOYEES

exports.getEmployeeList = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            next(err);
        } else {
            connection.query('SELECT employees.id, emails.email, names.firstname, names.lastname, addresses.address, phones.phone, employees.birthday, employees.deleted ' +
                'FROM employees, emails, names, addresses, phones ' +
                'WHERE employees.emailId = emails.id AND employees.nameId = names.id AND employees.addressId = addresses.id and employees.phoneId = phones.id',
                function(err, rows) {
                    if(err) {
                        logger.error(err);
                        next({error: 'Cannot get employees'});
                    } else {
                        res.json(rows);
                    }
                    connection.release();
                });
        }
    });
};

exports.createEmployee = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            return next(err);
        }
        connection.beginTransaction(function () {
            if (err) {
                connection.release();
                return next(err);
            }
            connection.query('INSERT INTO emails SET ?', { email: req.body.email }, function (err, email) {
                if (err) {
                    return handleTransactionError(connection, err);
                }
                connection.query('INSERT INTO names SET ?', { firstname: req.body.firstname, lastname: req.body.lastname }, function (err, name) {
                    if (err) {
                        return handleTransactionError(connection, err);
                    }
                    connection.query('INSERT INTO addresses SET ?', { address: req.body.address }, function (err, address) {
                        if (err) {
                            return handleTransactionError(connection, err);
                        }
                        connection.query('INSERT INTO phones SET ?', { phone: req.body.phone }, function (err, phone) {
                            if (err) {
                                return handleTransactionError(connection, err);
                            }
                            var employee = {
                                password: req.body.password,
                                birthday: req.body.birthday,
                                emailId: email.insertId,
                                nameId: name.insertId,
                                addressId: address.insertId,
                                phoneId: phone.insertId
                            };
                            connection.query('INSERT INTO employees SET ?', employee, function (err, result) {
                                if (err) {
                                    return handleTransactionError(connection, {error: 'Cannot create employee'});
                                } else {
                                    connection.commit(function () {
                                        logger.info('Employee successfully created, ', result);
                                        res.end();
                                        connection.release();
                                    });
                                }
                            });
                        });
                    });
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
};

exports.deleteEmployee = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            next(err);
        } else {
            connection.query('UPDATE employees SET deleted = 1 WHERE id = ?', req.params.id, function(err, result) {
                    if(err) {
                        logger.error(err);
                        next({error: 'Cannot delete employee'});
                    } else {
                      logger.info('Employee successfully deleted, ', result);
                        res.end();
                    }
                    connection.release();
                });
        }
    });
};

exports.getEmployeeAssignmentList = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            next(err);
        } else {
            connection.query('SELECT assignments.*, status_type.status ' +
                'FROM assignments, employeestoassignments, status_type ' +
                'WHERE employeestoassignments.employeeId = ? AND employeestoassignments.assignmentId = assignments.id AND assignments.statusId = status_type.id',
              req.params.id, function(err, rows) {
                if(err) {
                    logger.error(err);
                    next({error: 'Cannot get employee\'s assignments'});
                } else {
                    res.json(rows);
                }
                connection.release();
            });
        }
    });
};

//ASSIGNMENTS

exports.getAssignmentList = function(req, res, next){
    db.getConnection(function(err, connection){
        if(err) {
            next(err);
        } else {
            connection.query('SELECT assignments.*, status_type.status ' +
                'FROM assignments, status_type ' +
                'WHERE assignments.statusId = status_type.id', function(err, rows) {
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

exports.createAssignment = function(req, res, next){
  db.getConnection(function(err, connection){
      if(err) {
          next(err);
      } else {
          var assignment = {
              name: req.body.name,
              clientId: req.body.id,
              details: req.body.details,
              startDate: new Date(),
              price: req.body.price
          }
          connection.query('INSERT INTO assignments SET ?', assignment, function(err, result) {
              if(err) {
                  logger.error(err);
                  next({error: 'Cannot create assignment'});
              } else {
                var completion = 0;
                  req.body.employees.forEach(function(employee){                //TODO: change logic
                      connection.query('INSERT INTO employeestoassignments SET ?', {employeeId: employee, assignmentId: result.insertId}, function(err, result){
                          completion++;
                          if(err) {
                              logger.error(err);
                              next({error: 'Cannot create assignment'});
                          }
                          if (completion == req.body.employees.length){
                            res.end();
                            connection.release();
                          }
                      })
                  });
              }
          });
      }
  });
};

exports.finishAssignment = function(req, res, next){
  db.getConnection(function(err, connection){
      if(err) {
          next(err);
      } else {
          connection.query('UPDATE assignments SET statusId = ?, finishDate = ? WHERE id = ?', [req.body.status, new Date(), req.body.id], function(err, result) {
              if(err) {
                  logger.error(err);
                  next({error: 'Cannot create assignment'});
              } else {
                  res.end();
              }
              connection.release();
          });
      }
  });
};

//PROCEDURES

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
