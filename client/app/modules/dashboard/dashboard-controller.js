angular.module('buiiltApp')
  .controller('DashboardCtrl', function($scope,$state, $timeout, $q, userService, $rootScope,myFiles,myTasks,myThreads,taskService,messageService) {
    $scope.currentUser = userService.get();
    $scope.currentProject = $rootScope.currentProject;
    $scope.myTasks = myTasks;
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
      _.forEach(task.assignees,function(item) {
        if (!_.find($scope.available,{_id : item._id})) {
          item.canRevoke = false;
        } else {
          item.canRevoke = true;
        }
        _.remove($scope.available,{_id : item._id});
      });
    };

    $scope.showChat = function(thread) {
      $scope.message = {text : ''};
      $timeout(function() {
        updateMessage(thread)
      },1000);
      $scope.currentThread = thread;
    };

    $scope.$watch('scrollHeight',function(newVal) {
      console.log($('#messages')[0].scrollHeight);
      if (newVal)
        $('#messages').scrollTop($('#messages')[0].scrollHeight)
    });

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

    $scope.sendMessage = function(form) {
      $scope.messageFormSubmitted = true;
      var index = _.findIndex($scope.myThreads,{_id : $scope.currentThread._id})
      if (form.$valid) {
        messageService.sendMessage({id : $scope.currentThread._id, type : $scope.currentThread.type},$scope.message).$promise
          .then(function() {

            //$scope.myThreads[index].messages = res.messages;
            $scope.message.text = '';
            console.log($scope.currentThread);
            console.log($scope.myThreads[1]);
            $scope.messageFormSubmitted = false;
          });
      }
    };

    var updateMessage = function(thread) {
      var index = _.findIndex($scope.myThread,{_id : thread._id});
      messageService.getOne({id : thread._id, type : thread.type}).$promise
        .then(function(res) {
          thread.messages = res.messages;
          $timeout(function() {
            updateMessage(thread)
          },1000)
          $scope.scrollHeight = $('#messages')[0].scrollHeight;
        })

    };
    console.log(myThreads)
});
