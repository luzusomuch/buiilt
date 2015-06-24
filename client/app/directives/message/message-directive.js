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
            });
          });
          $scope.submitted = false;
          $scope.isNew = true;
          $scope.filter = 'all';
          $scope.customFilter = {};

          //Get Available assignee to assign to task
          var getAvailableUser = function(type) {
            switch(type) {
              case 'staff' :
                $scope.available =  angular.copy($scope.package.staffs);
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
              default :
                break
            }
          };

          getAvailableUser($scope.type);

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
                })
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
            messageService.sendMessage({id : $scope.currentThread._id, type : $scope.type},$scope.message).$promise
              .then(function(res) {
                $scope.currentThread = res;
                $scope.message.text = '';
              });
          };

          $scope.saveThread = function(form) {
            $scope.submitted = false;
            if (form.$valid) {
              if ($scope.isNew) {
                messageService.create({id: $scope.package._id, type: $scope.type}, $scope.thread).$promise
                  .then(function (res) {
                    $('.card-title').trigger('click');
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

          //Complete task
          $scope.complete = function(task) {
            task.completed = !task.completed;
            if (task.completed) {
              task.completedBy = $scope.currentUser._id;
              task.completedAt = new Date();
            } else {
              task.completedBy = null;
              task.completedAt = null;
            }
            taskService.update({id : task._id, type : $scope.type},task).$promise
              .then(function(res) {
                //$('.card-title').trigger('click');
                updateTasks();
              })
          };

          //Submit form function
          $scope.save = function(form) {
            if (form.$valid) {
              if ($scope.isNew) {
                taskService.create({id : $scope.package._id, type : $scope.type},$scope.task).$promise
                  .then(function(res) {
                    $('.card-title').trigger('click');
                    updateTasks();
                  })
              } else {
                taskService.update({id : $scope.task._id, type : $scope.type},$scope.task).$promise
                  .then(function(res) {
                    $('.card-title').trigger('click');
                    updateTasks();
                  })
              }

            }
          }
        }
    }
  });