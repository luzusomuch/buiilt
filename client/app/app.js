angular.module('buiiltApp', [
    'ui.utils',
    'ui.router',
    'ngAnimate',
    'ngCookies',
    'ngSanitize',
    'ngResource',
    'angular-loading-bar',
    'cgNotify',
    'restangular',
    'lumx',
    '720kb.tooltips',
    'angucomplete-alt',
    'btford.socket-io',
    'ngTable',
    'angular-filepicker',
    'ngMaterial',
    'angular-clipboard',
    'angular-stripe'
]);

angular
.module('buiiltApp').config(function ($stateProvider, $urlRouterProvider, $locationProvider, $urlRouterProvider, $httpProvider, $sceDelegateProvider, cfpLoadingBarProvider, filepickerProvider, stripeProvider) {
    $sceDelegateProvider.resourceUrlWhitelist(['^(?:http(?:s)?:\/\/)?(?:[^\.]+\.)?\(vimeo|youtube)\.com(/.*)?$', 'self']);
    $urlRouterProvider.otherwise('/signin');

    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('authInterceptor');

    //angular loading bar
    cfpLoadingBarProvider.includeSpinner = true;
    filepickerProvider.setKey('AM6Wn3DzwRimryydBnsj7z');
    // $mixpanelProvider.apiKey('e6d853e9a8af11b4aa36ea63291ead38'); // your token is different than your API key
    // for testing mode
    // stripeProvider.setPublishableKey('pk_test_WGKFaZu6dXITEIxoyVI8DrVa');
    // for live mode
    stripeProvider.setPublishableKey('pk_live_INyU3RmhNGx4GSBQUjuqZne9');
})
.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
    .primaryPalette('blue')
    .accentPalette('amber', {'default': '500', 'hue-1': '300', 'hue-2': '800', 'hue-3': 'A400'})
    .warnPalette('grey', {'hue-1': '50'})
    .backgroundPalette('grey')
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
                $location.path('/signin');
                // remove any stale tokens
                $cookieStore.remove('token');
                return $q.reject(response);
            } else {
                return $q.reject(response);
            }
        }
    };
})
.run(function ($rootScope, $cookieStore, cfpLoadingBar, authService, $location,projectService,$state, peopleService) {
    cfpLoadingBar.start();
    $rootScope.maximunHeight = $(window).height();
    $rootScope.project = {};
    $rootScope.currentProjectBackend = {};
    // $rootScope.authService = authService;
    $rootScope.currentTeam = {};
    $rootScope.currentUser = {};
    $rootScope.hasHeader = true;
    $rootScope.hasFooter = true;
    $rootScope.isArchive = false;
    $rootScope.roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
    // $rootScope.isLeader = false;
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

    authService.isLoggedInAsync(function (loggedIn) {
        if (loggedIn) {
            authService.getCurrentUser().$promise.then(function(res){
                $rootScope.currentUser = res;
                authService.getCurrentTeam().$promise.then(function(team){
                    $rootScope.currentTeam = team;
                    var currentTeamType = [];
                    currentTeamType.push($rootScope.currentTeam.type);
                    window.inlineManualTracking = {
                      uid: $rootScope.currentUser._id, // String or Int e.g. "123"
                      email: $rootScope.currentUser.email, // String e.g. "johndoe@example.com"
                      roles: [currentTeamType], // Array of roles, e.g. ["builder"]
                    };
                });
            });
        }
        else {

        }
    });

    $rootScope.$on('$stateChangeStart', function (event,toState, toParams, next) {
        $rootScope.currentPackageId = toParams.packageId;
        $rootScope.currentPackageType = toParams.type;
        authService.isLoggedInAsync(function (loggedIn) {
            if (loggedIn) {
                authService.getCurrentTeam().$promise.then(function(res){
                    $rootScope.currentTeam = res;
                });
                authService.getCurrentUser().$promise.then(function(res) {
                    $rootScope.currentUser = res;
                });
            }
            if (toState.authenticate && !loggedIn) {
                $location.path('/');
            } else if (!toState.authenticate && loggedIn) {
                $state.go('dashboard.tasks');
            }
        });
        if (toState.noHeader) {
            $rootScope.hasHeader = false;
        }

        if (toState.noFooter) {
            $rootScope.hasFooter = false;
        }

        if (toState.isAdmin) {
            authService.getCurrentUser().$promise.then(function(user){
                if (user.role !== 'admin') {
                    $state.go('signinBackend');
                }
            });
        }

        if (toParams.id) {
            projectService.get({id: toParams.id}).$promise.then(function(project) {
                if (project._id) {
                    $rootScope.project = project;
                    if (project.status == "archive") {
                        $rootScope.isArchive = true;
                    }
                } else {
                    $rootScope.project = {};
                }
            });
        }
    });

    $rootScope.overlay = false;

})
.value('$', $);