angular.module('buiiltApp', [
  'ui.utils',
  'ui.router',
  'ngAnimate',
  'angularFileUpload',
  'ngCookies',
  'ngSanitize',
  'ngResource',
  'angular-loading-bar',
  'cgNotify',
  'restangular',
  'lumx',
  'ui.materialize',
  // 'contenteditable',
  '720kb.tooltips',
  'angucomplete-alt',
  'btford.socket-io',
  'ngTable'
]);

angular.module('buiiltApp').config(function ($stateProvider, $urlRouterProvider, $locationProvider, $urlRouterProvider, $httpProvider, $sceDelegateProvider, cfpLoadingBarProvider) {
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
      responseError: function (response) {
        if (response.status === 401) {
          $location.path('/');
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
  .run(function ($rootScope, $cookieStore, cfpLoadingBar, authService, $location,projectService,$state) {
    cfpLoadingBar.start();
    $rootScope.maximunHeight = $(window).height();
    $rootScope.currentProject = {};
    $rootScope.currentProjectBackend = {};
    $rootScope.authService = authService;
    $rootScope.currentTeam = {};
    $rootScope.hasHeader = true;
    $rootScope.hasFooter = true;
    $rootScope.safeApply = function (fn) {
      var phase = $rootScope.$$phase;
      if (phase === '$apply' || phase === '$digest') {
        if (fn && (typeof (fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };
    $rootScope.$on('$stateChangeStart', function (event,toState, toParams, next) {
      $rootScope.currentPackageId = toParams.packageId;
      $rootScope.currentPackageType = toParams.type;
      authService.isLoggedInAsync(function (loggedIn) {
        if (loggedIn) {

        }
        if (toState.authenticate && !loggedIn) {
          $location.path('/');
        } else if (!toState.authenticate && loggedIn) {
          $state.go('team.manager')
        }
      });
      if (toState.noHeader) {
        $rootScope.hasHeader = false;
      }

      if (toState.noFooter) {
        $rootScope.hasFooter = false;
      }

      if (toState.canAccess) {
        authService.getCurrentTeam().$promise
          .then(function(res) {
            if (toState.canAccess.indexOf(res.type) == -1) {
              if (toState.hasCurrentProject) {
                $state.go('dashboard',{id : toParams.id })
              } else {
                $state.go('team.manager');
              }
            } else {
              // console.log('false')
            }
          });
      }

      if (toState.isAdmin) {
        authService.getCurrentUser().$promise.then(function(user){
          if (user.role !== 'admin') {
            $state.go('signin');
          }
        });
      }

      if (toState.backendHasCurrentProject) {
        if (!$rootScope.currentProjectBackend || toParams.id !== $rootScope.currentProjectBackend._id) {
          projectService.get({id: toParams.id}).$promise
          .then(function (data) {
            if (data._id) {
              $rootScope.currentProjectBackend = data;

            } else {
              $rootScope.currentProjectBackend = null;
              $location.path('/backend/projects');
            }
          })
        }
      }
      else {
        $rootScope.currentProjectBackend = {};
      }

      if (toState.hasCurrentProject) {

        if (!$rootScope.currentProject || toParams.id !== $rootScope.currentProject._id) {
          projectService.get({id: toParams.id}).$promise
            .then(function (data) {
              if (data._id) {
                $rootScope.currentProject = data;

              } else {
                $rootScope.currentProject = null;
                $location.path('/team/manager');
              }
            })
        }

      } else {
        $rootScope.currentProject = { };

      }
      $rootScope.hasCurrentProject=toState.hasCurrentProject;
    });

    $rootScope.overlay = false;

  })
  .value('$', $);