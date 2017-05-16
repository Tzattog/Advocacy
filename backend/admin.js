var dbDump = require('mysqldump');
var fs = require('fs');
var schedule = require('node-schedule');

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
        var body = req.body;
        connection.query('SELECT * FROM \'CreateEmployee\'(?, ?, ?, ?, ?, ?, ?)',
            [body.email, body.password, body.firstname, body.lastname, body.address, body.phone, body.birthday],
            function (err, result) {
                if (err) {
                    logger.error(err);
                    next(err);
                } else {
                    logger.info('Employee was created successfully, employee id ', result);
                    res.end();
                }
                connection.release();
            });
    });
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

//DATABASE

exports.createAndDownloadDump = function (req, res, next) {
    var fileName = './dump/' + new Date().toISOString() + '.sql';
    dbDump({
        host: 'localhost',
        user: 'root',
        password: '!@#123QWEasdzxc',
        database: 'advocacy',
        dest: fileName // destination file
    }, function (err) {
        if (err) {
            return next(err);
        }
        res.download(fileName);
    });
};

exports.customQuery = function (req, res, next) {
    db.getConnection(function(err, connection){
        if(err) {
            return next(err);
        }
        connection.query(req.body.query, function(err, result) {
                if(err) {
                    logger.error(err);
                    next(err);
                } else {
                    res.json(result);
                }
                connection.release();
            });
    });
};

schedule.scheduleJob('0 0 * * 7', function () {
    var fileName = './dump/' + new Date().toISOString().split('T')[0] + '.sql';
    dbDump({
        host: 'localhost',
        user: 'root',
        password: '!@#123QWEasdzxc',
        database: 'advocacy',
        dest: fileName // destination file
    }, function (err) {
        if (err) {
            return next(err);
        }
        logger.debug('Scheduled DB dump successful!');
    });
});