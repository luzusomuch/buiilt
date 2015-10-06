'use strict';
angular.module('buiiltApp').directive('addon', function(){
  return {
    restrict: 'EA',
    templateUrl: 'app/directives/addOn/addOn.html',
    scope: {
      package: '=',
      type: '@'
    },
    controller: function($timeout,filterFilter,taskService,$rootScope,$scope, $state,$window, $stateParams, authService,addOnPackageService, FileUploader, $cookieStore, fileService, contractorRequestService, materialRequestService, variationRequestService) {

			//Inline Manual Functions
      $scope.startNewTaskWizard = function() {
        inline_manual_player.activateTopic('4981', '1');
      };
      $scope.startNewDocumentWizard = function() {
        inline_manual_player.activateTopic('5003', '1');
      };
      $scope.startNewVariationWizard = function() {
        inline_manual_player.activateTopic('4969', '1');
      };

      $scope.activeHover = function($event){
        angular.element($event.currentTarget).addClass("item-hover");
      };
      $scope.removeHover = function($event) {
        angular.element($event.currentTarget).removeClass("item-hover");
      }

      $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 130;

      $scope.allItemsText = 'OVERVIEW';

      $scope.currentProject = $rootScope.currentProject;
      authService.getCurrentUser().$promise.then(function(res) {
        $scope.currentUser = res;
        $scope.isStaff = (_.find($scope.package.staffs,{_id: res._id})) ? true: false;

        authService.getCurrentTeam().$promise.then(function(res) {
          $scope.currentTeam = res;
          $scope.isLeader = (_.find($scope.currentTeam.leader,{_id : $scope.currentUser._id})) ? true : false;
          getAvailableAssignee($scope.type);
          updateTasks();

        });
      });

      $scope.isNew = true;
      $scope.filter = 'all';
      $scope.customFilter = {};
      $scope.documentFilter = {
        isShowAll : true
      };
            //Get Available assignee to assign to task
            var getAvailableAssignee = function(type) {
              switch(type) {
                case 'builder' :
                $scope.available = [];
                var tempAvailable = [];
                $scope.available = _.union($scope.available,$scope.currentTeam.leader);
                if ($scope.currentTeam._id != $scope.package.owner._id && $scope.isLeader) {
                  _.each($scope.package.owner.leader, function(leader){
                    tempAvailable.push(leader);
                  });
                  $scope.available = _.union($scope.available, tempAvailable);
                }
                if ($scope.package.to.team) {
                  if ($scope.package.to.team._id != $scope.currentTeam._id && $scope.isLeader) {
                    _.forEach($scope.package.to.team.leader, function (leader) {
                      tempAvailable.push(leader);
                    });
                    $scope.available = _.union($scope.available, tempAvailable);
                  }
                }
                if ($scope.package.architect.team) {
                  if ($scope.package.architect.team._id != $scope.currentTeam._id && $scope.isLeader) {
                    _.each($scope.package.architect.team.leader, function(leader){
                      tempAvailable.push(leader);
                    });
                    $scope.available = _.union($scope.available, tempAvailable);
                  }
                }
                if ($scope.package.winner) {
                  if ($scope.package.winner._id != $scope.currentTeam._id && $scope.package.winner._id != $scope.package.owner._id) {
                    _.each($scope.package.winner.leader, function(leader){
                      tempAvailable.push(leader);
                    });
                    $scope.available = _.union($scope.available, tempAvailable);
                  }
                }
                _.forEach($scope.currentTeam.member,function(member) {
                  if (member.status == 'Active') {
                    $scope.available.push(member._id);
                  }
                });
                $scope.available = _.uniq($scope.available, '_id');
                break;
                case 'staff' :
                $scope.available =  angular.copy($scope.package.staffs);
                $scope.available = _.union($scope.available,$scope.currentTeam.leader);
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
                break;
                case 'design':
                  $scope.available = [];
                  $scope.available = angular.copy($scope.package.invitees);
                  $scope.available = _.union($scope.available, $scope.currentTeam.leader);
                  break;
                default :
                break
              }
            };



            //Update Task List
            var updateTasks = function() {
              taskService.get({id : $scope.package._id, type : $scope.type}).$promise
              .then(function(res) {
                $scope.tasks = res;
                _.forEach($scope.tasks,function(task) {
                  task.isOwner = (_.findIndex(task.assignees,{_id : $scope.currentUser._id}) != -1) || (task.user == $scope.currentUser._id);
                  task.dateEnd = (task.dateEnd) ? new Date(task.dateEnd) : null;
                  _.each(task.assignees, function(assignee){
                    if (task.user == $scope.currentUser._id || (assignee.team.role == 'admin' && assignee.team._id == $scope.currentTeam._id) || assignee.team._id.toString() == $scope.currentTeam._id.toString()) {
                      task.isBelongToCurrentTeam = true;
                      return false;
                    }
                    else {
                      task.isBelongToCurrentTeam = false;
                    }
                  });
                });
              });
            };


            //Function fired when click new task
            $scope.newTask = function() {
              $scope.task = {
                assignees : []
              };
              getAvailableAssignee($scope.type);
              $scope.isNew = true;
              $scope.isShow = false;
            };

            $scope.showTask = function(task) {
              $scope.task = angular.copy(task);
              getAvailableAssignee($scope.type);
              _.forEach($scope.task.assignees,function(item) {
                if (!_.find($scope.available,{_id : item._id})) {
                  item.canRevoke = false;
                } else {
                  item.canRevoke = true;
                }
                _.remove($scope.available,{_id : item._id});
              });
              $scope.isShow = true;
            };

            //Function fired when click edit task
            $scope.editTask = function(task) {
              $scope.task = angular.copy(task);
              getAvailableAssignee($scope.type);
              _.forEach($scope.task.assignees,function(item) {
                if (!_.find($scope.available,{_id : item._id})) {
                  item.canRevoke = false;
                } else {
                  item.canRevoke = true;
                }
                _.remove($scope.available,{_id : item._id});
              });
              $scope.isNew = false;
              $scope.isShow = false;

            };

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
                });
            };

            //Submit form function
            $scope.save = function(form) {
              if (form.$valid) {
                if ($scope.isNew) {
                  taskService.create({id : $scope.package._id, type : $scope.type},$scope.task).$promise
                  .then(function(res) {
                    $('.card-title').trigger('click');
                    $scope.showTasks();
                    $scope.showTaskDetail(res);
                    updateTasks();
                  });
                } else {
                  taskService.update({id : $scope.task._id, type : $scope.type},$scope.task).$promise
                  .then(function(res) {
                    $('.card-title').trigger('click');
                    $scope.showTasks();
                    $scope.showTaskDetail(res);
                    updateTasks();
                  });
                }

              }
            };

            //tasks list and task detail
            $scope.showListTasks = true;
            $scope.showDetailOfTask = false;
            $scope.showTaskDetail = function(task){
              $scope.task = task;
              $scope.showListTasks = false;
              $scope.showDetailOfTask = true;
            };
            $scope.backToTaskList = function() {
              $scope.task = {};
              $scope.showListTasks = true;
              $scope.showDetailOfTask = false;
            };

            $scope.documents = [];
            fileService.getFileByStateParam({'id': $scope.package._id})
            .$promise.then(function(data) {
              $scope.documents = data;
              _.each($scope.documents, function(item) {
                item.isQuote = false;
                item.isInvoice = false;
                item.isDesign = false;
                item.isSpec = false;
                item.isOther = false;
                item.isShowAll = true;
                _.each(item.tags, function(tag){
                  if (tag == 'quote') {
                    item.isQuote = true;
                  }
                  else if (tag == 'invoice') {
                    item.isInvoice = true;
                  }
                  else if (tag == 'design') {
                    item.isDesign = true;
                  }
                  else if (tag == 'spec') {
                    item.isSpec = true;
                  }
                  else if (tag == 'other') {
                    item.isOther = true;
                  }
                });
              });
            });

            //documents list and document detail
            $scope.backToDocumentsList = function(){
              $scope.document = {};
              $("div.documentDetail").hide();
              $("div.documentsList").show("slide", { direction: "left" }, 500);
            };
            $scope.goToDocumentDetail = function(document) {
              $scope.document = document;
              $("div.documentsList").hide();
              $("div.documentDetail").show("slide", { direction: "right" }, 500);
              $rootScope.newestDocument = null;
            };

            $("a."+$scope.package._id).colorbox({rel:'group1'});

            $scope.isShowOverView = true;
            $scope.isShowTasks = false;
            $scope.isShowVariations = false;
            $scope.isShowDocuments = false;

            $scope.showOverView = function() {
              $scope.allItemsText = 'OVERVIEW';
              $scope.isShowOverView = true;
              $scope.isShowTasks = false;
              $scope.isShowVariations = false;
              $scope.isShowDocuments = false;
            };
            $scope.showDocuments = function() {
              $scope.documents = $scope.documents;
              $scope.allItemsText = 'DOCUMENTS';
              $scope.isShowOverView = false;
              $scope.isShowTasks = false;
              $scope.isShowVariations = false;
              $scope.isShowDocuments = true;
            };

            $scope.showVariations = function() {
              $scope.package = $scope.package;
              $scope.allItemsText = 'VARIATION';
              $scope.isShowOverView = false;
              $scope.isShowTasks = false;
              $scope.isShowVariations = true;
              $scope.isShowDocuments = false;
            };
            $scope.showTasks = function() {
              $scope.tasks = $scope.tasks;
              $scope.allItemsText = "TASKS"
              $scope.isShowOverView = false;
              $scope.isShowTasks = true;
              $scope.isShowVariations = false;
              $scope.isShowDocuments = false;
            };

            $scope.showDefects = function() {
              $scope.data = $scope.package;
              $scope.allItemsText = 'Defects';
            };

            $scope.showInvoices = function() {
              $scope.data = $scope.package;
              $scope.allItemsText = 'Invoices';
            };

            $scope.downloadFile = function(value) {
              fileService.downloadFile({id: value})
              .$promise.then(function(data){
                $window.open(data.url);
              });
            };

            if ($rootScope.newestDocument != null) {
              $timeout(function(){$scope.showDocuments();},500);
              $timeout(function(){$scope.goToDocumentDetail($rootScope.newestDocument)},1500);
            }

            $scope.goToVariation = function(value) {
              variationRequestService.findOne({id: value._id}).$promise.then(function(data){
                if ($scope.type == 'builder') {
                  if (!data.to.isSelect) {
                    if ($scope.currentTeam.type == 'builder') {
                      $state.go('variationRequest.sendQuote',{id: data.project,variationId: data._id});
                    }
                    else {
                      $state.go('variationRequest.viewRequest',{id: data.project,variationId: data._id});
                    }
                  }
                  else {
                    $state.go('variationRequest.inProcess',{id: data.project,variationId: data._id});
                  }
                }
                else {
                  if (!data.to.isSelect) {
                    if ($scope.currentTeam.type == 'builder') {
                      $state.go('variationRequest.viewRequest',{id: data.project,variationId: data._id});
                    }
                    else {
                      $state.go('variationRequest.sendQuote',{id: data.project,variationId: data._id});
                    }
                  }
                  else {
                    $state.go('variationRequest.inProcess',{id: data.project,variationId: data._id});
                  }
                }
              });
            };

            //send variation
            $scope.variation = {
              descriptions: []
            };
            $scope.quoteLater = true;
            $scope.addDescription = function(description){
              if (description) {
                $scope.variation.descriptions.push(description);
                $scope.description = '';
              }
            };
            $scope.removeDescription = function(index){
              $scope.variation.descriptions.splice(index,1);
            };
            $scope.$watchGroup(['variation.descriptions.length','submitted'],function(value) {
              $scope.descriptionError = (value[0] <= 0 && value[1]);
            });
            $scope.sendVariation = function() {
              if ($scope.rate.lineWithRate) {
                $scope.lineWithRates.push({
                  description: $scope.rate.lineWithRate.rateDescription,
                  rate: $scope.rate.lineWithRate.rate,
                  quantity: $scope.rate.lineWithRate.rateQuantity,
                  total: $scope.rate.lineWithRate.rate * $scope.rate.lineWithRate.rateQuantity
                });    
              }
              if ($scope.price.lineWithPrice) {
                $scope.lineWithPrices.push({
                  description: $scope.price.lineWithPrice.description,
                  price: $scope.price.lineWithPrice.price,
                  quantity: 1,
                  total: $scope.price.lineWithPrice.price
                });
              }
              if ($scope.variation.title) {
                addOnPackageService.sendVariation({id: $scope.package._id, 
                  quoteLater: $scope.quoteLater,
                  packageType: $scope.type, variation: $scope.variation,
                  rate: $scope.lineWithRates, price: $scope.lineWithPrices})
                .$promise.then(function(data) {
                  $scope.package.variations.push(data);
                  $scope.variation.title = null;
                  $scope.variation.descriptions = [];
                  $scope.lineWithRates = [];
                  $scope.lineWithPrices = [];
                  if ($scope.type == 'builder') {
                    if (!data.to.isSelect) {
                      if ($scope.currentTeam.type == 'builder') {
                        $state.go('variationRequest.sendQuote',{id: data.project,variationId: data._id});
                      }
                      else {
                        $state.go('variationRequest.viewRequest',{id: data.project,variationId: data._id});
                      }
                    }
                    else {
                      $state.go('variationRequest.inProcess',{id: data.project,variationId: data._id});
                    }
                  }
                  else {
                    if (!data.to.isSelect) {
                      if ($scope.currentTeam.type == 'builder') {
                        $state.go('variationRequest.viewRequest',{id: data.project,variationId: data._id});
                      }
                      else {
                        $state.go('variationRequest.sendQuote',{id: data.project,variationId: data._id});
                      }
                    }
                    else {
                      $state.go('variationRequest.inProcess',{id: data.project,variationId: data._id});
                    }
                  }
                });
              }
            };

            //send defect
            $scope.defect = {};
            $scope.sendDefect = function() {
              addOnPackageService.sendDefect({id: $scope.package._id, packageType: $scope.type, defect: $scope.defect})
              .$promise.then(function(data) {
                $scope.data = data;
                $scope.package.defects = data.defects;
                $scope.defect = {};
              });
            };
            
            //send addendum
            $scope.addendum = {};
            $scope.addendumsScope = [];

            $scope.addAddendum = function() {
              $scope.addendumsScope.push({scopeDescription: $scope.addendum.scopeDescription, quantity: $scope.addendum.quantity});
              $scope.addendum.scopeDescription = null;
              $scope.addendum.quantity = null;
            };
            $scope.removeAddendum = function(index) {
              $scope.addendumsScope.splice(index, 1);
            };

            $scope.sendAddendum = function() {
              addOnPackageService.sendAddendum({id: $scope.package._id, 
                packageType: $scope.package.packageType, description: $scope.addendum, 
                addendumScope: $scope.addendumsScope})
              .$promise.then(function(data) {
                $scope.addendums = data;
                $scope.contractorRequest = data;
                $scope.addendum = {};
              });
            };

            //send invoice
            $scope.invoice = {};
            $scope.subTotalPrice = 0;
            $scope.subTotalRate = 0;
            $scope.rate = {};
            $scope.price = {};
            $scope.lineWithRates = [];
            $scope.lineWithPrices = [];

            $scope.addLineWithRate = function() {
              $scope.lineWithRates.length = $scope.lineWithRates.length + 1;
            };
            $scope.addLineWithPrice = function() {
              $scope.lineWithPrices.length = $scope.lineWithPrices.length + 1;
            };

            $scope.removeLineWithRate = function(index) {
              $scope.lineWithRates.splice(index, 1);
              delete $scope.rate.lineWithRate.rateDescription[index];
              delete $scope.rate.lineWithRate.rate[index];
              delete $scope.rate.lineWithRate.rateQuantity[index];
              delete $scope.rate.lineWithRate.rateTotal[index];
            };
            $scope.removeLineWithPrice = function(index) {
              $scope.lineWithPrices.splice(index, 1);
              delete $scope.price.lineWithPrice.description[index];
              delete $scope.price.lineWithPrice.price[index];
                // delete $scope.rate.lineWithPrice.rateQuantity[index];
                // delete $scope.rate.lineWithPrice.rateTotal[index];
              };

            $scope.sendInvoice = function() {
              if ($scope.rate.lineWithRate) {
                $scope.lineWithRates.push({
                  description: $scope.rate.lineWithRate.rateDescription,
                  rate: $scope.rate.lineWithRate.rate,
                  quantity: $scope.rate.lineWithRate.rateQuantity,
                  total: $scope.rate.lineWithRate.rate * $scope.rate.lineWithRate.rateQuantity
                });
              }
              if ($scope.price.lineWithPrice) {
                $scope.lineWithPrices.push({
                  description: $scope.price.lineWithPrice.description,
                  price: $scope.price.lineWithPrice.price,
                  quantity: 1,
                  total: $scope.price.lineWithPrice.price
                });
              }
              addOnPackageService.sendInvoice({id: $scope.package._id, packageType: $scope.type, invoice: $scope.invoice, rate: $scope.lineWithRates, price: $scope.lineWithPrices}).$promise.then(function(data){
                $scope.data = data;
                $scope.package.invoices = data.invoices;
                $scope.lineWithPrices = [];
                $scope.lineWithRates = [];
                $scope.invoice = {};
              });
            };

            $scope.$watch('rate.lineWithRate',function(value) {
              $scope.subTotalRate = 0;
              if (value && value.rateTotal) {
                _.forEach(value.rateTotal, function (item) {
                  if (!isNaN(item)) {
                    $scope.subTotalRate += parseFloat(item);
                  }
                });
              }

            },true);

            $scope.$watch('price.lineWithPrice',function(value) {
              $scope.subTotalPrice = 0;
              if (value && value.price) {
                _.forEach(value.price, function (item) {

                  if (!isNaN(item)) {
                    $scope.subTotalPrice += parseFloat(item);
                  }
                });
              }

            },true);

            $scope.formData = {
              title: '',
              belongToType: ''
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

            var uploader = $scope.uploader = new FileUploader({
              url: 'api/uploads/'+ $scope.package._id + '/file-package',
              headers : {
                Authorization: 'Bearer ' + $cookieStore.get('token')
              },
              formData: [$scope.formData]
            });
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
              fileService.getFileByStateParam({'id': $scope.package._id}).$promise.then(function(data) {
                $scope.documents = data;
              });
            };
            uploader.onBeforeUploadItem = function (item) {
              $scope.formData._id = $scope.fileId;
              $scope.formData.title = item.title;
              $scope.formData.belongToType = $scope.type;
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
                fileService.getFileByStateParam({'id': $scope.package._id}).$promise.then(function(data) {
                  $scope.documents = data;
                  var newestDocument = _.last(data);
                  $scope.showDocuments();
                  $scope.goToDocumentDetail(newestDocument);
                });
                $('.toast').css('opacity','0');
                Materialize.toast('Upload completed',3000);
              };

              $scope.sendToDocumentation = function(){
                var newestDocument = _.last($scope.documents);
                fileService.sendToDocumentation({id: newestDocument._id},{projectId: $scope.currentProject._id, package: $scope.package._id}).$promise.then(function(res){
                });
              };
            }
          };
        });