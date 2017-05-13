angular.module('advocacy.register', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/register', {
            templateUrl: 'register/register.html',
            controller: 'registerCtrl'
        })
    }])

    .controller('registerCtrl', ['$scope', '$location', 'registerService', 'Notification', function ($scope, $location, registerService, Notification) {
        $scope.register = function () {
            registerService.register({firstname: $scope.firstname, lastname: $scope.lastname, email: $scope.email, password: $scope.password})
                .then(function (data) {
                    Notification.success('Sign up successful!');
                    $location.path('/login');
                }, function (error) {
                    Notification.error('An error occurred');
                    console.log(error);
                });
        };
    }])

    .factory('registerService', ['$http', function ($http) {
        return {
            register: function (user) {
                return $http.put('/api/register', user);
            }

        };
    }
    ]);
