angular.module('buiiltApp', [
  'ui.bootstrap',
  'ui.utils',
  'ui.router',
  'ngAnimate',
  'ui.bootstrap',
  'angularFileUpload',
  'ngCookies',
  'ngSanitize',
  'ngResource',
  'angular-loading-bar',
  'cgNotify',
  'ngMaterial'
]);

angular.module('buiiltApp').config(function($stateProvider, $urlRouterProvider, $locationProvider, $urlRouterProvider, $httpProvider, $sceDelegateProvider, cfpLoadingBarProvider) {
  $sceDelegateProvider.resourceUrlWhitelist(['^(?:http(?:s)?:\/\/)?(?:[^\.]+\.)?\(vimeo|youtube)\.com(/.*)?$', 'self']);

  /* Add New States Above */
  $urlRouterProvider.otherwise('/');

  $locationProvider.html5Mode(true);
  $httpProvider.interceptors.push('authInterceptor');

  //angular loading bar
  cfpLoadingBarProvider.includeSpinner = true;
})
.factory('authInterceptor', function ($q, $cookieStore, $location) {
  return {
    // Add authorization token to headers
    request: function (config) {
      config.headers = config.headers || {};
      if ($cookieStore.get('token')) {
        config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
      }
      return config;
    },

    // Intercept 401s and redirect you to login
    responseError: function(response) {
      if(response.status === 401) {
        $location.path('/signin');
        // remove any stale tokens
        $cookieStore.remove('token');
        return $q.reject(response);
      }
      else {
        return $q.reject(response);
      }
    }
  };
})
.run(function($rootScope, $cookieStore, cfpLoadingBar) {
  cfpLoadingBar.start();

  $rootScope.safeApply = function(fn) {
    var phase = $rootScope.$$phase;
    if (phase === '$apply' || phase === '$digest') {
      if (fn && (typeof (fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };
})
.value('$', $);