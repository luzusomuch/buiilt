angular.module('buiiltApp')
  .controller('StaffCtrl',
  function($scope, $timeout, $q, authService, $rootScope,staffPackageService,filterFilter,currentTeam,currentUser,staffPackages) {
    //Init Params
    $scope.currentUser = currentUser;
    $scope.currentProject = $rootScope.currentProject;
    $scope.currentTeam =  currentTeam;
    $scope.isLeader = (_.find(currentTeam.leader,{_id : $scope.currentUser._id})) ? true : false;
    $scope.staffPackages = staffPackages;$scope.package = {
      staffs : []
    };
    $scope.submitted = false;
    $scope.package.descriptions = [];

    //Get available user to assign to staff package
    $scope.available =  angular.copy(currentTeam.leader);
    _.forEach($scope.currentTeam.member, function(member) {
      if (member.status == 'Active') {
        $scope.available.push(member._id);
      }
    });
    _.remove($scope.available,{_id : $scope.currentUser._id});

    if (!$scope.isLeader) {
      _.forEach($scope.staffPackages,function(item) {
        if (_.indexOf(item.staffs,$scope.currentUser._id) != -1) {
          item.canSee = true;
        } else {
          item.canSee = false
        }

      })
    }

    $scope.addDescription = function(description) {
      $scope.package.descriptions.push(description);
      $scope.description = '';
    };

    $scope.removeDescription = function(index) {
      $scope.package.descriptions.splice(index,1);
      $scope.description = '';
    };

    //Assign people to package
    $scope.assign = function(staff,index) {
      $scope.package.staffs.push(staff);
      $scope.available.splice(index,1);
    };

    //Revoke people to package
    $scope.revoke = function(assignee,index) {
      $scope.available.push(assignee);
      $scope.package.staffs.splice(index,1);
    };

    $scope.$watchGroup(['package.descriptions.length','submitted'],function(value) {
      if (value[0] <= 0 && value[1])
        $scope.descriptionError = true;
      else
        $scope.descriptionError = false;
    });

    $scope.$watchGroup(['package.staffs.length','submitted'],function(value) {
      if (value[0] <= 0 && value[1])
        $scope.assgineesError = true;
      else
        $scope.assgineesError = false;
    });


    $scope.save = function(form) {
      $scope.submitted = true;
      if (form.$valid && !$scope.assgineesError && !$scope.descriptionError ) {
        if ($scope.package.staffs.length <= 0) {
          alert("Make sure you have assign package to staff");
          return;
        }
        staffPackageService.create({id : $scope.currentProject._id},$scope.package).$promise
          .then(function(res) {
            $scope.staffPackages.push(res);
            $scope.package = {};
            $scope.submitted = false;
            $('#newWorkPackage').closeModal();
          })
      }
    }
})
  .controller('StaffViewCtrl',
    function($scope, $rootScope,filterFilter,currentTeam,staffPackage,currentUser) {
      $scope.staffPackage = staffPackage;
      $scope.currentUser = currentUser;
  });
