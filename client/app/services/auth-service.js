angular.module('buiiltApp')
.factory('authService', function($location, $rootScope, $http, userService,teamService, $cookieStore, $q,$state) {
  var currentUser = {};
  if ($cookieStore.get('token')) {
    currentUser = userService.get();
  }
  return {
    /**
     * Authenticate user and save token
     *
     * @param  {Object}   user     - login info
     * @param  {Function} callback - optional
     * @return {Promise}
     */
    login: function(user, callback) {
      var cb = callback || angular.noop;
      var deferred = $q.defer();

      $http.post('/auth/local', {
        email: user.email,
        password: user.password
      })
      .success(function(data) {
        $cookieStore.put('token', data.token);
        currentUser = userService.get();
        deferred.resolve(data);
        return cb();
      })
      .error(function(err) {
        this.logout();
        deferred.reject(err);
        return cb(err);
      }.bind(this));

      return deferred.promise;
    },
    /**
     * Delete access token and user info
     *
     * @param  {Function}
     */
    logout: function() {
      $cookieStore.remove('token');
      currentUser = {};
    },
    /**
     * Create a new user
     *
     * @param  {Object}   user     - user info
     * @param  {Function} callback - optional
     * @return {Promise}
     */
    createUser: function(user, callback) {
      var cb = callback || angular.noop;

      return userService.save(user,
      function(data) {
        if (data.emailVerified == true) {
          $cookieStore.put('token', data.token);
          currentUser = userService.get();
          $state.go('team.manager')
        }
        return cb(user);
      },
      function(err) {
        this.logout();
        return cb(err);
      }.bind(this)).$promise;
    },

    createUserWithInvite: function(user, callback){
      var cb = callback || angular.noop;

      return userService.createUserWithInviteToken(user,
      function(data) {
        if (data.emailVerified == true) {
          $cookieStore.put('token', data.token);
          currentUser = userService.get();
          if (data.package.type === 'contractor') {
            $state.go('contractorRequest.sendQuote', {id:data.package.project, packageId: data.package._id});  
          }
          else if (data.package.type === 'material') {
            $state.go('materialRequest.sendQuote', {id: data.package.project, packageId: data.package._id});
          }
          else if (data.package.type === 'BuilderPackage') {
            $state.go('dashboard', {id: data.package.project});
          }
          // $state.go('team.manager')

        }
        return cb(user);
      },
      function(err) {
        this.logout();
        return cb(err);
      }.bind(this)).$promise;
    },
    /**
     * Change password
     *
     * @param  {String}   oldPassword
     * @param  {String}   newPassword
     * @param  {Function} callback    - optional
     * @return {Promise}
     */
    changePassword: function(oldPassword, newPassword, callback) {
      var cb = callback || angular.noop;

      return userService.changePassword({id: currentUser._id}, {
        oldPassword: oldPassword,
        newPassword: newPassword
      }, function(user) {
        return cb(user);
      }, function(err) {
        return cb(err);
      }).$promise;
    },

    // changePhoneNum: function(phoneNumber, callback) {
    //   var cb = callback || angular.noop;

    //   return userService.changePhoneNum({id: currentUser._id}, {
    //     phoneNumber: phoneNumber
    //   }, function(user) {
    //     return cb(user);
    //   }, function(err) {
    //     return cb(err);
    //   }.bind(this)).$promise;
    // },

    changeProfile: function(firstName, lastName, phoneNumber, callback) {
      var cb = callback || angular.noop;
      return userService.changeProfile({id: currentUser._id}, {
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber
      }, function(user) {
        return cb(user);
      }, function(err){
        return cb(err);
      }).$promise;
    },
    /**
     * Gets all available info on authenticated user
     *
     * @return {Object} user
     */
    getCurrentUser: function() {
      return currentUser;
    },
    /**
     * Get team on authenticated user
     * @returns {*}
     */
    getCurrentTeam : function() {
      return teamService.getCurrentTeam();
    },
    getCurrentInvitation : function() {
      return teamService.getCurrentInvitation();
    },
    /**
     * Gets all available info on authenticated user in async
     *
     * @param {Function} cb
     * @returns {void}
     */
    getCurrentUserInAsync: function(cb) {
      if (currentUser.hasOwnProperty('$promise')) {
        currentUser.$promise.then(function() {
          cb(currentUser);
        }). catch (function() {
          cb(null);
        });
      } else if (currentUser.hasOwnProperty('role')) {
        cb(currentUser);
      } else {
        cb(null);
      }
    },

    /**
     * Check if a user is logged in
     *
     * @return {Boolean}
     */
    isLoggedIn: function() {
      return currentUser.hasOwnProperty('role');
    },
    /**
     * Waits for currentUser to resolve before checking if user is logged in
     */
    isLoggedInAsync: function(cb) {
      if (currentUser.hasOwnProperty('$promise')) {
        currentUser.$promise.then(function() {
          cb(true);
        }). catch (function() {
          cb(false);
        });
      } else if (currentUser.hasOwnProperty('role')) {
        cb(true);
      } else {
        cb(false);
      }
    },
    /**
     * Check if a user is an admin
     *
     * @return {Boolean}
     */
    isAdmin: function() {
      return currentUser.role === 'admin';
    },
    /**
     * Get auth token
     */
    getToken: function() {
      return $cookieStore.get('token');
    },

    recoverPassword: function(email, callback){
      var cb = callback || angular.noop;
      var deferred = $q.defer();

      $http.post('/auth/recoverPassword', {
        email: email
      })
      .success(function(data) {
        deferred.resolve(data);
        return cb();
      })
      .error(function(err) {
        deferred.reject(err);
        return cb(err);
      }.bind(this));

      return deferred.promise;
    },

    confirmResetPasswordToken: function(token, callback){
      var cb = callback || angular.noop;
      var deferred = $q.defer();

      $http.get('/auth/confirmPasswordResetToken/' + token)
      .success(function(data) {
        //do login
        $cookieStore.put('token', data.token);
        currentUser = userService.get();

        deferred.resolve(data);
        return cb();
      })
      .error(function(err) {
        deferred.reject(err);
        return cb(err);
      }.bind(this));

      return deferred.promise;
    },

    setCurrentUser: function(user){
      currentUser = user;
    },

    sendVerification: function() {
      return userService.sendVerification();
    }
  };
});