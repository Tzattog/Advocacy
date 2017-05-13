angular.module('advocacy.employeeDashboard', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/employee-dashboard', {
            templateUrl: 'employeeDashboard/employeeDashboard.html',
            controller: 'employeeDashboardCtrl'
        })
    }])

    .controller('employeeDashboardCtrl', ['$scope', '$location', '$rootScope', 'employeeDashboardService', 'preferences', 'Notification',
        function ($scope, $location, $rootScope, employeeDashboardService, preferences, Notification) {
            if (preferences.get('user').role != 'employee') {
                $location.path('/login');
            }

            $scope.currentTab = function (tab) {
                return 'employeeDashboard/templates/' + tab + '.html';
            };

            $scope.getAssignmentList = function () {
                employeeDashboardService.getAssignmentList().then(function (data) {
                    $scope.assignmentList = data.data;
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.getAssignmentProcedures = function (assignment) {
                employeeDashboardService.getAssignmentProcedures(assignment.id).then(function (data) {
                    assignment.procedures = data.data;
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.newPersonalInfo = {};

            $scope.changePersonalInfo = function () {
                employeeDashboardService.changePersonalInfo($scope.newPersonalInfo).then(function (data) {
                    Notification.success('Info successfully changed!');
                    console.log('Personal info changed!');
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.newPassword = {};

            $scope.changePassword = function () {
                employeeDashboardService.changePassword($scope.newPassword).then(function (data) {
                    Notification.success('Password successfully changed!');
                    console.log('Password changed!');
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.newProcedure = {};

            $scope.addProcedure = function () {
                employeeDashboardService.addProcedure($scope.newProcedure).then(function (data) {
                    Notification.success('Procedure successfully added!');
                    console.log('Procedure added!');
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.getCurrentUser = function () {
                employeeDashboardService.getCurrentUser().then(function (data) {
                    $scope.personalInfo = data.data;
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
            };

            $scope.viewTab = function (tab) {
                switch (tab) {
                    case 'profile':
                        $scope.getCurrentUser();
                        break;
                    case 'assignments':
                        $scope.getAssignmentList();
                        break;
                    case 'addProcedure':
                        $scope.getAssignmentList();
                        break;
                }
                $('.collapse').collapse('hide');
                $scope.viewedTab = tab;
            };

            $scope.viewTab('profile');
        }])

    .factory('employeeDashboardService', ['$http', function ($http) {
        return {
            getCurrentUser: function () {
                return $http.get('/api/current-user');
            },
            getAssignmentList: function () {
                return $http.get('/api/employee/assignment-list');
            },
            getAssignmentProcedures: function (id) {
                return $http.get('/api/employee/get-assignment-procedures/' + id);
            },
            changePersonalInfo: function (info) {
                return $http.post('/api/employee/change-personal-info', info);
            },
            changePassword: function (password) {
                return $http.post('/api/employee/change-password', password);
            },
            addProcedure: function (procedure) {
                return $http.put('/api/employee/add-procedure', procedure);
            }
        };
    }]);
