angular.module('buiiltApp')
  .controller('StaffCtrl',
  function(messageService,$state,taskService,fileService,$scope, $timeout, $q, authService, $rootScope,staffPackageService,filterFilter,currentTeam,currentUser,staffPackages,socket) {
    //Init Params

    $scope.activeHover = function($event){
        angular.element($event.currentTarget).addClass("item-hover");
    };
    $scope.removeHover = function($event) {
        angular.element($event.currentTarget).removeClass("item-hover");
    };

    $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 130;

    $scope.currentUser = currentUser;
    $scope.currentProject = $rootScope.currentProject;
    $scope.currentTeam =  currentTeam;
    $scope.available = [];
    $scope.isLeader = (_.find(currentTeam.leader,{_id : $scope.currentUser._id})) ? true : false;
    $scope.staffPackages = staffPackages;
    $scope.inProgressTotal = 0;
    $scope.submitted = false;
    $scope.filter = {};
    $scope.filterAll = true;
    
    if (!$scope.isLeader) {
      _.forEach($scope.staffPackages,function(item) {
        item.canSee =  (_.indexOf(item.staffs,$scope.currentUser._id) != -1);
      });
    }

    _.each($scope.staffPackages, function(item) {
        fileService.getFileByPackage({id: item._id, type: 'staff'}).$promise.then(function(files){
          item.files = files;
        });
        taskService.getByPackage({id: item._id, type: 'staff'}).$promise.then(function(tasks){
          item.tasks = tasks;
        });
        messageService.getByPackage({id: item._id, type: 'staff'}).$promise.then(function(threads){
            item.threads = threads;
        });
    });

    // Real time process
    $rootScope.$on('notification:allRead',function(event) {
      _.forEach($scope.staffPackages,function(item) {
        item.__v =  0;
      });
    });

    $scope.$watch('staffPackages',function(value) {
      $scope.inProgressTotal = 0;
      _.forEach(value,function(item) {
        $scope.inProgressTotal += item.__v;
      });
    },true);

    socket.on('notification:new', function (notification) {
      if (notification) {
        console.log(notification);
        var staffPackage = _.find($scope.staffPackages,{_id : notification.element.package});
        if (staffPackage) {
          staffPackage.__v++;
        }
      }
    });

    // End Real time process

    $scope.currentTeam = $rootScope.currentTeam;
    $scope.available = [];
    $scope.package = {
        staffs : [],
        descriptions: []
    };
    $scope.submitted = false;
    var getAvailableAssign =  function() {
        if ($scope.currentTeam) {
            _.forEach($scope.currentTeam.member, function(member) {
                if (member.status == 'Active') {
                    $scope.available.push(member._id);
                }
            });
        }
    };

    getAvailableAssign();

    $scope.addDescription = function(description) {
        if (description) {
            $scope.package.descriptions.push(description);
            $scope.description = '';
        }
    };

    $scope.removeDescription = function(index) {
        $scope.package.descriptions.splice(index,1);
        $scope.description = '';
    };

    $scope.staffAssign = function(staff,index) {
        $scope.package.staffs.push(staff);
        $scope.available.splice(index,1);
    };

    $scope.staffRevoke = function(assignee,index) {
        $scope.available.push(assignee);
        $scope.package.staffs.splice(index,1);
    };



    $scope.save = function(form) {
        $scope.submitted = true;
        $scope.$watchGroup(['package.descriptions.length','submitted'],function(value) {
            $scope.descriptionError = (value[0] <= 0 && value[1]);
        });

        $scope.$watchGroup(['package.staffs.length','submitted'],function(value) {
            $scope.assgineesError = (value[0] <= 0 && value[1]);

        });
        if (form.$valid && !$scope.assgineesError && !$scope.descriptionError ) {
            staffPackageService.create({id : $scope.currentProject._id},$scope.package).$promise
                .then(function(res) {
                $state.go('staff.view',{id : res.project, packageId : res._id});
              //$scope.staffPackages.push(res);
              //$scope.package = {
              //  staffs : [],
              //  descriptions: []
              //};
              //$scope.available = [];
              //$scope.submitted = false;
              //getAvailableAssign();
                $('#newWorkPackage').closeModal();
            });
        }
    };

    $scope.goToStaffPacakgeDetail = function(staffPackage) {
        $state.go("staff.view",{packageId : staffPackage._id});
    };

    //Get available user to assign to staff package
    //var getAvailableAssign =  function() {
    //  _.forEach($scope.currentTeam.member, function(member) {
    //    if (member.status == 'Active') {
    //      $scope.available.push(member._id);
    //    }
    //  });
    //  // console.log($scope.available)
    //  // console.log($scope.currentUser._id)
    //  // _.remove($scope.available,{_id : $scope.currentUser._id});
    //};
    //
    //
    //if (!$scope.isLeader) {
    //  _.forEach($scope.staffPackages,function(item) {
    //    item.canSee =  (_.indexOf(item.staffs,$scope.currentUser._id) != -1);
    //  })
    //}
    //
    //getAvailableAssign();
    //
    //$scope.addDescription = function(description) {
    //  if (description) {
    //    $scope.package.descriptions.push(description);
    //    $scope.description = '';
    //  }
    //};
    //
    //$scope.removeDescription = function(index) {
    //  $scope.package.descriptions.splice(index,1);
    //  $scope.description = '';
    //};
    //
    ////Assign people to package
    //$scope.assign = function(staff,index) {
    //  $scope.package.staffs.push(staff);
    //  $scope.available.splice(index,1);
    //};
    //
    ////Revoke people to package
    //$scope.revoke = function(assignee,index) {
    //  $scope.available.push(assignee);
    //  $scope.package.staffs.splice(index,1);
    //};
    //
    //$scope.$watchGroup(['package.descriptions.length','submitted'],function(value) {
    //  if (value[0] <= 0 && value[1])
    //    $scope.descriptionError = true;
    //  else
    //    $scope.descriptionError = false;
    //});
    //
    //$scope.$watchGroup(['package.staffs.length','submitted'],function(value) {
    //  if (value[0] <= 0 && value[1])
    //    $scope.assgineesError = true;
    //  else
    //    $scope.assgineesError = false;
    //});
    //
    //
    //$scope.save = function(form) {
    //  $scope.submitted = true;
    //  if (form.$valid && !$scope.assgineesError && !$scope.descriptionError ) {
    //    staffPackageService.create({id : $scope.currentProject._id},$scope.package).$promise
    //      .then(function(res) {
    //        $scope.staffPackages.push(res);
    //        $scope.package = {
    //          staffs : [],
    //          descriptions: []
    //        };
    //        $scope.submitted = false;
    //        getAvailableAssign();
    //        $('#newWorkPackage').closeModal();
    //      })
    //  }
    //}


})
  .controller('StaffViewCtrl',
    function($scope, $rootScope,filterFilter,currentTeam,staffPackage,staffPackageService,currentUser,notificationService) {
      $scope.staffPackage = staffPackage;
      $scope.currentUser = currentUser;
      notificationService.markReadByPackage({_id : staffPackage._id}).$promise
        .then(function(res) {
        });
      $scope.complete = function() {
        staffPackageService.complete({_id : $scope.staffPackage._id}).$promise
          .then(function(res) {
            $scope.staffPackage = res;
            $('#modal_complete').closeModal();
          });
      };
  });
