angular.module('buiiltApp').controller('projectTaskDetailCtrl', function($rootScope, $scope, $timeout, task, taskService, $mdToast, $mdDialog, peopleService, $stateParams, messageService, $state, people, uploadService, socket, notificationService) {
	notificationService.markItemsAsRead({id: $stateParams.taskId}).$promise.then(function() {
        $rootScope.$broadcast("UpdateCountNumber", {type: "task", number: task.__v});
    });
    $scope.task = task;
    $scope.people = people;
    $scope.task.dateEnd = new Date($scope.task.dateEnd);
    $scope.minDate = new Date();
    if ($scope.task.belongTo) {
        switch ($scope.task.belongTo.type) {
            case "thread":
                $scope.task.belongTo.link = "/project/"+$scope.task.project+"/messages/detail/"+$scope.task.belongTo.item._id;
            break;

            case "task":
                $scope.task.belongTo.link = "/project/"+$scope.task.project+"/tasks/detail/"+$scope.task.belongTo.item._id;
            break;

            default:
            break;
        }
    }
    $scope.orginalActivities = angular.copy($scope.task.activities);

    $scope.isShowRelativeActivities = true;
    $scope.showRelatedActivities = function() {
        $scope.isShowRelativeActivities = !$scope.isShowRelativeActivities;
    };
    $scope.$watch("isShowRelativeActivities", function(value) {
        var activities = [];
        if (!value) {
            _.each($scope.orginalActivities, function(activity) {
                if (activity.type === "complete-task" || activity.type === "uncomplete-task" || activity.type === "edit-task" || activity.type === "assign") {
                    activities.push(activity);
                }
            });
            $scope.task.activities = activities;
        } else {
            $scope.task.activities = $scope.orginalActivities;
        }
    });

    function getProjectMembers(id) {
        $scope.membersList = [];
        $scope.tags = [];
        _.each($rootScope.currentTeam.fileTags, function(tag) {
            $scope.tags.push({name: tag, select: false});
        });
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
        _.each(task.members, function(member) {
            _.remove($scope.membersList, {_id: member._id});
        });

        // remove current user from the members list
        _.remove($scope.membersList, {_id: $rootScope.currentUser._id});

        // get invitees for related item
        $scope.invitees = angular.copy($scope.task.members);
        _.each($scope.task.notMembers, function(member) {
            $scope.invitees.push({email: member});
        });
        $scope.invitees.push($scope.task.owner);
        $scope.invitees = _.uniq($scope.invitees, "email");
        _.remove($scope.invitees, {_id: $rootScope.currentUser._id});
    };

    $scope.markComplete = function() {
        $scope.task.completed = !$scope.task.completed;
        if ($scope.task.completed) {
            $scope.task.completedBy = $rootScope.currentUser._id;
            $scope.task.editType = "complete-task";
            $scope.task.completedAt = new Date();
        } else {
            $scope.task.completedBy = null;
            $scope.task.editType = "uncomplete-task";
            $scope.task.completedAt = null;
        }
        $scope.updateTask($scope.task, $scope.task.editType);
    };

    $scope.showModal = function($event, modalName){
        if (modalName === "add-related-thread.html") {
            $scope.relatedThread = {};
        }
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectTaskDetailCtrl',
            resolve: {
                task: function($stateParams, taskService) {
                    return taskService.get({id: $stateParams.taskId}).$promise;
                },
                people: function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }
            },
            templateUrl: 'app/modules/project/project-tasks/detail/partials/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.editTaskDetail = function(form) {
        if (form.$valid) {
            $scope.task.editType = "edit-task";
            $scope.updateTask($scope.task, $scope.task.editType);
        } else {
            $scope.showToast("There Has Been An Error...");
            return;
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
        $scope.task.newMembers = _.filter($scope.membersList, {select: true});
        if ($scope.task.newMembers.length > 0) {
            $scope.task.editType = "assign";
            $scope.updateTask($scope.task, $scope.task.editType);
        } else {
            $scope.showToast("Please select At Least 1 Assignee...");
            return false;
        }
    };

    $scope.updateTask = function(task, updateType) {
        taskService.update({id: task._id}, task).$promise.then(function(res) {
            if (updateType == "complete-task" || updateType == "uncomplete-task") {
                $scope.showToast((res.completed)?"Task Has Been Marked Completed.":"Task Has Been Marked Incomplete.");
            } else if (updateType == "edit-task") {
                $scope.showToast("Task Has Been Updated Successfully.");
            } else if (updateType == "assign") {
                $scope.showToast("Task Has Been Updated Successfully.");
            }
            delete task.editType;
            $rootScope.$broadcast("Task.Updated", res);
            $scope.closeModal();
        }, function(err) {
            $scope.showToast("There Has Been An Error...");
            delete task.editType;
        });
    };

    $scope.createRelatedThread = function(form) {
        if (form.$valid) {
            $scope.relatedThread.members = _.filter($scope.invitees, {select: true});
            $scope.relatedThread.type = "task-project";
            $scope.relatedThread.belongTo = $scope.task._id;
            $scope.relatedThread.belongToType = "task";
            if ($scope.relatedThread.members.length > 0) {
                messageService.create({id: $stateParams.id}, $scope.relatedThread).$promise.then(function(res) {
                    $scope.closeModal();
                    $scope.showToast("Create new related thread successfully");
                    $state.go("project.messages.detail", {id: $stateParams.id, messageId: res._id});
                }, function(err){$scope.showToast("error");})
            } else {
                $scope.showToast("Please select at least 1 invitee");
                return false;
            }
        } else {
            $scope.showToast("Please check your input again.");
            return;
        }
    };

    $scope.setRelatedFile = function() {
        $scope.relatedFile = {
            files:[],
            tags:[],
            belongTo: $scope.task._id,
            belongToType: "task"
        };
    }
    $scope.setRelatedFile();

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            // add max files for multiple pick
            // {maxFiles: 5},
            onSuccess
        );
    };

    function onSuccess(file){
        file.type = "file";
        $scope.relatedFile.files.push(file);
    };

    $scope.createRelatedFile = function() {
        $scope.relatedFile.members = _.filter($scope.invitees, {select: true});
        $scope.relatedFile.tags = _.filter($scope.tags, {select: true});
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
                $scope.setRelatedFile();
                $state.go("project.files.detail", {id: res[0].project, fileId: res[0]._id});
            }, function(err) {$scope.showToast("Error");});
        }
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    getProjectMembers($stateParams.id);
    $rootScope.$on("Task.Updated", function(event, data) {
        $scope.task = data;
        $scope.task.dateEnd = new Date($scope.task.dateEnd);
        getProjectMembers($stateParams.id);
    });

    socket.emit("join", task._id);
    socket.on("task:update", function(data) {
        $scope.task = data;
        $scope.task.dateEnd = new Date($scope.task.dateEnd);
        notificationService.markItemsAsRead({id: $stateParams.taskId}).$promise.then();
    });
});