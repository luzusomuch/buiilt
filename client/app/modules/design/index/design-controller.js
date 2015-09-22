angular.module('buiiltApp')
  .controller('DesignCtrl',
  function(messageService,$state,taskService,fileService,$scope, $timeout, $q, authService, $rootScope,designService,filterFilter,currentTeam,currentUser,designs,socket, builderPackage) {

    $scope.activeHover = function($event){
        angular.element($event.currentTarget).addClass("item-hover")
    };
    $scope.removeHover = function($event) {
        angular.element($event.currentTarget).removeClass("item-hover")
    }

    $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 130;

    $scope.currentUser = currentUser;
    $scope.currentProject = $rootScope.currentProject;
    $scope.currentTeam =  currentTeam;
    $scope.available = [];
    $scope.isLeader = (_.find(currentTeam.leader,{_id : $scope.currentUser._id})) ? true : false;
    $scope.designs = designs;
    $scope.inProgressTotal = 0;
    $scope.submitted = false;
    $scope.filter = {};
    $scope.filterAll = true;
    
    if (!$scope.isLeader) {
      _.forEach($scope.designs,function(item) {
        item.canSee =  (_.indexOf(item.staffs,$scope.currentUser._id) != -1);
      });
    }

    _.each($scope.designs, function(item) {
        fileService.getFileByPackage({id: item._id, type: 'design'}).$promise.then(function(files){
          item.files = files;
        });
        taskService.getByPackage({id: item._id, type: 'design'}).$promise.then(function(tasks){
          item.tasks = tasks;
        });
        messageService.getByPackage({id: item._id, type: 'design'}).$promise.then(function(threads){
            item.threads = threads;
        })
    });

    // Real time process
    $rootScope.$on('notification:allRead',function(event) {
      _.forEach($scope.designs,function(item) {
        item.__v =  0;
      })
    });

    $scope.$watch('designs',function(value) {
      $scope.inProgressTotal = 0;
      _.forEach(value,function(item) {
        $scope.inProgressTotal += item.__v
      });
    },true);

    socket.on('notification:new', function (notification) {
      if (notification) {
        var staffPackage = _.find($scope.designs,{_id : notification.element.package});
        if (staffPackage) {
          staffPackage.__v++;
        }
      }
    });

    // End Real time process

    $scope.currentTeam = $rootScope.currentTeam;
    $scope.available = [];
    $scope.design = {
        staffs : [],
        descriptions: []
    };
    $scope.submitted = false;
    var getAvailableAssign =  function() {
        // if ($scope.currentTeam) {
        //     _.forEach($scope.currentTeam.member, function(member) {
        //         if (member.status == 'Active') {
        //             $scope.available.push(member._id);
        //         }
        //     });
        // }
        // console.log(builderPackage);
        $scope.available = builderPackage.owner.leader;
        var availableEachTeam = [];
        if (builderPackage.owner.member.length > 0) {
            _.each(builderPackage.owner.member, function(member){
                if (member.status == 'Active') {
                    $scope.available.push(member._id);
                }
            });
        }
        if (builderPackage.to) {
            _.each(builderPackage.to.team.leader, function(leader){
                availableEachTeam.push(leader);
            });
            if (builderPackage.to.team.member.length > 0) {
                _.each(builderPackage.to.team.member, function(member){
                    if (member._id || member.status == 'Active') {
                        availableEachTeam.push(member._id);
                    }
                });
            }
            $scope.available = _.union($scope.available, availableEachTeam);
        }
        if (builderPackage.winner) {
            _.each(builderPackage.winner.leader, function(leader) {
                availableEachTeam.push(leader);
            });
            if (builderPackage.winner.member.length > 0) {
                _.each(builderPackage.winner.member, function(member) {
                    availableEachTeam.push(member)
                });
            }
            $scope.available = _.union($scope.available, availableEachTeam);
        }
        if (builderPackage.architect.team._id) {
            _.each(builderPackage.architect.team.leader, function(leader) {
                availableEachTeam.push(leader);
            });
            if (builderPackage.architect.team.member.length > 0) {
                _.each(builderPackage.architect.team.member, function(member) {
                    availableEachTeam.push(member)
                });
            }
            $scope.available = _.union($scope.available, availableEachTeam);
        }
        console.log($scope.available);
    };

    getAvailableAssign();

    $scope.addDescription = function(description) {
        if (description) {
            $scope.design.descriptions.push(description);
            $scope.description = '';
        }
    };

    $scope.removeDescription = function(index) {
        $scope.design.descriptions.splice(index,1);
        $scope.description = '';
    };

    $scope.staffAssign = function(staff,index) {
        $scope.design.staffs.push(staff);
        $scope.available.splice(index,1);
    };

    $scope.staffRevoke = function(assignee,index) {
        $scope.available.push(assignee);
        $scope.design.staffs.splice(index,1);
    };

    $scope.goToDesignDetail = function(item) {
        $state.go("design.detail",{id: item.project,packageId : item._id});
    };

    $scope.createDesign = function(form) {
        $scope.submitted = true;
        $scope.$watchGroup(['design.descriptions.length','submitted'],function(value) {
            $scope.descriptionError = (value[0] <= 0 && value[1]);
        });

        $scope.$watchGroup(['design.staffs.length','submitted'],function(value) {
            $scope.assgineesError = (value[0] <= 0 && value[1]);

        });
        if (form.$valid && !$scope.assgineesError && !$scope.descriptionError ) {
            designService.create({id : $scope.currentProject._id},$scope.design).$promise
                .then(function(res) {
                $state.go('design.detail',{id : res.project, packageId : res._id});
                $('#newDesign').closeModal();
            })
        }
    };
})

