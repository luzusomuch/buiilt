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
    'btford.socket-io',
    'ngTable',
    'angular-filepicker',
    'ngMaterial',
    'angular-clipboard',
    'angular-stripe',
    "ui.calendar",
    "internationalPhoneNumber",
    "ng.deviceDetector"
]);

angular
.module('buiiltApp').config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, $sceDelegateProvider, cfpLoadingBarProvider, stripeProvider, filepickerProvider) {
    $sceDelegateProvider.resourceUrlWhitelist(['^(?:http(?:s)?:\/\/)?(?:[^\.]+\.)?\(vimeo|youtube)\.com(/.*)?$', 'self']);
    
    $stateProvider
    .state('app', {
        url: '/appPage',
        controller: function($rootScope, deviceDetector){
            $rootScope.title = "App Page";
            var raw = deviceDetector.raw;
            if (raw.os.android) {
                window.location.href = "https://play.google.com/store/apps/details?id=com.buiilt.hoanvu";
            } else if (raw.os.ios) {
                window.location.href = "https://itunes.apple.com/us/app/buiilt/id1036694486?l=vi&ls=1&mt=8";
            } else {
                window.location.href="/signin";
            }
        },
    });

    $urlRouterProvider.otherwise('/signin');

    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('authInterceptor');

    //angular loading bar
    cfpLoadingBarProvider.includeSpinner = true;

    // angular-filepicker
    filepickerProvider.setKey('AM6Wn3DzwRimryydBnsj7z');
    // mixpanel
    // $mixpanelProvider.apiKey('e6d853e9a8af11b4aa36ea63291ead38'); // your token is different than your API key

    // stripe payment for testing mode
    stripeProvider.setPublishableKey('pk_test_WGKFaZu6dXITEIxoyVI8DrVa');
    // stripe payment for live mode
    // stripeProvider.setPublishableKey('pk_live_INyU3RmhNGx4GSBQUjuqZne9');
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

    $rootScope.refreshData = function(arrayItems) {
        _.each(arrayItems, function(item) {
            item.select = false;
        });
    };

    $rootScope.getNotMemberName = function(contacts, notMemberEmails) {
        var notMemberNames = [];
        _.each(notMemberEmails, function(email) {
            var index = _.findIndex(contacts, function(contact) {
                return email===contact.email;
            });
            if (index !== -1) {
                notMemberNames.push(contacts[index].name);
            }
        });
        return notMemberNames;
    };

    $rootScope.checkPrivilageInProjectMember = function(people) {
        var allow = false;
        _.each($rootScope.roles, function(role) {
            _.each(people[role], function(tender) {
                if (tender.tenderers[0]._id && tender.tenderers[0]._id._id.toString()===$rootScope.currentUser._id.toString()) {
                    allow = !tender.archive;
                    return false;
                } else {
                    var index = _.findIndex(tender.tenderers[0].teamMember, function(member) {
                        return member._id.toString()===$rootScope.currentUser._id;
                    });
                    if (index !== -1 && (!tender.tenderers[0].archivedTeamMembers || (tender.tenderers[0].archivedTeamMembers && tender.tenderers[0].archivedTeamMembers.indexOf($rootScope.currentUser._id) === -1))) {
                        allow = true;
                        return false;
                    }
                }
            });
            if (allow) {
                return false;
            }
        });
        return allow;
    };

    $rootScope.getProjectMembers = function(people) {
        var membersList = [];
        _.each($rootScope.roles, function(role) {
            _.each(people[role], function(tender){
                if (tender.hasSelect) {
                    var isLeader = (_.findIndex(tender.tenderers, function(tenderer) {
                        if (tenderer._id) {
                            return tenderer._id._id.toString() === $rootScope.currentUser._id.toString();
                        }
                    }) !== -1) ? true : false;
                    if (!isLeader) {
                        _.each(tender.tenderers, function(tenderer) {
                            var memberIndex = _.findIndex(tenderer.teamMember, function(member) {
                                return member._id.toString() === $rootScope.currentUser._id.toString();
                            });
                            if (memberIndex !== -1) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.select = false;
                                    membersList.push(member);
                                });
                            }
                        });
                        if (tender.tenderers[0]._id) {
                            tender.tenderers[0]._id.select = false;
                            membersList.push(tender.tenderers[0]._id);
                        } else {
                            membersList.push({email: tender.tenderers[0].email, select: false});
                        }
                    } else {
                        _.each(tender.tenderers, function(tenderer) {
                            if (tenderer._id._id.toString() === $rootScope.currentUser._id.toString()) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.select = false;
                                    membersList.push(member);
                                });
                            }
                        });
                    }
                }
            });
        });
        return membersList;
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
        } else if (!toState.id) {
            $rootScope.project = {};
        }
    });

    $rootScope.overlay = false;

})
.value('$', $);