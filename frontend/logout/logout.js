angular.module('advocacy.logout', [])

.controller('logoutCtrl', ['$scope', '$rootScope', '$location', 'preferences', 'logoutService', function($scope, $rootScope, $location, preferences, logoutService){
  $scope.logout = function(){
    logoutService.logout()
    .then(function(){
      preferences.clear();
      $location.path('/login');
      $rootScope.isLoggedIn = false;
    });
  };

  $scope.goToDashboard = function(){
    switch(preferences.get('user').role){
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
  };
}])

.factory('logoutService', ['$http', function($http){
  return {
      logout: function() {
          return $http.get('/api/logout');
      }
  };
}]);
