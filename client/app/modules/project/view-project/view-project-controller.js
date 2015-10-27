angular.module('buiiltApp')
.controller('ViewProjectCtrl', function($timeout,builderPackage,$rootScope,$window,$scope, $stateParams, authService,documentService, projectService, project, packageService, fileService,FileUploader,$cookieStore, filepickerService,uploadService, $state) {
  $scope.builderPackage = builderPackage;
  $scope.activeHover = function($event){
    angular.element($event.currentTarget).addClass("item-hover");
  };
  $scope.removeHover = function($event) {
    angular.element($event.currentTarget).removeClass("item-hover");
  };

  $scope.errors = {};
  //content height
  $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 130;
  
  $scope.project=project;
  $scope.docum = {};
  authService.getCurrentTeam().$promise.then(function(team){
    $scope.currentTeam = team;
    authService.getCurrentUser().$promise.then(function(user){
      $scope.isLeader = (_.find(team.leader,{_id : user._id})) ? true : false;
    });
  });
  authService.getCurrentUser().$promise.then(function(data){
    $scope.currentUser = data;
    fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
      $scope.files = data;
      _.each($scope.files, function(file){
        file.totalLike = file.usersInterestedIn.length;
        if (_.find(file.usersInterestedIn,{_id: $scope.currentUser._id})) {
            file.isInterested = true;
        }
        else {
            file.isInterested = false;
        }
        file.isArchitectural = false;
        file.isEngineering = false;
        file.isCouncil = false;
        file.isOther = false;
        _.each(file.tags, function(tag){
          if (tag == 'architectural') {
            file.isArchitectural = true;
          }
          else if (tag == 'engineering') {
            file.isEngineering = true;
          }
          else if (tag == 'council') {
            file.isCouncil = true;
          }
          else if (tag == 'other') {
            file.isOther = true;
          }
        });
      });
    });
  });


  $scope.closeAlert = function (key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function () {
    $scope.success = false;
  };

  $scope.hasFilter = false;
  $scope.filter = function(value){
    if (value == 'all') {
      $scope.hasFilter = false;
      $scope.filterValue = {};
    }
    else if (value == 'architectural') {
      $scope.hasFilter = true;
      $scope.filterValue = {isArchitectural: true};
    }
    else if (value == 'engineering') {
      $scope.hasFilter = true;
      $scope.filterValue = {isEngineering: true};
    }
    else if (value == 'council') {
      $scope.hasFilter = true;
      $scope.filterValue = {isCouncil: true};
    }
    else if (value == 'other') {
      $scope.hasFilter = true;
      $scope.filterValue = {isOther: true};
    }
  };

  //upload reversion
  $scope.uploadFile = {};
  $scope.selectedTags = [];
  $scope.tags = ['architectural','engineering','council','other'];
  $scope.getUploadReversionFile = function(file) {
    $scope.uploadReversionFile = file;
    $scope.selectedTags = $scope.uploadReversionFile.tags;
    _.each($scope.selectedTags, function(selectedTag){
      _.each($scope.tags, function(tag, key){
        if (selectedTag == tag) {
          $scope.tags.splice(key,1);
        }
      });
    });
    $scope.$watch('uploadReversionFile.title', function(value){
      $scope.uploadFile.title = value;
    });
    $scope.$watch('uploadReversionFile.description', function(value){
      $scope.uploadFile.desc = value;
    });
  };

  $scope.pickFile = pickFile;

  $scope.onSuccess = onSuccess;

  function pickFile(){
    filepickerService.pick(
      {mimetype: 'image/*'},
      onSuccess
    );
  };

  function onSuccess(file){
    $scope.uploadFile = {
      file: file,
      _id: ($scope.uploadReversionFile) ? $scope.uploadReversionFile._id : '',
      belongToType: ($scope.package) ? $scope.package.type : 'project',
      tags: $scope.selectedTags,
      isQuote: $scope.isQuote,
      title: '',
      desc: ''
    };
  };

  $scope.uploadReversionDocument = function() {
    uploadService.upload({id: $stateParams.id, file: $scope.uploadFile}).$promise.then(function(res){
      $('#uploadReversion').closeModal();
      $rootScope.newestDocument = res;
      $state.reload();
    });
  };
  
  $scope.selectTag = function(tag, index) {
    $scope.selectedTags.push(tag);
    $scope.tags.splice(index,1);
  };

  $scope.deselect = function(tag, index) {
    $scope.tags.push(tag);
    $scope.selectedTags.splice(index,1);
  };

  //File detail
  $("div.showFileDetail").css("display","none");
  $scope.file = {};
  $scope.isShowFileDetail = false;
  $scope.getFileDetail = function(file){
    $scope.isShowFileDetail = true;
    $scope.file = file;
    $("div.notShowFileDetail").hide();
    $("div.showFileDetail").show("slide", { direction: "right" }, 500);
    $rootScope.newestDocument = null;
  };

  // $("a."+$scope.file._id).colorbox({rel: '$scope.file._id'});

  $scope.backToList = function(){
    $scope.isShowFileDetail = false;
    $scope.file = {};
    $("div.showFileDetail").hide();
    $("div.notShowFileDetail").show("slide", { direction: "left" }, 500);
  };

  $scope.likeDocument = function(value) {
    fileService.interested({'id': value._id, isInterested: value.isInterested}).$promise.then(function(data) {
     value.isInterested = !value.isInterested;
     if (value.isInterested) {
      value.totalLike = value.totalLike +1;
     }
     else {
      value.totalLike = value.totalLike -1;
     }
    });
  };

  if ($rootScope.newestDocument != null) {
    $timeout(function(){$scope.getFileDetail($rootScope.newestDocument)},1500);
  }
});