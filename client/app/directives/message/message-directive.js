angular.module('buiiltApp')
  .directive('message', function(){
    return {
      restrict: 'A',
      templateUrl: 'app/directives/message/message.html',
      scope:{
        package: '=',
        type : '@'
      },
      controller:
        function($scope,$rootScope,messageService, authService,socket,$timeout,$anchorScroll,$location,filterFilter, $cookieStore, $stateParams, $location , packageService, userService, projectService, FileUploader, documentService) {
          
			//Inline Manual Functions
	  	  $scope.startNewMessageWizard = function() {
	  	  	inline_manual_player.activateTopic('5002', '1');
	  	  };
		  
		  
		  //Init Params
          $scope.activeHover = function($event){
            angular.element($event.currentTarget).addClass("item-hover")
          };
          $scope.removeHover = function($event) {
            angular.element($event.currentTarget).removeClass("item-hover")
          }


          $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 105;

          $scope.messageScreenHeight = $scope.contentHeight - 135;

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

          $scope.backToThreadsList = function(){
            $scope.currentThread = {};
            $("div#threadDetail").hide();
            $("div#threadsList").show("slide", { direction: "left" }, 500);
          };
          $scope.goToThreadDetail = function(thread) {
            messageService.getThread({id : thread._id})
            .$promise.then(function(res){
              $scope.currentThread = res;
              socket.emit('join',res._id);
              _.each($scope.currentThread.messages, function(message){
                if (message.user._id != $scope.currentUser._id) {
                  message.owner = false;
                }
                else {
                  message.owner = true;
                }
              });
              $("div#threadsList").hide();
              $("div#threadDetail").show("slide", { direction: "right" }, 500);
            });
          };

          //Get Available assignee to assign to task
          var getAvailableUser = function(type) {
            switch(type) {
              case 'builder' :
                $scope.available = [];
                $scope.available = _.union($scope.available,$scope.currentTeam.leader);
                if ($scope.currentTeam._id == $scope.package.owner._id && $scope.isLeader) {
                  if ($scope.package.to.team) {
                    _.forEach($scope.package.to.team.leader, function (leader) {
                      $scope.available.push(leader);
                    })
                  }
                }
                if ($scope.package.to.team && $scope.currentTeam._id == $scope.package.to.team._id && $scope.isLeader) {
                  _.forEach($scope.package.owner.leader, function (leader) {
                    $scope.available.push(leader);
                  })
                }
                _.forEach($scope.currentTeam.member,function(member) {
                  if (member.status == 'Active') {
                    $scope.available.push(member._id);
                  }
                });
                _.remove($scope.available,{_id : $scope.currentUser._id});
                break;
              case 'staff' :
                $scope.available =  angular.copy($scope.package.staffs);
                $scope.available = _.union($scope.available,$scope.currentTeam.leader);
                _.remove($scope.available,{_id : $scope.currentUser._id});
                break;
              case 'contractor' :
                $scope.available = [];
                $scope.available = _.union($scope.available,$scope.currentTeam.leader);
                if ($scope.currentTeam._id == $scope.package.winnerTeam._id._id && $scope.isLeader) {
                  _.forEach($scope.package.owner.leader,function(leader) {
                    $scope.available.push(leader);
                  });
                }
                if ($scope.currentTeam._id == $scope.package.owner._id && $scope.isLeader) {
                  _.forEach($scope.package.winnerTeam._id.leader,function(leader) {
                    $scope.available.push(leader);
                  });
                }
                _.forEach($scope.currentTeam.member,function(member) {
                  if (member.status == 'Active') {
                    $scope.available.push(member._id);
                  }
                });
                _.remove($scope.available,{_id : $scope.currentUser._id});
                break;
              case 'material' :
                $scope.available = [];
                $scope.available = _.union($scope.available,$scope.currentTeam.leader);
                if ($scope.currentTeam._id == $scope.package.winnerTeam._id._id && $scope.isLeader) {
                  _.forEach($scope.package.owner.leader,function(leader) {
                    $scope.available.push(leader);
                  });
                }
                if ($scope.currentTeam._id == $scope.package.owner._id  && $scope.isLeader) {
                  _.forEach($scope.package.winnerTeam._id.leader,function(leader) {
                    $scope.available.push(leader);
                  });
                }
                _.forEach($scope.currentTeam.member,function(member) {
                  if (member.status == 'Active') {
                    $scope.available.push(member._id);
                  }
                });
                _.remove($scope.available,{_id : $scope.currentUser._id});
                break;
              case 'variation' :
                $scope.available = [];
                $scope.available = _.union($scope.available,$scope.currentTeam.leader);
                if ($scope.currentTeam._id == $scope.package.to._id._id && $scope.isLeader) {
                  _.forEach($scope.package.owner.leader,function(leader) {
                    $scope.available.push(leader);
                  });
                }
                if ($scope.currentTeam._id == $scope.package.owner._id && $scope.isLeader) {
                  _.forEach($scope.package.to._id.leader,function(leader) {
                    $scope.available.push(leader);
                  });
                }
                _.forEach($scope.currentTeam.member,function(member) {
                  if (member.status == 'Active') {
                    $scope.available.push(member._id);
                  }
                });
                _.remove($scope.available,{_id : $scope.currentUser._id});
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
                  _.each(thread.users, function(user){
                      if (user.team.role == 'admin' || user.team._id.toString() == $rootScope.currentTeam._id.toString()) {
                        thread.isBelongToCurrentTeam = true;
                        return false;
                      }
                      else {
                        thread.isBelongToCurrentTeam = false;
                      }
                    });
                });
                if ($scope.currentThread) {
                  $scope.currentThread = _.find($scope.threads,{_id : $scope.currentThread._id});
                }
              });
          };
          updateThread();

          var getMessage = function() {
            if ($scope.currentThread)
              updateThread();
            //$timeout(getMessage,3000);

          };

          //$timeout(getMessage,3000);

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

            socket.emit('join',thread._id);
          };

          socket.on('message:new', function (thread) {
            $scope.currentThread = thread;
            _.each($scope.currentThread.messages, function(message){
              if (message.user._id != $scope.currentUser._id) {
                message.owner = false;
              }
              else {
                message.owner = true;
              }
            });
            // console.log($scope.scrollHeight = $('#messages')[0].scrollHeight);
          });

          $scope.enterMessage = function ($event) {
            if ($event.keyCode === 13) {
              $event.preventDefault();
              $scope.sendMessage();
            }
          };
          $scope.message = {};
          $scope.sendMessage = function() {
            if ($scope.message.text != '') {
              messageService.sendMessage({id: $scope.currentThread._id, type: $scope.type}, $scope.message).$promise
                .then(function (res) {
                  // _.remove($scope.threads, {_id: res._id});
                  $scope.currentThread = res;
                  _.each($scope.currentThread.messages, function(message){
                    if (message.user._id != $scope.currentUser._id) {
                      message.owner = false;
                    }
                    else {
                      message.owner = true;
                    }
                  });
                  // $scope.threads.push($scope.currentThread);
                  // console.log($scope.threads);
                  // updateThread();
                  $scope.message.text = '';
                });
            }

          };

          $scope.close = function() {
            $scope.submitted = false
          }

          $scope.saveThread = function(form) {
            $scope.submitted = true;
            if (form.$valid) {
              if ($scope.isNew) {
                messageService.create({id: $scope.package._id, type: $scope.type}, $scope.thread).$promise
                  .then(function (res) {
                    $('.card-title').trigger('click');
                    $scope.currentThread = res;
                    socket.emit('join',res._id);
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
