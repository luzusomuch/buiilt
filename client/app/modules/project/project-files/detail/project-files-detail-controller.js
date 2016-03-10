angular.module('buiiltApp').controller('projectFileDetailCtrl', function($scope, $rootScope, $timeout, file, $mdDialog, uploadService, fileService, $mdToast, peopleService, $stateParams, messageService, taskService, $state, people, socket, notificationService) {
    $scope.file = file;
    // Check owner team
    $scope.isOwnerTeam=false;
    if (_.findIndex($rootScope.currentTeam.leader, function(leader) {
        return leader._id.toString()===file.owner._id.toString();
    }) !== -1 || _.findIndex($rootScope.currentTeam.member, function(member) {
        if (member._id && member.status=="Active") {
            return member._id._id.toString()===file.owner._id.toString();
        }
    }) !== -1) {
        $scope.isOwnerTeam=true;
    }
    // end check owner team

    // remove notifications count immeditely
    $timeout(function() {
        $rootScope.$emit("UpdateCountNumber", {type: "file", number: (file.__v>0)?1:0});
    }, 500);
    fileService.lastAccess({id: $stateParams.fileId}).$promise.then(function(data) {
        $rootScope.$emit("File.Read", file);
    });
    // end

    // set timeout 3s for mark as read
    $timeout(function() {
        notificationService.markItemsAsRead({id: $stateParams.fileId}).$promise.then(function() {
            markActivitesAsRead($scope.file);
        });
    }, 3000);
    // end timeout

    // function to filter out that unread activities
    function filterUnreadActivites(file) {
        if (file.__v > 0) {
            var temp = 0;
            for (var i = file.activities.length - 1; i >= 0; i--) {
                if (i===0) {
                    file.activities[i].unreadLine=true;
                }
                file.activities[i].unread = true;
                temp+=1;
                if (temp===file.__v) {
                    break;
                }
            };
        }
    };
    // end filter unread activities

    // function to mark activities as read
    function markActivitesAsRead(file) {
        _.each(file.activities, function(a){
            a.unread = false;
            a.unreadLine=false;
        });
    };
    // end mark activities as read

    // this function use for check if current user is sent acknowledge yet
    function checkAcknowLedgement(file) {
        _.each(file.activities, function(activity) {
            if (activity.type === "upload-reversion" || activity.type === "upload-file") {
                if (_.findIndex(activity.acknowledgeUsers, function(item) {
                    if (item._id) {
                        return item._id._id == $rootScope.currentUser._id && item.isAcknow;
                    }
                }) !== -1) {
                    activity.isAcknow = true;
                } else {
                    activity.isAcknow = false;
                }
            }
        });
    };
    // end check acknowledge

    filterUnreadActivites($scope.file);
    checkAcknowLedgement($scope.file);
    
    $scope.orginalActivities = angular.copy($scope.file.activities);
    $scope.isShowRelatedItem = true;
    $scope.people = people;
    $scope.currentUser = $rootScope.currentUser;

    // $rootScope.$on("File.Updated", function(event, data) {
    //     $scope.file = data;
    // });

    socket.emit("join", file._id);
    socket.on("file:update", function(data) {
        $scope.file = data;
        checkAcknowLedgement($scope.file);
        notificationService.markItemsAsRead({id: $stateParams.fileId}).$promise.then();
    });

    $scope.acknowledgement = function(activity) {
        fileService.acknowledgement({id: $stateParams.fileId, activityId: activity._id}).$promise.then(function(res) {
            $scope.showToast("Sent acknowledgement to the owner successfully");
            // $rootScope.$broadcast("File.Updated", res);
        }, function(err) {
            $scope.showToast("Error");
        });
    };

    $scope.openFileHistory = function($mdOpenMenu, event) {
        $mdOpenMenu(event);
    };

    $scope.openHistoryDetail = function($event, history) {
        // $mdDialog.show({
        //     targetEvent: $event,
        //     controller: function($scope) {
        //         $scope.history = history;
        //         $scope.closeModal = function() {
        //             $mdDialog.cancel();
        //         };

        //         $scope.downloadFile = function() {
        //             filepicker.exportFile(
        //                 {url: $scope.history.link, filename: $scope.history.name},
        //                 function(Blob){
        //                     console.log(Blob.url);
        //                 }
        //             );
        //         };
        //     },
        //     templateUrl: 'app/modules/project/project-files/detail/partials/file-history-detail.html',
        //     parent: angular.element(document.body),
        //     clickOutsideToClose: false
        // });
        var win = window.open(history.link, "_blank");
        win.focus();
    };

    $scope.chipsFilter = function() {
        $scope.isShowRelatedItem = !$scope.isShowRelatedItem;
    };

    $scope.$watch("isShowRelatedItem", function(value) {
        if (!value) {
            var activities = [];
            var relatedActivities = ["related-task","related-thread","related-file"];
            _.each($scope.orginalActivities, function(activity) {
                if (_.indexOf(relatedActivities, activity.type) === -1) {
                    activities.push(activity);
                }
            });
            $scope.file.activities = activities;
        } else {
            $scope.file.activities = $scope.orginalActivities;
        }
    });

    function getProjectMembers(id) {
        $scope.membersList = [];
        $scope.tags = [];
        _.each($rootScope.currentTeam.fileTags, function(tag) {
            $scope.tags.push({name: tag, select: false});
        });
        if ($rootScope.isEditFile) {
            _.each($scope.file.tags, function(tag) {
                var tagIndex = _.findIndex($scope.tags, function(t) {
                    return t.name===tag;
                });
                if (tagIndex !== -1) {
                    $scope.tags[tagIndex].select = true;
                }
            });
        }
        _.each($rootScope.roles, function(role) {
            _.each($scope.people[role], function(tender){
                if (tender.hasSelect) {
                    var isLeader = (_.findIndex(tender.tenderers, function(tenderer) {
                        if (tenderer._id) {
                            return tenderer._id._id.toString() === $rootScope.currentUser._id.toString();
                        }
                    }) !== -1) ? true : false;
                    if (!isLeader) {
                        _.each(tender.tenderers, function(tenderer) {
                            var memberIndex = _.findIndex(tenderer.teamMember, function(member) {
                                return member._id.toString() === $rootScope.currentUser._id.toString();
                            });
                            if (memberIndex !== -1) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.select = false;
                                    $scope.membersList.push(member);
                                });
                            }
                        });
                        if (tender.tenderers[0]._id) {
                            tender.tenderers[0]._id.select = false;
                            $scope.membersList.push(tender.tenderers[0]._id);
                        } else {
                            $scope.membersList.push({email: tender.tenderers[0].email, select: false});
                        }
                    } else {
                        _.each(tender.tenderers, function(tenderer) {
                            if (tenderer._id._id.toString() === $rootScope.currentUser._id.toString()) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.select = false;
                                    $scope.membersList.push(member);
                                });
                            }
                        });
                    }
                }
            });
        });
        // get unique member 
        $scope.membersList = _.uniq($scope.membersList, "_id");

        // filter members list again
        _.each(file.members, function(member) {
            _.remove($scope.membersList, {_id: member._id});
        });

        // remove current user from the members list
        _.remove($scope.membersList, {_id: $rootScope.currentUser._id});

        // get invitees for related item
        $scope.invitees = angular.copy($scope.file.members);
        _.each($scope.file.notMembers, function(member) {
            $scope.invitees.push({email: member});
        });
        $scope.invitees.push($scope.file.owner);
        $scope.invitees = _.uniq($scope.invitees, "email");
        _.remove($scope.invitees, {_id: $rootScope.currentUser._id});
    };

    $scope.showModal = function($event, modalName) {
        if (modalName === "add-related-thread.html") {
            $scope.relatedThread = {};
        } else if (modalName === "add-related-task.html") {
            $scope.minDate = new Date();
            $scope.relatedTask = {};
        } else if (modalName==="edit-file.html") {
            $rootScope.isEditFile = true;
        }
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectFileDetailCtrl',
            resolve: {
                file: ["$stateParams", "fileService", function($stateParams, fileService) {
                    return fileService.get({id: $stateParams.fileId}).$promise;
                }],
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }]
            },
            templateUrl: 'app/modules/project/project-files/detail/partials/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    $scope.editFile = function(form) {
        if (form.$valid) {
            $scope.file.editType = "edit";
            $scope.file.tags = _.filter($scope.tags, {select: true});
            $scope.update($scope.file);
        } else {
            $scope.showToast("There Was An Error Saving Your Changes...");
        }
    };

    $scope.selectMember = function(index, type) {
        if (type === "member") {
            $scope.membersList[index].select = !$scope.membersList[index].select;
        } else if (type === "tag") {
            $scope.tags[index].select = !$scope.tags[index].select;
        } else {
            $scope.invitees[index].select = !$scope.invitees[index].select;
        }
    };

    $scope.assignMember = function() {
        $scope.file.newMembers = _.filter($scope.membersList, {select: true});
        $scope.file.editType = "assign";
        $scope.update($scope.file);
    };

    $scope.insertNote = function(form) {
        if (form.$valid) {
            $scope.file.editType="insert-note";
            $scope.update($scope.file);
        } else {
            $scope.showToast("Please Check Your Input");
            return;
        }
    };

    $scope.update = function(file) {
        if (file.tags.length === 0) {
            $scope.showToast("Please Select At Least 1 Tag...");
            return;
        } else if (file.members.length === 0) {
            $scope.showToast("Please Select At Least 1 Invitee...");
            return;
        }
        fileService.update({id: file._id}, file).$promise.then(function(res) {
            $scope.file = file;
            $scope.closeModal();
            switch (file.editType) {
                case "edit":
                    $scope.showToast("File Information Updated Successfully.");
                break;

                case "assign":
                    $scope.showToast("Additional Assignees Added Successfully.");
                break;

                case "insert-note":
                    $scope.showToast("Your Note Has Been Successfully Added.");
                break;

                case "archive":
                    $scope.showToast("This File Has Been Archived Successfully.");
                break;

                case "unarchive":
                    $scope.showToast("This File Has Been Unarchived Successfully.");
                break;

                default:
                break
            }
        }, function(err) {$scope.showToast("There Has Been An Error...");});
    };

    $scope.createRelatedThread = function(form) {
        if (form.$valid) {
            $scope.relatedThread.members = _.filter($scope.invitees, {select: true});
            if ($scope.relatedThread.members.length > 0) {
                $scope.relatedThread.belongTo = $scope.file._id;
                $scope.relatedThread.belongToType = "file";
                $scope.relatedThread.type = "project-message";
                messageService.create({id: $stateParams.id}, $scope.relatedThread).$promise.then(function(relatedThread) {
                    $scope.closeModal();
                    $scope.showToast("Create Related Thread Successfully!");
                    $state.go("project.messages.detail", {id: $stateParams.id, messageId: relatedThread._id});
                }, function(err) {$scope.showToast("Error");});
            } else {
                $scope.showToast("Please select at least 1 invitee");
                return;
            }
        } else {
            $scope.showToast("Please check your input again");
            return;
        }
    };

    $scope.createRelatedTask = function(form) {
        if (form.$valid) {
            $scope.relatedTask.members = _.filter($scope.invitees, {select: true});
            if ($scope.relatedTask.members.length > 0) {
                $scope.relatedTask.belongTo = $scope.file._id;
                $scope.relatedTask.belongToType = "file";
                $scope.relatedTask.type = "project-message";
                taskService.create({id: $stateParams.id}, $scope.relatedTask).$promise.then(function(relatedTask) {
                    $scope.closeModal();
                    $scope.showToast("Create Related Task Successfully!");
                    $state.go("project.tasks.detail", {id: $stateParams.id, taskId: relatedTask._id});
                }, function(err) {$scope.showToast("Error");});
            } else {
                $scope.showToast("Please select at least 1 invitee");
                return;
            }
        } else {
            $scope.showToast("Please check your input again");
            return;
        }
    };

    // create related file
    $scope.relatedFile = {
        files:[],
        tags:[],
        belongTo: $scope.file._id,
        belongToType: "file"
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            // add max files for multiple pick
            // {maxFiles: 5},
            onSuccess
        );
    };

    function onSuccess(file, type){
        file.type = "file";
        if (type === "related") 
            $scope.relatedFile.files.push(file);
        else
            $scope.fileReversion.files.push(file);
    };

    $scope.createRelatedFile = function() {
        $scope.relatedFile.tags = _.filter($scope.tags, {select: true});
        $scope.relatedFile.members = _.filter($scope.invitees, {select: true});
        if ($scope.relatedFile.files.length == 0) {
            $scope.showToast("Please choose at least 1 file");
        } else if ($scope.relatedFile.tags.length == 0) {
            $scope.showToast("Please enter at least 1 tags");
        } else if ($scope.relatedFile.members.length == 0) {
            $scope.showToast("Please choose at least 1 member");
        } else { 
            uploadService.upload({id: $stateParams.id}, $scope.relatedFile).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Upload new related file successfully");
                $state.go("project.files.detail", {id: res[0].project, fileId: res[0]._id});
            }, function(err) {$scope.showToast("Error");});
        }
    };

    // upload reversion
    $scope.fileReversion = {
        files: []
    };

    $scope.uploadReversionFile = function() {
        if ($scope.fileReversion.files.length === 0) {
            $scope.showToast("Please Select A File To Upload...");
            return;
        } else {
            uploadService.uploadReversion({id: $scope.file._id}, $scope.fileReversion).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("File Revision Attached Successfully.");
				
				//Track File Revision
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("File Revision Uploaded");
				
                $scope.file = res;
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        }
    };

    // show file history
    $scope.isShowHistory = false;
    $scope.getFileHistory = function(history) {
        $scope.history = history;
        $scope.isShowHistory = true;
    };

    $scope.downloadFile = function() {
        if ($scope.history) {
            filepicker.exportFile(
                {url: $scope.history.link, filename: $scope.history.name},
                function(Blob){
                    console.log(Blob.url);
                }
            );
        } else {
            $scope.showToast("There Has Been An Error...");
        }
    };

    $scope.archive = function() {
        var confirm = $mdDialog.confirm().title((!$scope.file.isArchive) ? "Archive?" : "Unarchive?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            $scope.file.editType = (!$scope.file.isArchive) ? "archive" : "unarchive";
            $scope.file.isArchive = !$scope.file.isArchive;
            $scope.update($scope.file, $scope.file.editType);
        }, function() {
            
        });
    };

    getProjectMembers($stateParams.id);
});