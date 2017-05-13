var fs = require('fs');
var csvStringify = require('csv-stringify');

var db = require('./libs/dbConnection');
var logger = require('./libs/logger');
var config = require('./libs/config');

exports.generateReport = function(req, res, next){
  db.getConnection(function(err, connection){
      if(err) {
          next(err);
      } else {
        connection.query('SELECT assignments.*, status_type.status ' +
            'FROM assignments, status_type ' +
            'WHERE assignments.statusId = status_type.id AND assignments.id = ?', req.params.id, function(err, assignment){
          if (err){
            next(err);
          } else {
            assignment = assignment[0];
            if (req.user.type == 'admin' || req.user.id == assignment.clientId){
              connection.query('SELECT procedures.*, CONCAT_WS(" ", names.firstname, names.lastname) as employee ' +
                  'FROM employees, procedures, names ' +
                  'WHERE procedures.employeeId = employees.id AND assignmentId = ? AND employees.nameId = names.id ORDER BY date ASC',
              req.params.id, function(err, procedures){
                if (err){
                  next(err);
                } else {
                  var report = [['Assignment name', assignment.name],
                  ['Assignment details', assignment.details],
                  [],
                  ['Procedure', 'Employee', 'Date', 'Price']];
                  var totalPrice = 0;
                  for(procedure of procedures){
                    report.push([procedure.details, procedure.employee, procedure.date.toLocaleDateString('ru-RU'), procedure.price]);
                    totalPrice += procedure.price;
                  }
                  if (assignment.status == 'successful'){
                    report.push(['Success toll',,, assignment.price]);
                    totalPrice += assignment.price;
                  }
                  report.push([,,'Total', totalPrice]);
                  csvStringify(report, function(err, output){
                    if (err){
                      next(err);
                    } else {
                      var date = Date.now();
                      fs.writeFile('./reports/report' + date + '.csv', output, function(err){
                        if (err){
                          next(err);
                        } else {
                          logger.info('Report generation successful!');
                          res.download('./reports/report' + date + '.csv', 'report.csv', function(err){
                            if(res.headersSent) {
                              fs.unlink('./reports/report' + date + '.csv', function(err) {
                                if (err) {
                                    logger.warn('Cannot delete report');
                                } else {
                                    logger.info('Successfully deleted report');
                                }
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            } else {
              console.log(req.user.type, assignment.clientId);
              connection.release();
              res.status(403).json({error: "You are unauthorized to make this request"});
            }
          }
        });
      }
    });
};
