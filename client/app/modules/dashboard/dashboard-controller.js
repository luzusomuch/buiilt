angular.module('buiiltApp').controller('dashboardCtrl', function($rootScope, $scope, $timeout, $q, $state, projectService, myTasks, myMessages, myFiles, notificationService) {
	$rootScope.title = "Dashboard";
	$scope.myTasks = myTasks;
	$scope.myMessages = myMessages;
	$scope.myFiles = myFiles;
	
    $scope.openLocation = function(item, type) {
        notificationService.read({_id : item._id}).$promise.then(function() {
            if (type === "thread") 
                $state.go("project.messages.detail", {id: item.project, messageId: item._id});
            else if (type === "file") {
                $state.go("project.files.detail", {id: item.project, fileId: item._id});
            } else if (type === "document") {
                $state.go("project.documentation.detail", {id: item.project, documentId: item._id});
            }
        });
    };

    // filter for thread
    $scope.searchThread = function(thread) {
        if ($scope.name && $scope.name.length > 0) {
            var found = false;
            if (thread.name.toLowerCase().indexOf($scope.name) > -1 || thread.name.indexOf($scope.name) > -1) {
                found = true
            }
            return found;
        } else if ($scope.recipient && $scope.recipient.length > 0) {
            var found = false;
            if (thread.members && thread.members.length > 0) {
                _.each(thread.members, function(member) {
                    if ((member.name.toLowerCase().indexOf($scope.recipient) > -1 || member.name.indexOf($scope.recipient) > -1) || (member.email.toLowerCase().indexOf($scope.recipient) > -1 || member.email.indexOf($scope.recipient) > -1)) {
                        found = true;
                    }
                });
            }
            if (thread.notMembers && thread.notMembers.length > 0) {
                _.each(thread.notMembers, function(email) {
                    if (email.toLowerCase().indexOf($scope.recipient) > -1) {
                        found = true;
                    }
                });
            }
            return found;
        } else if ($scope.reply && $scope.reply.length > 0) {
            var found = false;
            _.each(thread.messages, function(message) {
                if (message.text.toLowerCase().indexOf($scope.reply) > -1 || message.text.indexOf($scope.reply) > -1) {
                    found = true;
                }
            });
            return found;
        } else {
            return true;
        }
    };

    // filter for task
    $scope.dueDate = [{text: "today", value: "today"}, {text: "tomorrow", value: "tomorrow"}, {text: "this week", value: "thisWeek"}, {text: "next week", value: "nextWeek"}];
    $scope.assignStatus = [{text: "to me", value: "toMe"}, {text: "byMe", value: "byMe"}];
    $scope.dueDateFilter = [];
    $scope.selectDueDate = function(dateEnd) {
        $scope.dateEnd = dateEnd;
        $scope.dueDateFilter = [];
    };

    $scope.selectFilterTag = function(index, type) {
        if (type === "status") {
            $scope.dueDateFilter = [];
            $scope.dateEnd = null;
            _.each($scope.dueDate, function(date) {
                date.select = false;
            });
            $scope.assignStatus[index].select = !$scope.assignStatus[index].select;
            if (index === 0) {
                $scope.assignStatus[1].select = false;
            } else {
                $scope.assignStatus[0].select = false;
            }
            if ($scope.assignStatus[index].select) {
                $scope.status = $scope.assignStatus[index].value;
            } else {
                $scope.status = null;
            }
        } else {
            $scope.status = null;
            _.each($scope.assignStatus, function(status) {
                status.select = false;
            });
            $scope.dueDate[index].select = !$scope.dueDate[index].select;
            if ($scope.dueDate[index].select) {
                $scope.dueDateFilter.push($scope.dueDate[index].value);
            } else {
                $scope.dueDateFilter.splice(_.indexOf($scope.dueDateFilter, $scope.dueDate[index].value), 1);
            }
        }
    };

    $scope.searchTask = function(task) {
        var found = false
        var taskDueDate = moment(task.dateEnd).format("YYYY-MM-DD");
        if ($scope.description && $scope.description.length > 0) {
            if (task.description.toLowerCase().indexOf($scope.description) > -1 || task.description.indexOf($scope.description) > -1) {
                found = true;
            }
            return found;
        } else if ($scope.dateEnd) {
            if (moment(moment($scope.dateEnd).format("YYYY-MM-DD")).isSame(taskDueDate)) {
                found = true;
            }
            return found;
        } else if ($scope.status && $scope.status.length > 0) {
            if ($scope.status === "toMe") {
                found = (_.findIndex(task.members, function(member) {
                    if (member._id) {
                        return member._id.toString()===$rootScope.currentUser._id.toString();
                    }
                }) !== -1) ? true : false;
            } else if ($scope.status === "byMe") {
                if (task.owner._id.toString()===$rootScope.currentUser._id.toString()) {
                    found = true
                }
            }
            return found;
        } else if ($scope.dueDateFilter && $scope.dueDateFilter.length > 0) {
            _.each($scope.dueDateFilter, function(filter) {
                switch (filter) {
                    case "today":
                        var today = moment(new Date()).format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSame(today)) {
                            found = true;
                        }
                    break;

                    case "tomorrow":
                        var tomorrow = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSame(tomorrow)) {
                            found = true;
                        }
                    break;

                    case "thisWeek":
                        var thisWeekStartDate = moment().startOf('week').format("YYYY-MM-DD");
                        var thisWeekEndDate = moment().endOf('week').format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSameOrAfter(thisWeekStartDate) && moment(taskDueDate).isSameOrBefore(thisWeekEndDate)) {
                            found = true;
                        }
                    break;

                    case "nextWeek":
                        var nextWeekStartDate = moment().startOf("week").add(7, "days").format("YYYY-MM-DD");
                        var nextWeekEndDay = moment().endOf("week").add(7, "days").format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSameOrAfter(nextWeekStartDate) && moment(taskDueDate).isSameOrBefore(nextWeekEndDay)) {
                            found = true;
                        }
                    break;

                    default:
                    break;
                }
            });
            return found;
        } else
            return true;
    };

    // filter files
    $scope.selectChip = function(index, type) {
        if (type === "file")
            $scope.fileTags[index].select = !$scope.fileTags[index].select;
        else if (type === "document") 
            $scope.documentTags[index].select =!$scope.documentTags[index].select;
    };

    $scope.fileTags = [];
    _.each($rootScope.currentTeam.fileTags, function(tag) {
        $scope.fileTags.push({name: tag, select: false});
    });

    $scope.filterTags = [];
    $scope.selectFileFilterTag = function(tagName) {
        var tagIndex = _.indexOf($scope.filterTags, tagName);
        if (tagIndex !== -1) {
            $scope.filterTags.splice(tagIndex, 1);
        } else 
            $scope.filterTags.push(tagName);
    };

    $scope.searchFile = function(file) {
        var found = false;
        if (($scope.name && $scope.name.length > 0) || ($scope.recipient && $scope.recipient.length > 0)) {
            if ($scope.name) {
                if (file.name.toLowerCase().indexOf($scope.name) > -1 || file.name.indexOf($scope.name) > -1) {
                    found = true;
                }
            } else if ($scope.recipient) {
                if (_.findIndex(file.members, function(member) {
                    return ((member.name.toLowerCase().indexOf($scope.recipient) > -1 || member.name.indexOf($scope.recipient) > -1) || (member.email.toLowerCase().indexOf($scope.recipient) > -1 || member.email.indexOf($scope.recipient) > -1));
                }) !== -1) {
                    found = true;
                } else if (_.findIndex(file.notMembers, function(member) {
                    return member.indexOf($scope.recipient) > -1;
                }) !== -1) {
                    found = true;
                }
            } 
            return found;
        } else if ($scope.filterTags.length > 0) {
            _.each($scope.filterTags, function(tag) {
                if (_.indexOf(file.tags, tag) !== -1) {
                    found = true;
                }
            })
            return found;
        } else
            return true;
    };

    // filter for document
    $scope.documentTags = [];
    _.each($rootScope.currentTeam.documentTags, function(tag) {
        $scope.documentTags.push({name: tag, select: false});
    });

    $scope.filterTags = [];
    $scope.selectDocumentFilterTag = function(tagName) {
        var tagIndex = _.indexOf($scope.filterTags, tagName);
        if (tagIndex !== -1) {
            $scope.filterTags.splice(tagIndex, 1);
        } else 
            $scope.filterTags.push(tagName);
    };

    $scope.filterDocument = function(document) {
        var found = false;
        if ($scope.name && $scope.name.length > 0) {
            if (document.name.toLowerCase().indexOf($scope.name) > -1 || document.name.indexOf($scope.name) > -1) {
                found = true;
            }
            return found;
        } else if ($scope.filterTags.length > 0) {
            _.each($scope.filterTags, function(tag) {
                if (_.indexOf(document.tags, tag) !== -1) {
                    found = true;
                }
            });
            return found;
        } else 
            return true;
    };
});