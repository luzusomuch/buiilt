angular.module('buiiltApp')
.controller('ViewProjectCtrl', function($rootScope,$window,$scope, $stateParams, authService,documentService, projectService, project, packageService, fileService,FileUploader,$cookieStore) {
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
  packageService.getPackageByProject({'id': $stateParams.id}).$promise.then(function(data) {
    $scope.builderPackage = data;
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
  var uploader = $scope.uploader = new FileUploader({
      url: 'api/uploads/'+ $stateParams.id + '/file',
      headers : {
        Authorization: 'Bearer ' + $cookieStore.get('token')
      },
      formData: [$scope.formData]
  });
  $scope.getFileId = function(value) {
      var fileId = value._id;
      $scope.formData = {
          fileId: '',
          date: new Date(),
          // album: {},
          title: '',
          // belongTo: {},
          // doc: {},
          desc: '',
          tags: []
          // usersRelatedTo: []
      };

      $scope.safeApply = function (fn) {
          var phase = this.$root.$$phase;
          if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof (fn) === 'function')) {
              fn();
            }
          } else {
            this.$apply(fn);
          }
      };

      

      uploader.onProgressAll = function (progress) {
          $scope.progress = progress;
      };
      uploader.onAfterAddingFile = function (item) {
          //item.file.name = ''; try to change file name
          var reader = new FileReader();

          reader.onload = function (e) {
              item.src = e.target.result;
              $scope.safeApply();
          };

          reader.readAsDataURL(item._file);
      };
      var newPhoto = null;
      uploader.onCompleteItem = function (fileItem, response, status, headers) {
          newPhoto = response;
          // $state.reload();
          fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
              $scope.files = data;
          });
      };

      uploader.onBeforeUploadItem = function (item) {
          $scope.formData._id = fileId;
          $scope.formData.title = value.title;
          // $scope.formData.belongTo = $stateParams.id;
          // $scope.formData.doc = $scope.documentId;
          $scope.formData.desc = value.description;
          $scope.formData.tags = $scope.selectedTags;
          // $scope.formData.usersRelatedTo = item.file.usersRelatedTo || "";
          //angular.forEach(item.file.tags, function (tag) {
          //  $scope.formData.tags.push(tag.text);
          //});
          item.formData.push($scope.formData);
      };

      var hideModalAfterUploading = false;
      $scope.uploadAll = function(){
          hideModalAfterUploading = true;
          uploader.uploadAll();
          Materialize.toast('<p style="width:300px;">Upload in progress</p><div class="progress"><div class="indeterminate"></div></div>',35000);
      };

      uploader.onCompleteAll = function () {
          if(hideModalAfterUploading){
              // $modalInstance.close(newPhoto);
          }
          // $state.reload();
          if ($stateParams.id) {
              fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
                  $scope.files = data;
              });    
          }
          $('.toast').css('opacity','0');
          Materialize.toast('Upload completed',3000);
      };
  };

  $scope.tags = ['architectural','engineering','council','other'];
  $scope.selectedTags = [];
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
    $("div.notShowFileDetail").toggle("slide");
    $("div.showFileDetail").css("display","block");
  };

  $scope.backToList = function(){
    $scope.isShowFileDetail = false;
    $scope.file = {};
    $("div.notShowFileDetail").toggle("slide");
    $("div.notShowFileDetail").css("display","block");
    $("div.showFileDetail").css("display","none");
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

});