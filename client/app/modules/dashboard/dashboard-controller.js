angular.module('buiiltApp')
  .controller('DashboardCtrl', function($scope,$state, $timeout, $q, userService, $rootScope,myFiles,myTasks,myThreads,authService,taskService,messageService,notificationService) {
    $scope.currentProject = $rootScope.currentProject;
    $scope.myTasks = myTasks;
    _.forEach($scope.myTasks,function(task) {
      task.dateEnd = new Date(task.dateEnd);
    });
    $scope.myThreads = myThreads;
    $scope.myFiles = myFiles;
    $scope.currentList = 'tasks';
    $scope.currentThread = {};

    var getAvailableAssignee = function($package,type) {
      switch(type) {
        case 'builder' :
          $scope.available = [];
          $scope.available = _.union($scope.available,$scope.currentTeam.leader);
          if ($scope.currentTeam._id == $package.owner._id && $scope.isLeader) {
            if ($package.to.team) {
              _.forEach($package.to.team.leader, function (leader) {
                $scope.available.push(leader);
              })
            }
          }
          if ($package.to.team && $scope.currentTeam._id == $package.to.team._id && $scope.isLeader) {
            _.forEach($package.owner.leader, function (leader) {
              $scope.available.push(leader);
            })
          }
          _.forEach($scope.currentTeam.member,function(member) {
            if (member.status == 'Active') {
              $scope.available.push(member._id);
            }
          });
          break;
        case 'staff' :
          $scope.available =  angular.copy($package.staffs);
          $scope.available = _.union($scope.available,$scope.currentTeam.leader);
          break;
        case 'contractor' :
          $scope.available = [];
          $scope.available = _.union($scope.available,$scope.currentTeam.leader);
          if ($scope.currentTeam._id == $package.winnerTeam._id._id && $scope.isLeader) {
            _.forEach($package.owner.leader,function(leader) {
              $scope.available.push(leader);
            });
          }
          if ($scope.currentTeam._id == $package.owner._id && $scope.isLeader) {
            _.forEach($package.winnerTeam._id.leader,function(leader) {
              $scope.available.push(leader);
            });
          }
          _.forEach($scope.currentTeam.member,function(member) {
            if (member.status == 'Active') {
              $scope.available.push(member._id);
            }
          });
          break;
        case 'material' :
          $scope.available = [];
          $scope.available = _.union($scope.available,$scope.currentTeam.leader);
          if ($scope.currentTeam._id == $package.winnerTeam._id._id && $scope.isLeader) {
            _.forEach($package.owner.leader,function(leader) {
              $scope.available.push(leader);
            });
          }
          if ($scope.currentTeam._id == $package.owner._id  && $scope.isLeader) {
            _.forEach($package.winnerTeam._id.leader,function(leader) {
              $scope.available.push(leader);
            });
          }
          _.forEach($scope.currentTeam.member,function(member) {
            if (member.status == 'Active') {
              $scope.available.push(member._id);
            }
          });
          break;
        default :
          break
      }
    };

    $scope.showTasks = function() {
      $scope.currentList = 'tasks';
    };

    $scope.showChats = function() {
      $scope.currentList = 'chats';
    };

    $scope.showDocs = function() {
      $scope.currentList = 'docs';
    };

    $scope.goToDocument = function(value){
      if (value.referenceTo == 'DocumentInProject') {
        $state.go('projects.view', {id: value.element.file.belongTo});
      }
      else {
        if (value.referenceTo == 'DocumentContractorPackage') {
          $state.go('contractors', {id: value.element.file.belongTo});
        }
        else if (value.referenceTo == 'DocumentMaterialPackage') {
          $state.go('materials', {id: value.element.file.belongTo});
        }
        else if (value.referenceTo == 'DocumentStaffPackage') {
          $state.go('staff', {id: value.element.file.belongTo});
        }
        else {
          $state.go('client', {id: value.element.file.belongTo});
        }
      }
    };

    $scope.showTask = function(task) {
      $scope.isShow = true;
      $scope.available = [];
      getAvailableAssignee(task.package,task.type);
      console.log($scope.available);
      _.forEach(task.assignees,function(item) {
        item.canRevoke = (_.find($scope.available,{_id : item._id}));
        _.remove($scope.available,{_id : item._id});
      });
    };

    $scope.editTask = function(task) {
      $scope.isShow = false;
      $scope.task = task;
      console.log($scope.task.assignees.length);
    };


    var messages = document.getElementsByClassName('messages');
    var _index = 0;

    $scope.showChat = function(thread,index) {
      $scope.message = {text : ''};
      _index = index;
      $timeout(function() {
        updateMessage(thread,_index)
      },2000);
      $scope.currentThread = thread;
      notificationService.read({_id : thread._id})
    };

    $scope.$watch('scrollHeight',function(value) {
      if (value)
        $(messages[_index]).scrollTop(value)
    });

    //Assign people to task
    $scope.assign = function(staff,index) {
      staff.canRevoke = true;
      $scope.task.assignees.push(staff);
      console.log($scope.task.assignees.length);
      $scope.available.splice(index,1);
    };

    //Revoke people to task
    $scope.revoke = function(assignee,index) {
      $scope.available.push(assignee);
      $scope.task.assignees.splice(index,1);
    };

    $scope.complete = function(task,index) {
      task.completed = true;
      task.completedBy = $scope.currentUser._id;
      task.completedAt = new Date();

      taskService.update({id : task._id, type : task.type},task).$promise
        .then(function(res) {
          //$('.card-title').trigger('click');
          //updateTasks();
          task.completed = true;
          $timeout(function() {
            $scope.myTasks.splice(index,1);
          },500)

        })
    };

    $scope.saveTask = function(form) {
      if (form.$valid) {
        taskService.update({id : $scope.task._id, type : $scope.task.type},$scope.task).$promise
          .then(function(res) {
            $scope.isShow = true;
          })
      }
    };

    $scope.sendMessage = function(form) {
      $scope.messageFormSubmitted = true;
      if (form.$valid) {
        messageService.sendMessage({id : $scope.currentThread._id, type : $scope.currentThread.type},$scope.message).$promise
          .then(function() {
            //$scope.myThreads[index].messages = res.messages;
            $scope.message.text = '';
            $scope.messageFormSubmitted = false;
          });
      }
    };

    var updateMessage = function(thread) {
      messageService.getOne({id : thread._id, type : thread.type}).$promise
        .then(function(res) {
          thread.messages = res.messages;
          if (thread) {
            $timeout(function() {
              updateMessage(thread)
            },3000);
          }
          if (messages[_index]) {
            $scope.scrollHeight = messages[_index].scrollHeight;
          }
        })
    };
});
