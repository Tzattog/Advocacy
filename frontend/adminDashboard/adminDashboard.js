angular.module('advocacy.adminDashboard', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/admin-dashboard', {
            templateUrl: 'adminDashboard/adminDashboard.html',
            controller: 'adminDashboardCtrl'
        })
    }])

    .controller('adminDashboardCtrl', ['$scope', '$location', '$rootScope', 'adminDashboardService', 'preferences', 'Notification',
        function ($scope, $location, $rootScope, adminDashboardService, preferences, Notification) {
            if (preferences.get('user').role != 'admin') {
                $location.path('/login');
            }

            $scope.currentTab = function (tab) {
                return 'adminDashboard/templates/' + tab + '.html';
            };

            $scope.getClientList = function () {
                adminDashboardService.getClientList().then(function (data) {
                    $scope.clientList = data.data;
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.getClientAssignmentList = function (client) {
                adminDashboardService.getClientAssignmentList(client.id).then(function (data) {
                    client.assignmentList = data.data;
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.getEmployeeList = function () {
                adminDashboardService.getEmployeeList().then(function (data) {
                    $scope.employeeList = data.data;
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.deleteEmployee = function (employee) {
                adminDashboardService.deleteEmployee(employee.id).then(function (data) {
                    Notification.success('Employee deleted!');
                    console.log('Employee deleted!');
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.newEmployee = {};

            $scope.createEmployee = function () {
                // $scope.newEmployee.birthday = moment($scope.newEmployee.birthdayParse, "MM-DD-YYYY")._d.substr(0, 10);
                // console.log($scope.newEmployee.birthday);
                adminDashboardService.createEmployee($scope.newEmployee).then(function (data) {
                    Notification.success('Employee created!');
                    console.log('Employee created!');
                    $scope.newEmployee = {};
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            }

            $scope.getEmployeeAssignmentList = function (employee) {
                adminDashboardService.getEmployeeAssignmentList(employee.id).then(function (data) {
                    employee.assignmentList = data.data;
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.getAssignmentList = function () {
                adminDashboardService.getAssignmentList().then(function (data) {
                    $scope.assignmentList = data.data;
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.newAssignment = {};

            $scope.createAssignment = function () {
                adminDashboardService.createAssignment($scope.newAssignment).then(function (data) {
                    Notification.success('Assignment created!');
                    console.log('Assignment created!');
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.finishAssignment = function (assignment, status) {
                var statusChange = {id: assignment.id, status: status};
                adminDashboardService.finishAssignment(statusChange).then(function (data) {
                    Notification.success('Assignment status changed!');
                    console.log('Assignment finished!');
                    assignment.status = status;
                    assignment.finishDate = new Date();
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.getAssignmentProcedures = function (assignment) {
                adminDashboardService.getAssignmentProcedures(assignment.id).then(function (data) {
                    assignment.procedures = data.data;
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.downloadReport = function (id) {
                window.location = '/api/admin/download-report/' + id;
            };

            $scope.downloadDump = function () {
                window.location = '/api/admin/download-dump';
            };

            $scope.viewTab = function (tab) {
                switch (tab) {
                    case 'clients':
                        $scope.getClientList();
                        break;
                    case 'employees':
                        $scope.getEmployeeList();
                        break;
                    case 'assignments':
                        $scope.getAssignmentList();
                        break;
                    case 'createAssignment':
                        $scope.getClientList();
                        $scope.getEmployeeList();
                        break;
                }
                $('.collapse').collapse('hide');
                $scope.viewedTab = tab;
            };

            $scope.viewTab('clients');
        }])

    .factory('adminDashboardService', ['$http', function ($http) {
        return {
            getCurrentUser: function () {
                return $http.get('/api/current-user');
            },
            getClientList: function () {
                return $http.get('/api/admin/get-client-list');
            },
            getClientAssignmentList: function (id) {
                return $http.get('/api/admin/client-assignment-list/' + id);
            },
            getEmployeeList: function () {
                return $http.get('/api/admin/get-employee-list');
            },
            createEmployee: function (employee) {
                return $http.put('/api/admin/create-employee', employee);
            },
            deleteEmployee: function (id) {
                return $http.delete('/api/admin/delete-employee/' + id);
            },
            getEmployeeAssignmentList: function (id) {
                return $http.get('/api/admin/employee-assignment-list/' + id);
            },
            getAssignmentList: function () {
                return $http.get('/api/admin/get-assignment-list');
            },
            createAssignment: function (assignment) {
                return $http.put('/api/admin/create-assignment', assignment);
            },
            finishAssignment: function (assignment) {
                return $http.post('/api/admin/finish-assignment', assignment);
            },
            getAssignmentProcedures: function (id) {
                return $http.get('/api/admin/get-assignment-procedures/' + id);
            }
        };
    }]);
