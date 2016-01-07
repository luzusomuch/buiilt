angular.module('buiiltApp').controller('dashboardCtrl', function($rootScope, $scope, $timeout, $q, $state, projectService, myTasks, myMessages, myFiles) {
	$rootScope.title = "Dashboard";
	$scope.myTasks = myTasks;
	$scope.myMessages = myMessages;
	$scope.myFiles = myFiles;
	$scope.search = false;
	// type can be a task, message, file or document
	var type = $state.current.name.split(".")[1];
    $scope.results = [];
	
	//Placeholder Set of Filters to use for layout demo
	$scope.dashboardFilters = [];
	$scope.querySearch = function(value) {
		if (type === 'tasks') {
			var tasks = angular.copy($scope.myTasks);
        	var results = value ? tasks.filter(createFilter(value)) : [];
		} else if (type === 'messages') {
			var messages = angular.copy($scope.myMessages);
        	var results = value ? messages.filter(createFilter(value)) : [];
		} else if (type === 'files') {
			var files = angular.copy($scope.myFiles);
        	var results = value ? files.filter(createFilter(value)) : [];
		} else if (type === 'documentation') {
			var files = angular.copy($scope.myFiles);
        	var results = value ? files.filter(createFilter(value)) : [];
		}
        $rootScope.filterResults = results;
        filterByProject(results);
        return results;
    };

    if ($rootScope.filterResults && $rootScope.filterResults.length > 0) {
    	filterByProject($rootScope.filterResults);
    }

    if ($rootScope.dashboardFilters && $rootScope.dashboardFilters.length > 0) {
    	$scope.search = true;
    	$scope.dashboardFilters = $rootScope.dashboardFilters;
    	_.each($scope.dashboardFilters, function(item) {
    		if (item) {
    			$scope.querySearch(item.project.name)
    		}
    	});
    }

    function createFilter(query) {
        return function filterFn(item) {
        	return item.project.name.toLowerCase().indexOf(query) > -1;
        };
    };

    function filterByProject(results) {
    	if (type === 'tasks') {
    		_.each($scope.myTasks, function(task) {
    			if (_.last(results)) {
		        	if (task.project._id.toString() === _.last(results).project._id.toString()) {
                        getHandleArr(task);
		        	}
    			}
	        });
    	} else if (type === 'messages') {
    		_.each($scope.myMessages, function(message) {
    			if (_.last(results)) {
		        	if (message.project._id.toString() === _.last(results).project._id.toString()) {
		        		getHandleArr(message);
		        	}
    			}
	        });
    	} else if (type === 'files') {
    		_.each($scope.myFiles, function(file) {
    			if (_.last(results)) {
		        	if (file.project._id.toString() === _.last(results).project._id.toString()) {
		        		getHandleArr(file);
		        	}
    			}
	        });
    	} else if (type === 'documentation') {
    		_.each($scope.myFiles, function(file) {
    			if (_.last(results)) {
		        	if (file.project._id.toString() === _.last(results).project._id.toString()) {
		        		getHandleArr(file);
		        	}
    			}
	        });
    	}
    };

    $scope.addChip = function() {
        $scope.search = true;
        $rootScope.dashboardFilters = $scope.dashboardFilters;
    };

    $scope.removeChip = function() {
        if ($rootScope.dashboardFilters.length === 0) {
            $scope.search = false;
        }
    };

    var lastFilterResults = [];
    $scope.selectedChip = function(chip) {
        chip.select = !chip.select;
        $scope.search = true;
        var user = $rootScope.currentUser;
        if (chip.select) {
            if (chip.place === "task") {
                switch (chip.value) {
                    case "assignedToMe":
                        _.each($scope.myTasks, function(task) {
                            if (_.findIndex(task.assignees, function(assignee) {
                                return assignee._id == user._id;
                            }) !== -1) {
                                lastFilterResults.push(task);
                                getHandleArr(task);
                            }
                        });
                    break;

                    case "assignedByMe":
                        _.each($scope.myTasks, function(task) {
                            if (task.user && task.user._id == user._id) {
                                lastFilterResults.push(task);
                                getHandleArr(task);
                            }
                        });
                    break;

                    case "dueToDay":
                        _.each($scope.myTasks, function(task) {
                            if (moment(moment(task.dateEnd).format("YYYY-MM-DD")).isSame(moment(new Date()).format("YYYY-MM-DD"))) {
                                lastFilterResults.push(task);
                                getHandleArr(task);
                            }
                        });
                    break;

                    case "dueTomorrow":
                        var tomorrow = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
                        _.each($scope.myTasks, function(task) {
                            var dateEnd = moment(task.dateEnd).format("YYYY-MM-DD");
                            if (moment(dateEnd).isSame(tomorrow)) {
                                lastFilterResults.push(task);
                                getHandleArr(task);
                            }
                        });
                    break;

                    case "dueThisWeek":
                        _.each($scope.myTasks, function(task) {
                            var currentWeek = getWeek(new Date());
                            _.each(currentWeek, function(day) {
                                if (moment(moment(new Date(day)).format("YYYY-MM-DD")).isSame(moment(new Date(task.dateEnd)).format("YYYY-MM-DD"))) {
                                    lastFilterResults.push(task);
                                    getHandleArr(task);
                                }
                            });
                        });
                    break;

                    default:
                    break;
                }
            } else if (chip.place === "message") {
                switch (chip.value) {
                    case "createdByMe":
                        _.each($scope.myMessages, function(item) {
                            if (item.owner == user._id) {
                                lastFilterResults.push(item);
                                getHandleArr(item);
                            }
                        });
                    break;

                    case "mentionsMe":
                        _.each($scope.myMessages, function(item) {
                            if (item.messages.length > 0) {
                                _.each(item.messages, function(message) {
                                    if (message.mentions && message.mentions.length > 0) {
                                        if (_.indexOf(message.mentions, user._id) !== -1) {
                                            lastFilterResults.push(item);
                                            getHandleArr(item);
                                            return false;
                                        }
                                    }
                                });
                            }
                        });
                    break;

                    default:
                    break;
                }
            }
        } else {
            if (lastFilterResults.length > 0 && $scope.results.length > 0) {
                _.each(lastFilterResults, function(index, result) {
                    $scope.results = _.remove($scope.results, function(item) {
                        return item._id == result._Id;
                    });
                    lastFilterResults.splice(index, 1);
                    if ($scope.results.length == 0) {
                        $scope.search = false;
                    }
                });
            } else {
                $scope.search = false;
            }
        }
    };

    $scope.messageChips = [
        {place: "message", value: "createdByMe", text: "CREATED BY ME", select: false},
        {place: "message", value: "mentionsMe", text: "MENTIONS ME", select: false}
    ];
    $scope.taskChips = [
        {place: "task", value: "assignedToMe", text: "Assigned to Me", select: false},
        {place: "task", value: "assignedByMe", text: "Assigned by Me", select: false},
        {place: "task", value: "dueToDay", text: "Due Today", select: false},
        {place: "task", value: "dueTomorrow", text: "Due Tomorrow", select: false},
        {place: "task", value: "dueThisWeek", text: "Due This Week", select: false}
    ];
    $scope.fileChips = [
        {place: "file", value: "mine", text: "Mine", select: false},
        {place: "file", value: "myTeam", text: "My Teams", select: false}
    ];

    function getWeek(fromDate){
        var sunday = new Date(fromDate.setDate(fromDate.getDate()-fromDate.getDay()))
            ,result = [new Date(sunday)];
        while (sunday.setDate(sunday.getDate()+1) && sunday.getDay()!==0) {
            result.push(new Date(sunday));
        }
        return result;
    };

    function getHandleArr(item) {
        $scope.results.push(item);
        return $scope.results = _.uniq($scope.results, '_id');
    };
});