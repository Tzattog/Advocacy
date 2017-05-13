angular.module('advocacy.clientDashboard', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/client-dashboard', {
            templateUrl: 'clientDashboard/clientDashboard.html',
            controller: 'clientDashboardCtrl'
        })
    }])

    .controller('clientDashboardCtrl', ['$scope', '$location', '$rootScope', 'clientDashboardService', 'preferences', 'Notification',
        function ($scope, $location, $rootScope, clientDashboardService, preferences, Notification) {
        if (preferences.get('user').role != 'client') {
            $location.path('/login');
        }

        $scope.currentTab = function (tab) {
            return 'clientDashboard/templates/' + tab + '.html';
        };

        $scope.newPersonalInfo = {};

        $scope.changePersonalInfo = function () {
            clientDashboardService.changePersonalInfo($scope.newPersonalInfo).then(function (data) {
                Notification.success('Info successfully changed!');
                console.log('Personal info changed!');
            }, function (error) {
                Notification.error('An error occurred');
                console.log(error);
            });
        };

        $scope.newPassword = {};

        $scope.changePassword = function () {
            clientDashboardService.changePassword($scope.newPassword).then(function (data) {
                Notification.success('Password successfully changed!');
                console.log('Password changed!');
            }, function (error) {
                Notification.error('An error occurred');
                console.log(error);
            });
        };

        $scope.getAssignmentList = function () {
            clientDashboardService.getAssignmentList().then(function (data) {
                $scope.assignmentList = data.data;
            }, function (error) {
                Notification.error('An error occurred');
                console.log(error);
            });
        };

        $scope.getAssignmentProcedures = function (assignment) {
            clientDashboardService.getAssignmentProcedures(assignment.id).then(function (data) {
                assignment.procedures = data.data;
            }, function (error) {
                Notification.error('An error occurred');
                console.log(error);
            });
        };

        $scope.getCurrentUser = function () {
            clientDashboardService.getCurrentUser().then(function (data) {
                $scope.personalInfo = data.data;
            }, function (error) {
                Notification.error('An error occurred');
                console.log(error);
            });
        };

        $scope.downloadReport = function (id) {
            window.location = '/api/client/download-report/' + id;
        };

        $scope.viewTab = function (tab) {
            switch (tab) {
                case 'profile':
                    $scope.getCurrentUser();
                    break;
                case 'assignments':
                    $scope.getAssignmentList();
                    break;
            }
            $('.collapse').collapse('hide');
            $scope.viewedTab = tab;
        };

        $scope.viewTab('profile');
    }])

    .factory('clientDashboardService', ['$http', function ($http) {
        return {
            getCurrentUser: function () {
                return $http.get('/api/current-user');
            },
            changePersonalInfo: function (info) {
                return $http.post('/api/client/change-personal-info', info);
            },
            changePassword: function (password) {
                return $http.post('/api/client/change-password', password);
            },
            getAssignmentList: function () {
                return $http.get('/api/client/assignment-list');
            },
            getAssignmentProcedures: function (id) {
                return $http.get('/api/client/get-assignment-procedures/' + id);
            }
        };
    }]);
