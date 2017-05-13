angular.module('advocacy.login', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'login/login.html',
            controller: 'loginCtrl'
        })
    }])

    .controller('loginCtrl', ['$scope', '$location', '$rootScope', 'loginService', 'preferences', 'Notification',
        function ($scope, $location, $rootScope, loginService, preferences, Notification) {
            $scope.selectedRole = 'client';

            $scope.selectRole = function (role) {
                $scope.selectedRole = role;
            };

            $scope.login = function () {
                var user = {email: $scope.email, password: $scope.password, remember: true, role: $scope.selectedRole};
                loginService.login(user, $scope.selectedRole)
                    .then(function (data) {
                        preferences.set('user', user);
                        $rootScope.isLoggedIn = true;
                        Notification.success('Login successful!');
                        switch ($scope.selectedRole) {
                            case 'client':
                                $location.path('/client-dashboard');
                                break;
                            case 'employee':
                                $location.path('/employee-dashboard');
                                break;
                            case 'admin':
                                $location.path('/admin-dashboard');
                                break;
                        }
                    }, function (error) {
                        Notification.error('An error occurred');
                        console.log(error);
                    });
            }
        }])

    .factory('loginService', ['$http', function ($http) {
        return {
            login: function (user, userType) {
                return $http.post('/api/' + userType + '/login', user);
            }
        };
    }
    ]);
