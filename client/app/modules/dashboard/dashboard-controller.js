angular.module('buiiltApp')
  .controller('DashboardCtrl', function($scope,$state, socket, $q, userService,$timeout, $rootScope,myFiles,myTasks,myThreads,authService,taskService,messageService,notificationService) {
    $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 130;
    
    $scope.currentProject = $rootScope.currentProject;
    $scope.myTasks = myTasks;
    authService.getCurrentUser().$promise.then(function(res) {
      $scope.currentUser = res;
    });
    // $scope.currentUser = $rootScope.currentUser;
    _.forEach($scope.myTasks,function(task) {
      task.dateEnd = (task.dateEnd) ? new Date(task.dateEnd) : null;
    });
    $scope.myThreads = myThreads;
    $scope.myFiles = myFiles;
    $scope.currentList = 'tasks';
    $scope.currentThread = {};


    $scope.activeHover = function($event){
        angular.element($event.currentTarget).addClass("item-hover");
    };
    $scope.removeHover = function($event) {
        angular.element($event.currentTarget).removeClass("item-hover");
    };

    $scope.backToDocumentsList = function(){
      $scope.document = {};
      $("div.ui-effects-wrapper").hide();
      $("div.documentDetail").hide();
      $("div.documentsList").show("slide", { direction: "left" }, 500);
    };
    $scope.goToDocumentDetail = function(document) {
      $scope.document = document;
      $("div.documentsList").hide();
      $("div.documentDetail").show("slide", { direction: "right" }, 500);
    };

    $scope.backToThreadsList = function(){
      $scope.currentThread = {};
      $("div.ui-effects-wrapper").hide();
      $("div#threadDetail").hide();
      $("div#threadsList").show("slide", { direction: "left" }, 500);
    };
    $scope.goToThreadDetail = function(thread) {
      $scope.currentThread = thread;
      _.each(thread.messages, function(message){
        if (message.user._id != $scope.currentUser._id) {
          $scope.backgroundColor = {'background-color':'#eee'};
        }
        else {
          $scope.backgroundColor = {'background-color':'#BBDEFB'};
        }
      });
      $("div#threadsList").hide();
      $("div#threadDetail").show("slide", { direction: "right" }, 500);
    };

    var getAvailableAssignee = function($package,type) {
      switch(type) {
        case 'builder' :
          $scope.available = [];
          $scope.available = _.union($scope.available,$scope.currentTeam.leader);
          if ($scope.currentTeam._id == $package.owner._id && $scope.isLeader) {
            if ($package.to.team) {
              _.forEach($package.to.team.leader, function (leader) {
                $scope.available.push(leader);
              });
            }
          }
          if ($package.to.team && $scope.currentTeam._id == $package.to.team._id && $scope.isLeader) {
            _.forEach($package.owner.leader, function (leader) {
              $scope.available.push(leader);
            });
          }
          _.forEach($scope.currentTeam.member,function(member) {
            if (member.status == 'Active') {
              $scope.available.push(member._id);
            }
          });
          break;
        case 'staff' :
          $scope.available =  angular.copy($package.staffs);
          console.log($package);
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

    $scope.downloadFile = function(value){
      notificationService.readDocumentDashboard({_id : value._id});
    };

    $scope.goToDocument = function(value){
      notificationService.readDocumentDashboard({_id : value._id});
      if (value.referenceTo == 'DocumentInProject') {
        $state.go('projects.view', {id: value.element.file.belongTo});
      }
      else {
        if (value.referenceTo == 'DocumentContractorPackage') {
          $state.go('contractorRequest.contractorPackageInProcess', {id: value.element.projectId, packageId: value.element.uploadIn._id});
        }
        else if (value.referenceTo == 'DocumentMaterialPackage') {
          $state.go('materialRequest.materialPackageInProcess', {id: value.element.projectId, packageId: value.element.uploadIn._id});
        }
        else if (value.referenceTo == 'DocumentStaffPackage') {
          $state.go('staff.view', {id: value.element.projectId, packageId: value.element.uploadIn._id});
        }
        else if (value.referenceTo == 'DocumentVariation') {
          $state.go('variationRequest.inProcess', {id: value.element.projectId, variationId: value.element.uploadIn._id});
        }
        else if (value.referenceTo == 'DocumentBuilderPackage') {
          $state.go('client.view', {id: value.element.projectId});
        }
      }
    };

    $scope.showDetailOfTask = false;
    $scope.showTask = function(task) {
      $scope.task = task;
      $scope.showDetailOfTask = true;
      $scope.isShow = true;
      $scope.available = [];
      getAvailableAssignee(task.package,task.type);
      _.forEach(task.assignees,function(item) {
        item.canRevoke = (_.find($scope.available,{_id : item._id}));
        _.remove($scope.available,{_id : item._id});
      });
    };

    $scope.backToTaskList = function(){
      $scope.task = {};
      $scope.showDetailOfTask = false;
      $("div.ui-effects-wrapper").hide();
    };

    $scope.editTask = function(task) {
      $scope.isShow = false;
      $scope.task = task;
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



    $scope.showChat = function(thread,index) {
      $scope.message = {text : ''};
      $scope.currentThread = thread;
      $scope.index = index;
      socket.emit('join',thread._id);
      notificationService.read({_id : thread._id});
    };

    socket.on('message:new', function (thread) {
      $scope.currentThread = thread;
      $scope.$apply();
    });


    //Assign people to task
    $scope.assign = function(staff,index) {
      staff.canRevoke = true;
      $scope.task.assignees.push(staff);
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
          },500);

        });
    };

    $scope.saveTask = function(form) {
      if (form.$valid) {
        taskService.update({id : $scope.task._id, type : $scope.task.type},$scope.task).$promise
          .then(function(res) {
            $scope.isShow = true;
          });
      }
    };

    $scope.enterMessage = function ($event) {
      if ($event.keyCode === 13) {
        $event.preventDefault();
        $scope.sendMessage();
      }
    };

    $scope.sendMessage = function() {
      $scope.messageFormSubmitted = true;
      if ($scope.message.text != '') {
        messageService.sendMessage({id : $scope.currentThread._id, type : $scope.currentThread.type},$scope.message).$promise
          .then(function(res) {
            console.log(res);
            $scope.currentThread = res;
            //$scope.myThreads[index].messages = res.messages;
            $scope.message.text = '';
            $scope.messageFormSubmitted = false;
          });
      }
    };
});
