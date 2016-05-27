angular.module('buiiltApp').controller('projectFileDetailCtrl', function($scope, $rootScope, $timeout, file, $mdDialog, uploadService, fileService, $mdToast, peopleService, $stateParams, messageService, taskService, $state, people, socket, notificationService, tenders, dialogService, activities) {
    // dynamic height for reversion file thumbnail
    $scope.imageHeight = $("div.content").innerHeight() - $("div.content").innerHeight() * 0.2;
	// dynamic height for file view
    $scope.contentHeight = $rootScope.maximunHeight - $("header").innerHeight() - 10;

	$scope.showDetail = false;
	

    /*Show modal with valid name*/
    $scope.showModal = function($event, modalName) {
        if (modalName==="edit-file.html") {
            $rootScope.isEditFile = true;
        }
        $mdDialog.show({
            // targetEvent: $event,
            controller: 'projectFileDetailCtrl',
            resolve: {
                file: ["$stateParams", "fileService", function($stateParams, fileService) {
                    return fileService.get({id: $stateParams.fileId}).$promise;
                }],
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }],
                tenders: ["tenderService", "$stateParams", function(tenderService, $stateParams) {
                    return tenderService.getAll({id: $stateParams.id}).$promise;
                }],
                activities: ["activityService", "$stateParams", function(activityService, $stateParams) {
                    return activityService.me({id: $stateParams.id}).$promise;
                }]
            },
            templateUrl: 'app/modules/project/project-files/detail/partials/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Close opening modal*/
    $scope.closeModal = function() {
        if ($rootScope.firstTimeEdit) {
            fileService.delete({id: file._id}).$promise.then(function() {
                dialogService.closeModal();
                dialogService.showToast("File Has Been Removed");
                $rootScope.$emit("File.Remove", file._id);
                $state.go("project.files.all", {id: $stateParams.id});
            }, function(err) {
                dialogService.showToast("Error When Delete File");
            });
        } else {
            $mdDialog.cancel();
        }
    };

    if ($rootScope.openDetail) {
        $rootScope.firstTimeEdit = true;
        $rootScope.openDetail = false;
        $scope.showModal(null, "edit-file.html");
    }

    $scope.step=1;
    $scope.next = function(type) {
        if (type==="edit-file") {
            if ($scope.step==1 && (!$scope.file.name || !$scope.file.selectedTag)) {
                dialogService.showToast("Check Your Data");
            } else if ($scope.step==2 && !$scope.file.selectedEvent) {
                dialogService.showToast("Check Your Data");
            } else {
                $scope.step +=1;
            }
        }
    };

    var originalFile = angular.copy(file);
    $scope.file = file;
    $scope.file.selectedEvent = file.event;
    $scope.file.selectedTag = (file.tags.length > 0) ? file.tags[0] : null;
    $scope.activities = activities;
    /*Check if current team is team owner of file*/
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

    /*Update count total after 0.5s*/
    $timeout(function() {
        $rootScope.$emit("UpdateCountNumber", {type: "file", number: (file.__v>0)?1:0});
    }, 500);

    /*Update last access for current user*/
    fileService.lastAccess({id: $stateParams.fileId}).$promise.then(function(data) {
        $rootScope.$emit("File.Read", file);
    });

    /*Mark all notifications related to current file as read*/
    $timeout(function() {
        notificationService.markItemsAsRead({id: $stateParams.fileId}).$promise.then(function() {
            _.each($scope.file.activities, function(a){
                a.unread = false;
                a.unreadLine=false;
            });
        });
    }, 3000);

    /*Filter unread activities depend on notifications list*/
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

    /*Check is current user has sent acknowledgement or not
    and also grant file link for activity if it's upload-reversion type*/
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
                if (activity.activityAndHisToryId) {
                    var index = _.findIndex(file.fileHistory, function(history) {
                        return history.activityAndHisToryId==activity.activityAndHisToryId;
                    });
                    if (index !== -1) {
                        activity.element.link = file.fileHistory[index].link;
                        activity.element.fileType = (activity.element.link.substr(activity.element.link.length-3, activity.element.link.length).toLowerCase()==="pdf") ? "pdf" : "image";
                    }
                }
            }
        });
    };

    filterUnreadActivites($scope.file);
    checkAcknowLedgement($scope.file);
    
    $scope.people = people;
    $scope.currentUser = $rootScope.currentUser;

    socket.emit("join", file._id);

    // Add get related item for current file
    socket.on("relatedItem:new", function(data) {
        if (data.belongTo.toString()===file._id.toString()) {
            $scope.file.relatedItem.push({type: data.type, item: data.data});
            $scope.file.activities.push({
                user: {_id: data.excuteUser._id, name: data.excuteUser.name, email: data.excuteUser.email},
                type: "related-"+data.type,
                element: {item: data.data._id, name: (data.data.name) ? data.data.name : data.data.description, related: true}
            });
        }
    });

    /*Receive when someone updated file that current user is in members list*/
    socket.on("file:update", function(data) {
        originalFile = angular.copy(data);
        $scope.file = data;
        $scope.file.selectedEvent = data.event;
        $scope.file.selectedTag = (data.tags.length > 0) ? data.tags[0] : null;
        checkAcknowLedgement($scope.file);
        notificationService.markItemsAsRead({id: $stateParams.fileId}).$promise.then();
    });

    /*Send acknowledgement to reversion owner*/
    $scope.acknowledgement = function(activity) {
        fileService.acknowledgement({id: $stateParams.fileId, activityId: activity._id}).$promise.then(function(res) {
            $scope.showToast("Sent acknowledgement to the owner successfully");
        }, function(err) {
            $scope.showToast("Error");
        });
    };

    /*Open file history list*/
    $scope.openFileHistory = function($mdOpenMenu, event) {
        $mdOpenMenu(event);
    };

    /*Open selected file history in a new window*/
    $scope.openHistoryDetail = function($event, history) {
        var win = window.open(history.link, "_blank");
        win.focus();
    };

    $scope.$watch("showDetail", function(value) {
        if (value) {
            _.each($scope.file.tags, function(tag) {
                var tagIndex = _.findIndex($scope.tags, function(t) {
                    return t.name===tag;
                });
                if (tagIndex !== -1) {
                    $scope.tags[tagIndex].select = true;
                }
            });
        }
    });

    /*Get project members list and file tags list*/
    function getProjectMembersOrTenderers() {
        $scope.tender = tenders[0];
        $scope.membersList = [];
        $scope.tags = [];
        _.each($rootScope.currentTeam.fileTags, function(tag) {
            $scope.tags.push({name: tag, select: false});
        });
        // if ($rootScope.isEditFile) {
        //     _.each($scope.file.tags, function(tag) {
        //         var tagIndex = _.findIndex($scope.tags, function(t) {
        //             return t.name===tag;
        //         });
        //         if (tagIndex !== -1) {
        //             $scope.tags[tagIndex].select = true;
        //         }
        //     });
        // }
        if (!$scope.tender || $scope.tender.owner._id==$rootScope.currentUser._id) {
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
        } else {
            $scope.membersList.push(people[$scope.tender.ownerType][0].tenderers[0]._id);
            _.each(people[$scope.tender.ownerType][0].tenderers[0].teamMember, function(member) {
                $scope.membersList.push(member);
            });
            var currentTenderIndex = _.findIndex($scope.tender.members, function(member) {
                if (member.user) {
                    return member.user._id==$rootScope.currentUser._id;
                }
            });
            if (currentTenderIndex !== -1) {
                $scope.membersList.push($scope.tender.members[currentTenderIndex].user);
                if ($scope.tender.members[currentTenderIndex].teamMember) {
                    _.each($scope.tender.members[currentTenderIndex].teamMember, function(member) {
                        $scope.membersList.push(member);
                    });
                }
            } else {
                _.each($scope.tender.members, function(member) {
                    var memberIndex = _.findIndex(member.teamMember, function(teamMember) {
                        return teamMember._id.toString() === $rootScope.currentUser._id.toString();
                    });
                    if (memberIndex !== -1) {
                        _.each(member.teamMember, function(teamMember) {
                            $scope.membersList.push(teamMember);
                        });
                        $scope.membersList.push(member.user);
                    }
                });
            } 
        }
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
    getProjectMembersOrTenderers();

    /*Show a toast with an inform*/
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    /*Edit selected file detail*/
    $scope.editFile = function(form) {
        if (form.$valid) {
            $scope.file.newMembers = _.filter($scope.membersList, {select: true});
            if ($scope.file.newMembers.length === 0 && $rootScope.firstTimeEdit) {
                dialogService.showToast("Please Select At Least 1 Member...");
            } else {
                $scope.file.editType = "edit";
                $scope.update($scope.file);
            }
        } else {
            $scope.showToast("There Was An Error Saving Your Changes...");
        }
    };

    /*Select project members to assign to current file
    Select file tags for update file detail
    Select current file members to create new related item*/
    $scope.selectMember = function(index, type) {
        if (type === "member") {
            $scope.membersList[index].select = !$scope.membersList[index].select;
        } else if (type === "tag") {
            $scope.tags[index].select = !$scope.tags[index].select;
        } else {
            $scope.invitees[index].select = !$scope.invitees[index].select;
        }
    };

    /*Assign project members to current file*/
    $scope.assignMember = function() {
        $scope.file.newMembers = _.filter($scope.membersList, {select: true});
        if ($scope.file.newMembers.length > 0) {
            $scope.file.editType = "assign";
            $scope.update($scope.file);
        } else {
            dialogService.showToast("Please Select At Least 1 Invitee...");
        }
    };

    /*Insert a note to current file*/
    $scope.insertNote = function(form) {
        if (form.$valid) {
            $scope.file.editType="insert-note";
            $scope.update($scope.file);
        } else {
            $scope.showToast("Please Check Your Input");
            return;
        }
    };

    $scope.changeTitle = function(form) {
        if (form.$valid && $scope.file.name !== originalFile.name) {
            $scope.file.editType="edit";
            $scope.update($scope.file);
        } else {
            dialogService.showToast("Check Your Data");
        }
    };

    // $scope.changeTag = function(index) {
    //     $scope.tags[index].select = !$scope.tags[index].select;
    //     $scope.file.tags = _.filter($scope.tags, {select: true});
    //     $scope.file.editType="edit";
    //     $scope.update($scope.file);
    // }

    $scope.addOrChangeEventOrTags = function(type) {
        if (type==="event") {
            if (!$scope.file.selectedEvent) {
                dialogService.showToast("Please Select An Event");
            } else {
                $scope.file.editType = ($scope.file.event) ? "change-event" : "add-event";
                $scope.update($scope.file);
            }
        } else if (type==="tags") {
            if (!$scope.file.selectedTag) {
                dialogService.showToast("Please Select A Tag");
            } else {
                $scope.file.editType = "edit";
                $scope.update($scope.file);
            }
        }
    };

    /*Update file*/
    $scope.update = function(file) {
        fileService.update({id: file._id}, file).$promise.then(function(res) {
            $scope.file = file;
            dialogService.closeModal();
            switch (file.editType) {
                case "edit":
                    $scope.showToast("File Information Updated Successfully.");
                    // $scope.showDetail = false;
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

                case "change-event":
                    $scope.showToast("Change Event Successfully.");
                break;

                case "add-event":
                    $scope.showToast("Add Event Successfully.");
                break;

                default:
                break
            }
        }, function(err) {$scope.showToast("There Has Been An Error...");});
    };

    $scope.relatedThread = {
        selectedEvent: $scope.file.event
    };

    /*Create related thread with valid members then open thread detail*/
    $scope.createRelatedThread = function(form) {
        if (form.$valid) {
            $scope.relatedThread.members = $scope.file.members;
            _.each($scope.file.notMembers, function(email) {
                $scope.relatedThread.members.push({email: email});
            });
            // if ($scope.relatedThread.members.length > 0) {
            $scope.relatedThread.belongTo = $scope.file._id;
            $scope.relatedThread.belongToType = "file";
            $scope.relatedThread.type = "project-message";
            messageService.create({id: $stateParams.id}, $scope.relatedThread).$promise.then(function(relatedThread) {
                $scope.closeModal();
                $scope.showToast("Create Related Thread Successfully!");
                // $state.go("project.messages.detail", {id: $stateParams.id, messageId: relatedThread._id});
            }, function(err) {$scope.showToast("Error");});
            // } else {
            //     $scope.showToast("Please select at least 1 invitee");
            //     return;
            // }
        } else {
            $scope.showToast("Please check your input again");
            return;
        }
    };

    $scope.relatedTask = {
        dateStart: new Date(),
        dateEnd: new Date(),
        time: {},
        selectedEvent: $scope.file.event
    };

    /*Create related task with valid members then open task detail*/
    $scope.createRelatedTask = function(form) {
        if (form.$valid) {
            if (!$scope.relatedTask.time.start || !$scope.relatedTask.time.end) {
                dialogService.showToast("Please Select Start Time And End Time");
                return
            }
            $scope.relatedTask.members = $scope.file.members;
            _.each($scope.file.notMembers, function(email) {
                $scope.relatedTask.members.push({email: email});
            });
            $scope.relatedTask.belongTo = $scope.file._id;
            $scope.relatedTask.belongToType = "file";
            $scope.relatedTask.type = "project-message";
            taskService.create({id: $stateParams.id}, $scope.relatedTask).$promise.then(function(relatedTask) {
                $scope.closeModal();
                $scope.showToast("Create Related Task Successfully!");
            }, function(err) {$scope.showToast("Error");});
        } else {
            $scope.showToast("Please check your input again");
            return;
        }
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            onSuccess
        );
    };

    $scope.uploadReversion = {};

    function onSuccess(file){
        $scope.uploadReversion.file = file;
        $scope.uploadReversionFile();
    };


    /*Upload file reversion then call mixpanel to track current user
    has uploaded reversion*/
    $scope.uploadReversionFile = function() {
        if (!$scope.uploadReversion.file) {
            dialogService.showToast("Please Select A File");
        } else {
            uploadService.uploadReversion({id: $stateParams.fileId}, $scope.uploadReversion).$promise.then(function(res) {
                dialogService.closeModal();
                dialogService.showToast("Upload File Reversion Successfully");

                mixpanel.identify($rootScope.currentUser._id);
                mixpanel.track("File Reversion Uploaded");

                $scope.uploadReversion = {};
            }, function(err) {
                dialogService.showToast("Error");
            });
        }
    };

    /*Archive or unarchive file*/
    $scope.archive = function() {
        var confirm = $mdDialog.confirm().title((!$scope.file.isArchive) ? "Archive?" : "Unarchive?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            $scope.file.editType = (!$scope.file.isArchive) ? "archive" : "unarchive";
            $scope.file.isArchive = !$scope.file.isArchive;
            $scope.update($scope.file, $scope.file.editType);
        }, function() {
            
        });
    };

    $scope.viewFile = function(activityAndHisToryId) {
        var index = _.findIndex($scope.file.fileHistory, function(history) {
            return history.activityAndHisToryId==activityAndHisToryId;
        });
        if (index !== -1) {
            window.open($scope.file.fileHistory[index].link, "_blank").focus();
        }
    };
});