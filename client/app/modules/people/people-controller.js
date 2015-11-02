angular.module('buiiltApp')
.controller('PeopleCtrl', function ($scope, $rootScope, team, currentUser, builderPackage, teamService, filepickerService, uploadService, $stateParams, $state, fileService, peopleService, taskService, peopleChatService, authService, socket, notificationService, $timeout) {
    $scope.team = team;
    $scope.builderPackage = builderPackage;
    $scope.currentUser = currentUser;
    $scope.submitted = false;  
    $scope.selectedUser = {};
    $scope.accordian = 1;

    if ($scope.team._id) {
        $scope.availableTeamMember = $scope.team.leader;
        _.each($scope.team.member, function(member) {
            if (member._id && member.status == 'Active') {
                $scope.availableTeamMember.push(member._id);
            }
        });
    }

    function getAvailableUser(invitePeople) {
        console.log(invitePeople);
        $scope.currentUser.hasSelect = false;
        $scope.availableUserType = [];
        $scope.currentTeamMembers = [];
        $scope.available = [];
        _.each(invitePeople.builders, function(builder){
            if (builder._id) {
                $scope.available.push(builder._id);
                _.each(builder.teamMember, function(member) {
                    $scope.available.push(member);
                });
            }
        });
        _.each(invitePeople.architects, function(architect){
            if (architect._id) {
                $scope.available.push(architect._id);
                _.each(architect.teamMember, function(member) {
                    $scope.available.push(member);
                });
            }
        });
        _.each(invitePeople.clients, function(client){
            if (client._id) {
                $scope.available.push(client._id);
                _.each(client.teamMember, function(member) {
                    $scope.available.push(member);
                });
            }
        });
        _.each(invitePeople.subcontractors, function(subcontractor){
            if (subcontractor._id) {
                $scope.available.push(subcontractor._id);
                _.each(subcontractor.teamMember, function(member) {
                    $scope.available.push(member);
                });
            }
        });
        _.each(invitePeople.consultants, function(consultant){
            if (consultant._id) {
                $scope.available.push(consultant._id);
                _.each(consultant.teamMember, function(member) {
                    $scope.available.push(member);
                });
            }
        });
        $scope.available = _.uniq($scope.available, '_id');
        if ($scope.available.length > 1) {
            $scope.selectUser($scope.available[1], '');
        }

        if (_.findIndex(invitePeople.builders, function(item) {
            if (item._id) {
                return item._id._id == $scope.currentUser._id;
            }}) != -1) {
            $scope.currentUser.type = 'builder';
        } else if (_.findIndex(invitePeople.architects, function(item) {
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'architect';
        } else if (_.findIndex(invitePeople.clients, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'client';
        } else if (_.findIndex(invitePeople.subcontractors, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'subcontractor';
        } else if (_.findIndex(invitePeople.consultants, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'consultant';
        } else {
            _.each(invitePeople.builders, function(item) {
                if (_.findIndex(item.teamMember, function(member) {
                    return member._id == $scope.currentUser._id;
                }) != -1) {
                    $scope.currentUser.type = 'builder';
                    return false;
                }
            });

            _.each(invitePeople.clients, function(item) {
                if (_.findIndex(item.teamMember, function(member) {
                    return member._id == $scope.currentUser._id;
                }) != -1) {
                    $scope.currentUser.type = 'client';
                    return false;
                }
            });

            _.each(invitePeople.architects, function(item) {
                if (_.findIndex(item.teamMember, function(member) {
                    return member._id == $scope.currentUser._id;
                }) != -1) {
                    $scope.currentUser.type = 'architect';
                    return false;
                }
            });

            _.each(invitePeople.subcontractors, function(item) {
                if (_.findIndex(item.teamMember, function(member) {
                    return member._id == $scope.currentUser._id;
                }) != -1) {
                    $scope.currentUser.type = 'subcontractor';
                    return false;
                }
            });

            _.each(invitePeople.consultants, function(item) {
                if (_.findIndex(item.teamMember, function(member) {
                    return member._id == $scope.currentUser._id;
                }) != -1) {
                    $scope.currentUser.type = 'consultant';
                    return false;
                }
            });
        }

        if ($scope.builderPackage.projectManager.type == 'architect') {
            switch ($scope.currentUser.type) {
                case 'client': 
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}, 
                        {value: 'addConsultant', text: 'consultant'}
                    ];
                    break;
                case 'builder':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}, 
                        {value: 'addSubcontractor', text: 'subcontractor'}, 
                        {value: 'addConsultant', text: 'consultant'}
                    ];
                    break;
                case 'architect':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}, 
                        {value: 'addClient', text: 'client'}, 
                        {value: 'addBuilder', text: 'builder'}, 
                        {value: 'addConsultant', text: 'consultant'}
                    ];
                    break;
                case 'subcontractor':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}
                    ];
                    break;
                case 'consultant':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}
                    ];
                    break;
                default: 
                    break;
            }
        } else if ($scope.builderPackage.projectManager.type == 'builder') {
            switch ($scope.currentUser.type) {
                case 'client': 
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}, 
                        {value: 'addConsultant', text: 'consultant'}
                    ];
                    break;
                case 'builder':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}, 
                        {value: 'addClient', text: 'client'}, 
                        {value: 'addArchitect', text: 'architect'}, 
                        {value: 'addSubcontractor', text: 'subcontractor'}, 
                        {value: 'addConsultant', text: 'consultant'}
                    ];
                    break;
                case 'architect':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}, 
                        {value: 'addConsultant', text: 'consultant'}
                    ];
                    break;
                case 'subcontractor':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}
                    ];
                    break;
                case 'consultant':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}
                    ];
                    break;
                default: 
                    break;
            }
        } else {
            switch ($scope.currentUser.type) {
                case 'client': 
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}, 
                        {value: 'addBuilder', text: 'builder'}, 
                        {value: 'addArchitect', text: 'architect'}, 
                        {value: 'addConsultant', text: 'consultant'}
                    ];
                    break;
                case 'builder':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}, 
                        {value: 'addSubcontractor', text: 'subcontractor'}, 
                        {value: 'addConsultant', text: 'consultant'}
                    ];
                    break;
                case 'architect':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}, 
                        {value: 'addConsultant', text: 'consultant'}
                    ];
                    break;
                case 'subcontractor':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}
                    ];
                    break;
                case 'consultant':
                    $scope.availableUserType = [
                        {value: 'addTeamMember', text: 'team'}
                    ];
                    break;
                default: 
                    break;
            }
        }

        if ($scope.currentUser.type == 'builder') {
            _.each(invitePeople.builders, function(builder) {
                if (builder._id) {
                    if (builder._id._id == $scope.currentUser._id) {
                        $scope.currentTeamMembers.push(builder._id);
                        _.each(builder.teamMember, function(member) {
                            $scope.currentTeamMembers.push(member);
                        });
                    }
                }
            });
            _.each(invitePeople.builders, function(builder) {
                if (builder._id) {
                    if (builder._id._id == $scope.currentUser._id && builder.hasSelect) {
                        $scope.currentUser.hasSelect = true;
                    }
                }
            });
        } else if ($scope.currentUser.type == 'client') {
            _.each(invitePeople.clients, function(client) {
                if (client._id) {
                    if (client._id._id == $scope.currentUser._id) {
                        $scope.currentTeamMembers.push(client._id);
                        _.each(client.teamMember, function(member) {
                            $scope.currentTeamMembers.push(member);
                        });
                    }
                }
            });
            _.each(invitePeople.clients, function(client) {
                if (client._id) {
                    if (client._id._id == $scope.currentUser._id && client.hasSelect) {
                        $scope.currentUser.hasSelect = true;
                    }
                }
            });
        } else if ($scope.currentUser.type == 'architect') {
            _.each(invitePeople.architects, function(architect) {
                if (architect._id) {
                    if (architect._id._id == $scope.currentUser._id) {
                        $scope.currentTeamMembers.push(architect._id);
                        _.each(architect.teamMember, function(member) {
                            $scope.currentTeamMembers.push(member);
                        });
                    }
                }
            });
            _.each(invitePeople.architects, function(architect) {
                if (architect._id) {
                    if (architect._id._id == $scope.currentUser._id && architect.hasSelect) {
                        $scope.currentUser.hasSelect = true;
                    }
                }
            });
        } else if ($scope.currentUser.type == 'subcontractor') {
            _.each(invitePeople.subcontractors, function(subcontractor) {
                if (subcontractor._id) {
                    if (subcontractor._id._id == $scope.currentUser._id) {
                        $scope.currentTeamMembers.push(subcontractor._id);
                        _.each(subcontractor.teamMember, function(member) {
                            $scope.currentTeamMembers.push(member);
                        });
                    }
                }
            });
        } else if ($scope.currentUser.type == 'consultant') {
            _.each(invitePeople.consultants, function(consultant) {
                if (consultant._id) {
                    if (consultant._id._id == $scope.currentUser._id) {
                        $scope.currentTeamMembers.push(consultant._id);
                        _.each(consultant.teamMember, function(member) {
                            $scope.currentTeamMembers.push(member);
                        });
                    }
                }
            });
        }
        console.log($scope.currentUser);

        switch ($scope.currentUser.type) {
            case 'builder':
                var builders = [];
                _.each(invitePeople.builders, function(builder) {
                    if (builder._id) {
                        if (builder._id._id == $scope.currentUser._id || _.findIndex(builder.teamMember, function(item){ return item._id == $scope.currentUser._id;}) != -1) {
                            builders.push(builder._id);
                            _.each(builder.teamMember, function(member) {
                                builders.push(member);
                            });
                        }
                    }
                });
                invitePeople.builders = builders;
                $scope.currentTeamMembers = builders;

                var subcontractors = [];
                _.each(invitePeople.subcontractors, function(subcontractor) {
                    if (subcontractor._id) {
                        subcontractor._id.inviter = subcontractor.inviter._id;
                        subcontractor._id.hasSelect = subcontractor.hasSelect;
                        subcontractors.push(subcontractor._id);
                    }
                });
                invitePeople.subcontractors = subcontractors;

                var consultants = [];
                _.each(invitePeople.consultants, function(consultant) {
                    if (consultant._id) {
                        consultant._id.inviter = consultant.inviter._id;
                        consultant._id.hasSelect = consultant.hasSelect;
                        if (consultant._id && consultant._id.inviter == $scope.currentUser._id) {
                            consultants.push(consultant._id);
                        }
                    }
                });
                invitePeople.consultants = consultants;
                break;

            case 'architect':
                var architects = [];
                _.each(invitePeople.architects, function(architect) {
                    if (architect._id) {
                        if (architect._id._id == $scope.currentUser._id || _.findIndex(architect.teamMember, function(item){ return item._id == $scope.currentUser._id;}) != -1) {
                            architects.push(architect._id);
                            _.each(architect.teamMember, function(member) {
                                architects.push(member);
                            });
                        }
                    }
                });
                invitePeople.architects = architects;
                $scope.currentTeamMembers = architects;

                var consultants = [];
                _.each(invitePeople.consultants, function(consultant) {
                    if (consultant._id) {
                        consultant._id.inviter = consultant.inviter._id;
                        consultant._id.hasSelect = consultant.hasSelect;
                        if (consultant._id && consultant._id.inviter == $scope.currentUser._id) {
                            consultants.push(consultant._id);
                        }
                    }
                });
                invitePeople.consultants = consultants;
                break;

            case 'client':
                var clients = [];
                _.each(invitePeople.clients, function(client) {
                    if (client._id) {
                        if (client._id._id == $scope.currentUser._id || _.findIndex(client.teamMember, function(item){ return item._id == $scope.currentUser._id;}) != -1) {
                            clients.push(client._id);
                            _.each(client.teamMember, function(member) {
                                clients.push(member);
                            });
                        }
                    }
                });
                invitePeople.clients = clients;
                $scope.currentTeamMembers = clients;

                var consultants = [];
                _.each(invitePeople.consultants, function(consultant) {
                    if (consultant._id) {
                        consultant._id.inviter = consultant.inviter._id;
                        consultant._id.hasSelect = consultant.hasSelect;
                        if (consultant._id && consultant._id.inviter == $scope.currentUser._id) {
                            consultants.push(consultant._id);
                        }
                    }
                });
                invitePeople.consultants = consultants;
                break;

            case 'subcontractor':
                var subcontractors = [];
                _.each(invitePeople.subcontractors, function(subcontractor) {
                    if (subcontractor._id) {
                        if (subcontractor._id._id == $scope.currentUser._id || _.findIndex(subcontractor.teamMember, function(item){ return item._id == $scope.currentUser._id;}) != -1) {
                            subcontractors.push(subcontractor._id);
                            _.each(subcontractor.teamMember, function(member) {
                                subcontractors.push(member);
                            });
                        }
                        invitePeople.inviter = subcontractor.inviter;
                    }
                });
                invitePeople.subcontractors = subcontractors;
                $scope.currentTeamMembers = subcontractors;
                break;
            case 'consultant':
                var consultants = [];
                _.each(invitePeople.consultants, function(consultant) {
                    if (consultant._id) {
                        if (consultant._id._id == $scope.currentUser._id || _.findIndex(consultant.teamMember, function(item){ return item._id == $scope.currentUser._id;}) != -1) {
                            consultants.push(consultant._id);
                            _.each(consultant.teamMember, function(member) {
                                consultants.push(member);
                            });
                        }
                        invitePeople.inviter = subcontractor.inviter;
                    }
                });
                invitePeople.consultants = consultants;
                $scope.currentTeamMembers = consultants;
                break;
            default:
                break;
        }
    };

    socket.on('onlineUser', function(users) {
        var onlineUsersList = [];
        _.each(users, function(user) {
            var index = _.findIndex($scope.available, function(item) {
                return item._id == user;
            });
            if (index != -1) {
                onlineUsersList.push(index);
            }
        });
        _.each(onlineUsersList, function(user) {
            $scope.available[user].isOnline = true;
        });
        if ($scope.invitePeople.inviter) {
            if (_.findIndex($scope.available, function(item) {
                return item._id == $scope.invitePeople.inviter._id;
            }) != -1) {
                $scope.invitePeople.inviter.isOnline = true;
            }
        }
    });

    function getTaskAndDocumentBySelectedUser(user) {
        taskService.getByPackage({id: $scope.invitePeople._id, type: 'people'}).$promise.then(function(res){
            $scope.tasks = res;
            _.each($scope.tasks, function(task){
                task.isOwner = false;
                _.each(task.assignees, function(assignee){
                    if (assignee._id == user._id) {
                        task.isOwner = true;
                    }
                });
            });
        });
        fileService.getFileInPeople({id: $stateParams.id}).$promise.then(function(res){
            $scope.files = res;
            _.each($scope.files, function(file) {
                file.isOwner = false;
                _.each(file.usersRelatedTo, function(userRelated) {
                    if (userRelated == user._id) {
                        file.isOwner = true;
                    }
                });
            });
        });
    };

    function getAllChatMessageNotificationByUserInPeople(selectedChatPeople){
        notificationService.getAllChatMessageNotificationByBoard({id: selectedChatPeople._id}).$promise.then(function(res) {
            for (var i = selectedChatPeople.messages.length - 1; i >= 0; i--) {
                selectedChatPeople.messages[i].peopleHasSeen = [];
                _.each(res, function(notification){
                    _.each(notification.element.messages, function(message) {
                        if (message._id == selectedChatPeople.messages[i]._id && !notification.unread) {
                            selectedChatPeople.messages[i].peopleHasSeen.push(notification.owner.name);
                        }
                    });
                });
                selectedChatPeople.messages[i].peopleHasSeen = _.uniq(selectedChatPeople.messages[i].peopleHasSeen);
            };
        });
    };

    $scope.getTenderListByType = function(type) {
        $scope.selectedTeamType = type;
        $scope.tendersList = [];
        if (type == 'subcontractor') {
            _.each($scope.invitePeople.subcontractors, function(subcontractor) {
                if (subcontractor._id && subcontractor.inviter == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: subcontractor, type: 'subcontractor'});
                    if (subcontractor.hasSelect) {
                        $scope.tendersList = [];
                        return false;
                    }
                }
            });
        } else if (type == 'builder') {
            _.each($scope.invitePeople.builders, function(builder) {
                if (builder._id && builder.inviter == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: builder, type: 'builder'});
                    if (builder.hasSelect) {
                        $scope.tendersList = [];
                        return false;
                    }
                }
            });
        } else if (type == 'client') {
            _.each($scope.invitePeople.clients, function(client) {
                if (client._id && client.inviter == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: client, type: 'client'});
                    if (client.hasSelect) {
                        $scope.tendersList = [];
                        return false;
                    }
                }
            });
        } else if (type == 'architect') {
            _.each($scope.invitePeople.architects, function(architect) {
                if (architect._id && architect.inviter == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: architect, type: 'architect'});
                    if (architect.hasSelect) {
                        $scope.tendersList = [];
                        return false;
                    }
                }
            });
        } else if (type == 'consultant') {
            _.each($scope.invitePeople.consultants, function(consultant) {
                if (consultant._id && consultant.inviter == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: consultant, type: 'consultant'});
                    if (consultant.hasSelect) {
                        $scope.tendersList = [];
                        return false;
                    }
                }
            });
        }
    };

    $scope.selectWinnerTender = function(tender) {
        peopleService.selectWinnerTender({id: $stateParams.id}, tender).$promise.then(function(res) {
            $scope.invitePeople = res;
            getAvailableUser(res);
            $("#view_tender_detail").closeModal();
        }, function(err) {
            console.log(err);
        });
    };

    peopleService.getInvitePeople({id: $stateParams.id}).$promise.then(function(res){
        $scope.invitePeople = res;
        console.log(res);
        getAvailableUser($scope.invitePeople);
    });

    $scope.setInvite = function() {
        $scope.invite = {
            isTender : true,
            isInviteTeamMember: false,
            teamMember: [],
            invitees: []
        };
    };

    $scope.getChangeTypeValue = function(type) {
        if (type == 'addTeamMember' || type == 'addClient') {
            $scope.invite.isTender = false;
            if (type == 'addTeamMember') {
                $scope.invite.isInviteTeamMember = true;
            } else {
                $scope.invite.isInviteTeamMember = false;
            }
        } else {
            $scope.invite.isTender = true;
            $scope.invite.isInviteTeamMember = false;
        }
    };

    $scope.addInvitee = function(invitee) {
        if (invitee && invitee != '') {
            $scope.invite.invitees.push({email: invitee});
            $scope.invite.email = null;
        }
    };
    $scope.removeInvitee = function(index) {
        $scope.invite.invitees.splice(index, 1);
    };

    $scope.inviteTeamMember = function(member, index) {
        $scope.invite.teamMember.push(member);
        $scope.availableTeamMember.splice(index,1);
        member.canRevoke = true;
    };
    $scope.revokeTeamMember = function(member, index) {
        $scope.availableTeamMember.push(member);
        $scope.invite.teamMember.splice(index, 1);
        member.canRevoke = false;
    };

    $scope.inviteMorePeople = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            if ($scope.invite.type == 'addTeamMember') {
                switch ($scope.currentUser.type) {
                    case 'builder':
                        $scope.invite.type = 'addBuilder';
                        break;
                    case 'client':
                        $scope.invite.type = 'addClient';
                        break;
                    case 'architect':
                        $scope.invite.type = 'addArchitect';
                        break;
                    case 'subcontractor':
                        $scope.invite.type = 'addSubcontractor';
                        break;
                    case 'consultant':
                        $scope.invite.type = 'addConsultant';
                        break;
                    default:
                        break;
                }
                peopleService.update({id: $stateParams.id},$scope.invite).$promise.then(function(res){
                    $scope.invitePeople = res;
                    getAvailableUser($scope.invitePeople);
                    $scope.submitted = false;
                    $("#tender_modal").closeModal();
                }, function(res){
                    console.log(res);
                });
            } else {
                peopleService.update({id: $stateParams.id},$scope.invite).$promise.then(function(res){
                    $scope.invitePeople = res;
                    getAvailableUser($scope.invitePeople);
                    $scope.submitted = false;
                    $("#tender_modal").closeModal();
                }, function(res){
                    console.log(res);
                });
            }
        }
    };

    $scope.uploadFile = {
        assignees : []
    };
    $scope.selectedTags = [];
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
            _id: ($scope.fileId) ? $scope.fileId : '',
            belongToType: 'people',
            tags: $scope.selectedTags,
            isQuote: $scope.isQuote,
            assignees : []
        };
        $scope.uploadFile.assignees = [$scope.selectedUser._id, $scope.currentUser._id];
    };

    $scope.uploadNewAttachment = function() {
        uploadService.uploadInPeople({id: $stateParams.id, file: $scope.uploadFile}).$promise.then(function(res){
            $('#new_attachment').closeModal();
            $state.reload();
        });
    };

    $scope.task = {
        assignees : []
    };

    $scope.addNewTask = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            var currentUser = {
                _id: $scope.currentUser._id
            };
            $scope.task.assignees = [$scope.selectedUser, currentUser];
            // $scope.task.assignees.push($scope.selectedUser);
            $timeout(function(){
                taskService.create({id: $scope.invitePeople._id, type: 'people'},$scope.task).$promise.then(function(res){
                    res.isOwner = false;
                    _.each(res.assignees, function(assignee){
                        if (assignee._id == $scope.currentUser._id) {
                            res.isOwner = true;
                        }
                    });
                    $scope.tasks.push(res);
                    $("#new_task").closeModal();
                    $scope.task = {
                        assignees : []
                    };
                    getAvailableUser($scope.invitePeople);
                    $scope.submitted = false;
                }, function(res){
                    console.log(res);
                });
            },500);
        }
    };

    $scope.selectUser = function(user, type) {
        $scope.selectedUser = user;
        $scope.selectedUser.type = type;
        getTaskAndDocumentBySelectedUser(user);

        peopleChatService.selectPeople(
            {id: $scope.invitePeople._id},
            {project: $stateParams.id, user: user._id}
        ).$promise.then(function(res){
            socket.emit('join',res._id);
            $scope.selectedChatPeople = res;
            $scope.unreadMessages = $rootScope.unreadMessages;
            var unreadMessagesNumber = 0;
            var temp = 0;
            _.each($scope.unreadMessages, function(message){
                if (message.element._id == $scope.selectedChatPeople._id && message.referenceTo == "people-chat") {
                    unreadMessagesNumber++;
                }
            });
            _.each($scope.unreadMessages, function(message){
                if (message.element._id == $scope.selectedChatPeople._id && message.referenceTo == "people-chat") {
                    $scope.selectedChatPeople.hasUnreadMessage = true;
                    for (var i = $scope.selectedChatPeople.messages.length - 1; i >= 0; i--) {
                        if ($scope.selectedChatPeople.messages[i].user._id != $scope.currentUser._id) {
                            $scope.selectedChatPeople.messages[i].unread = true;
                            temp += 1;
                        } else {
                            $scope.selectedChatPeople.messages[i].unread = false;
                        }
                        if (temp == unreadMessagesNumber) {
                            return false;
                        }
                    };
                } else {
                    $scope.selectedChatPeople.hasUnreadMessage = false;
                }
            });
            if ($scope.selectedChatPeople.hasUnreadMessage) {
                $("div#peopleChatContent").scroll(function() {
                    if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                        _.each($scope.unreadMessages, function(message){
                            if (message.element._id == $scope.selectedChatPeople._id) {
                                $timeout(function(){
                                    notificationService.markAsRead({_id: message._id}).$promise.then(function(res){
                                        $rootScope.$broadcast("notification:read", res);
                                    });
                                    $scope.selectedChatPeople.hasUnreadMessage = false;
                                    _.each($scope.selectedChatPeople.messages, function(message){
                                        message.unread = false;
                                    });
                                }, 2000);
                            }
                        });
                    }
                });
            }
            getAllChatMessageNotificationByUserInPeople($scope.selectedChatPeople);
        }, function(err){
            console.log(err);
        });
    };

    socket.on('peopleChat:new', function (peopleChat) {
        $scope.selectedChatPeople = peopleChat;
    });

    $scope.enterMessage = function ($event) {
        if ($event.keyCode === 13) {
            $event.preventDefault();
            $scope.sendMessage();
        } else if (($event.keyCode === 32 || $event.keyCode === 8) && $scope.showPopup) {
            $scope.showPopup = false;
        }
    };

    $scope.message = {};

    $scope.showPopup = false;

    $scope.getMentionValue = function(mention) {
        $scope.message.text = $scope.message.text.substring(0, $scope.message.text.length -1);
        $scope.message.text += mention.name;  
        $scope.showPopup = false;
    };

    $scope.$watch('message.text', function(newValue, oldValue) {
        $scope.mentionPeople = [];
        if (newValue) {
            if (newValue.slice(-1) == "@") {
                $scope.showPopup = true;   
            }
        }
    });

    $scope.sendMessage = function() {
        peopleChatService.sendMessage({id: $scope.selectedChatPeople._id}, $scope.message).$promise.then(function(res) {
            $scope.selectedChatPeople = res;
            $scope.message.text = null;
            getAllChatMessageNotificationByUserInPeople($scope.selectedChatPeople);
        }, function(err){
            console.log(err);
        });
    };

    $scope.downloadFile = function(file) {
        console.log(file);
        var blob = {
            url: file.path,
            filename: file.name,
            mimetype: file.mimetype,
            size: file.size
        };

        filepicker.exportFile(
            blob,
            function(Blob){
                console.log(Blob.url);
            }
        );
    };
});