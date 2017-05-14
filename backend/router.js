var express = require('express');
var validation = require('./libs/validation');
var authentication = require('./libs/authentication');

var client = require('./client');
var employee = require('./employee');
var admin = require('./admin');
var report = require('./report');

var clientRouter = express.Router();
clientRouter.post('/change-personal-info',
    validation.validatePersonalInfo,
    client.changePersonalInfo);
clientRouter.post('/change-password',
    validation.validatePassword,
    client.changePassword);
clientRouter.get('/assignment-list',
    client.getAssignmentList);
clientRouter.get('/get-assignment-procedures/:id',
    validation.validateParamsId,
    client.getAssignmentProcedures);
clientRouter.get('/download-report/:id',
    validation.validateParamsId,
    report.generateReport);

var employeeRouter = express.Router();
employeeRouter.get('/assignment-list',
    employee.getAssignmentList);
employeeRouter.get('/get-assignment-procedures/:id',
    validation.validateParamsId,
    employee.getAssignmentProcedures);
employeeRouter.post('/change-personal-info',
    validation.validatePersonalInfo,
    employee.changePersonalInfo);
employeeRouter.post('/change-password',
    validation.validateNewPassword,
    employee.changePassword);
employeeRouter.put('/add-procedure',
    validation.validateProcedure,
    employee.addProcedure);

var adminRouter = express.Router();
adminRouter.get('/get-client-list',
    admin.getClientList);
adminRouter.get('/client-assignment-list/:id',
    validation.validateParamsId,
    admin.getClientAssignmentList);
adminRouter.get('/get-employee-list',
    admin.getEmployeeList);
adminRouter.put('/create-employee',
    validation.validateUser,
    admin.createEmployee);
adminRouter.delete('/delete-employee/:id',
    validation.validateParamsId,
    admin.deleteEmployee);
adminRouter.get('/employee-assignment-list/:id',
    validation.validateParamsId,
    admin.getEmployeeAssignmentList);
adminRouter.get('/get-assignment-list',
    admin.getAssignmentList);
adminRouter.put('/create-assignment',
    //validation.validateAssignment,
    admin.createAssignment);
adminRouter.post('/finish-assignment',
    validation.validateStatus,
    admin.finishAssignment);
adminRouter.get('/get-assignment-procedures/:id',
    validation.validateParamsId,
    admin.getAssignmentProcedures);
adminRouter.get('/download-report/:id',
    validation.validateParamsId,
    report.generateReport);
adminRouter.get('/download-dump',
    admin.createAndDownloadDump);
adminRouter.post('/custom-query',
    admin.customQuery);

var userRouter = express.Router();
userRouter.get('/current-user',
    authentication.ensureAuthenticated(),
    authentication.getCurrentUser);
userRouter.put('/register',
    validation.validateNewClient,
    client.register);

var versionRouter = express.Router();
versionRouter.use('/client', authentication.ensureAuthenticated(client.type), clientRouter);
versionRouter.use('/employee', authentication.ensureAuthenticated(employee.type), employeeRouter);
versionRouter.use('/admin', authentication.ensureAuthenticated(admin.type), adminRouter);
versionRouter.use(userRouter);

exports.versionRouter = versionRouter;
