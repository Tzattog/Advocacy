angular.module('advocacy', ['ngRoute',
               'preferences',
               'advocacy.register',
               'advocacy.login',
               'advocacy.logout',
               'advocacy.clientDashboard',
               'advocacy.adminDashboard',
               'advocacy.employeeDashboard',
               'ui.select',
               'ui-notification'])
  .config(['$locationProvider', '$routeProvider', '$httpProvider', 'NotificationProvider', function($locationProvider, $routeProvider, $httpProvider, NotificationProvider) {
          $locationProvider.hashPrefix('!');

          $routeProvider.otherwise({redirectTo: '/'});

          $httpProvider.interceptors.push('myHttpInterceptor');

          $locationProvider.html5Mode({
              enabled: true,
              requireBase: false
          });

          NotificationProvider.setOptions({
              positionY: 'bottom'
          });
  }])

  .run(['$rootScope', 'preferences', function($rootScope, preferences){
        if (preferences.get('user')){
          $rootScope.isLoggedIn = true;
        }
  }])

  .factory('myHttpInterceptor', ['$q', '$injector', '$location',
      function($q, $injector, $location) {
          return {
              'responseError': function(rejection) {
                  var defer = $q.defer();
                  if(rejection.status == 401){
                      $location.path('/login');
                  }
                  defer.reject(rejection);
                  return defer.promise;
              }
          }
      }
  ]);
