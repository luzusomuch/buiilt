angular.module('buiiltApp')
  .directive('message', function(){
    return {
      restrict: 'EA',
      templateUrl: 'app/directives/message/message.html',
      scope:{
        package: '=',
        type : '@'
      },
      controller:
        function($scope,$rootScope,messageService, authService,filterFilter, $cookieStore, $stateParams, $rootScope, $location , packageService, userService, projectService, FileUploader, documentService) {
          //Init Params
          $scope.currentProject = $rootScope.currentProject;
          authService.getCurrentUser().$promise.then(function(res) {
            $scope.currentUser = res;
            authService.getCurrentTeam().$promise.then(function(res) {
              $scope.currentTeam = res;
              $scope.isLeader = (_.find($scope.currentTeam.leader,{_id : $scope.currentUser._id})) ? true : false;
              getAvailableUser($scope.type);
            });
          });
          $scope.submitted = false;
          $scope.isNew = true;

          //Get Available assignee to assign to task
          var getAvailableUser = function(type) {
            switch(type) {
              case 'builder' :
                $scope.available = [];
                _.forEach($scope.currentProject.owner.member,function(member) {
                  if (member.status == 'Active') {
                    $scope.available.push(member._id);
                  }
                });
                $scope.available = _.union($scope.available,$scope.currentProject.owner.leader);
                break;
              case 'staff' :
                $scope.available =  angular.copy($scope.package.staffs);
                $scope.available = _.union($scope.available,$scope.currentTeam.leader);
                _.remove($scope.available,{_id : $scope.currentUser._id});
                break;
              case 'contractor' :
                $scope.available = [];
                _.forEach($scope.package.winnerTeam._id.member,function(member) {
                  if (member.status == 'Active') {
                    $scope.available.push(member._id);
                  }
                });
                _.forEach($scope.package.winnerTeam._id.leader,function(leader) {
                  $scope.available.push(leader);
                });
                break;
              case 'material' :
                $scope.available = [];
                _.forEach($scope.package.winnerTeam._id.member,function(member) {
                  if (member.status == 'Active') {
                    $scope.available.push(member._id);
                  }
                });
                _.forEach($scope.package.winnerTeam._id.leader,function(leader) {
                  $scope.available.push(leader);
                });
                break;
              default :
                break
            }
          };

          //Update Thread List
          var updateThread = function() {
            messageService.get({id : $scope.package._id, type : $scope.type}).$promise
              .then(function(res) {
                $scope.threads = res;
                //$scope.currentThread = $scope.threads[0];
                _.forEach($scope.threads,function(thread) {
                  if (_.find(thread.users,{'_id' : $scope.currentUser._id})) {
                    thread.canSee = true;
                  } else if (thread.owner == $scope.currentUser._id) {
                    thread.canSee = true;
                    thread.isOwner = true;
                  } else {
                    thread.canSee = false;
                    thread.isOwner = false
                  }
                });
                if ($scope.currentThread) {
                  $scope.currentThread = _.find($scope.threads,{_id : $scope.currentThread._id});
                }
              });
          };
          updateThread();


          //Function fired when click new task
          $scope.newThread = function() {
            $scope.thread = {
              users : []
            };
            getAvailableUser($scope.type);
            $scope.isNew = true;
          };

          //Function fired when click edit task
          $scope.editThread = function(thread) {
            $scope.thread = angular.copy(thread);
            getAvailableUser($scope.type);
            _.forEach($scope.thread.users,function(item) {
              _.remove($scope.available,{_id : item._id});
            });
            $scope.isNew = false;

          };

          //Assign people to task
          $scope.assign = function(user,index) {
            $scope.thread.users.push(user);
            $scope.available.splice(index,1);
          };

          //Revoke people to task
          $scope.revoke = function(assignee,index) {
            $scope.available.push(assignee);
            $scope.thread.users.splice(index,1);
          };

          $scope.selectThread = function(thread) {
            $scope.currentThread = thread;
          };

          $scope.sendMessage = function(form) {
            $scope.messageFormSubmitted = true;
            if (form.$valid) {
              messageService.sendMessage({id : $scope.currentThread._id, type : $scope.type},$scope.message).$promise
                .then(function(res) {
                  $scope.currentThread = res;
                  updateThread();
                  $scope.message.text = '';
                  $scope.messageFormSubmitted = false;
                });
            }
          };

          $scope.saveThread = function(form) {
            $scope.submitted = true;
            if (form.$valid) {
              if ($scope.isNew) {
                messageService.create({id: $scope.package._id, type: $scope.type}, $scope.thread).$promise
                  .then(function (res) {
                    $('.card-title').trigger('click');
                    $scope.currentThread = res;
                    updateThread();
                  })
              } else {
                messageService.update({id : $scope.thread._id, type : $scope.type},$scope.thread).$promise
                  .then(function(res) {
                    $('.card-title').trigger('click');
                    updateThread();
                  })
              }
            }
          };
        }
    }
  });
