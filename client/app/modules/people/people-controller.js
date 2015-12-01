angular.module('buiiltApp')
.controller('PeopleCtrl', function ($scope, $rootScope, team, currentUser, builderPackage, teamService, filepickerService, uploadService, $stateParams, $state, fileService, peopleService, taskService, peopleChatService, authService, socket, notificationService, $timeout) {
    $scope.team = team;
    $scope.builderPackage = builderPackage;
    $scope.currentUser = currentUser;
    $scope.submitted = false;  
    $scope.selectedUser = {};

    if ($scope.team._id) {
        $scope.availableTeamMember = $scope.team.leader;
        _.each($scope.team.member, function(member) {
            if (member._id && member.status == 'Active') {
                $scope.availableTeamMember.push(member._id);
            }
        });
        _.remove($scope.availableTeamMember, {_id: $scope.currentUser._id});
    }

    function getAvailableUser() {
        peopleService.getInvitePeople({id: $stateParams.id}).$promise.then(function(res){
            $scope.invitePeople = res;
            $scope.currentUser.hasSelect = false;
            $scope.availableUserType = [];
            $scope.currentTeamMembers = [];
            $scope.available = [];
            _.each($scope.invitePeople.builders, function(builder){
                if (builder._id) {
                    $scope.available.push(builder._id);
                    _.each(builder.teamMember, function(member) {
                        $scope.available.push(member);
                    });
                    if (builder._id._id == $scope.currentUser._id && builder.hasSelect) {
                        $scope.currentUser.hasSelect = true;
                    }
                }
            });
            _.each($scope.invitePeople.architects, function(architect){
                if (architect._id) {
                    $scope.available.push(architect._id);
                    _.each(architect.teamMember, function(member) {
                        $scope.available.push(member);
                    });
                    if (architect._id._id == $scope.currentUser._id && architect.hasSelect) {
                        $scope.currentUser.hasSelect = true;
                    }
                }
            });
            _.each($scope.invitePeople.clients, function(client){
                if (client._id) {
                    $scope.available.push(client._id);
                    _.each(client.teamMember, function(member) {
                        $scope.available.push(member);
                    });
                    if (client._id._id == $scope.currentUser._id && client.hasSelect) {
                        $scope.currentUser.hasSelect = true;
                    }
                }
            });
            _.each($scope.invitePeople.subcontractors, function(subcontractor){
                if (subcontractor._id) {
                    $scope.available.push(subcontractor._id);
                    _.each(subcontractor.teamMember, function(member) {
                        $scope.available.push(member);
                    });
                }
            });
            _.each($scope.invitePeople.consultants, function(consultant){
                if (consultant._id) {
                    $scope.available.push(consultant._id);
                    _.each(consultant.teamMember, function(member) {
                        $scope.available.push(member);
                    });
                }
            });
            $scope.available = _.uniq($scope.available, '_id');

            if (_.findIndex($scope.invitePeople.builders, function(item) {
                if (item._id) {
                    return item._id._id == $scope.currentUser._id;
                }}) != -1) {
                $scope.currentUser.type = 'builder';
            } else if (_.findIndex($scope.invitePeople.architects, function(item) {
                if (item._id) {return item._id._id == $scope.currentUser._id;}
                }) != -1) {
                $scope.currentUser.type = 'architect';
            } else if (_.findIndex($scope.invitePeople.clients, function(item){
                if (item._id) {return item._id._id == $scope.currentUser._id;}
                }) != -1) {
                $scope.currentUser.type = 'client';
            } else if (_.findIndex($scope.invitePeople.subcontractors, function(item){
                if (item._id) {return item._id._id == $scope.currentUser._id;}
                }) != -1) {
                $scope.currentUser.type = 'subcontractor';
            } else if (_.findIndex($scope.invitePeople.consultants, function(item){
                if (item._id) {return item._id._id == $scope.currentUser._id;}
                }) != -1) {
                $scope.currentUser.type = 'consultant';
            } else {
                _.each($scope.invitePeople.builders, function(item) {
                    if (_.findIndex(item.teamMember, function(member) {
                        return member._id == $scope.currentUser._id;
                    }) != -1) {
                        $scope.currentUser.type = 'builder';
                        return false;
                    }
                });

                _.each($scope.invitePeople.clients, function(item) {
                    if (_.findIndex(item.teamMember, function(member) {
                        return member._id == $scope.currentUser._id;
                    }) != -1) {
                        $scope.currentUser.type = 'client';
                        return false;
                    }
                });

                _.each($scope.invitePeople.architects, function(item) {
                    if (_.findIndex(item.teamMember, function(member) {
                        return member._id == $scope.currentUser._id;
                    }) != -1) {
                        $scope.currentUser.type = 'architect';
                        return false;
                    }
                });

                _.each($scope.invitePeople.subcontractors, function(item) {
                    if (_.findIndex(item.teamMember, function(member) {
                        return member._id == $scope.currentUser._id;
                    }) != -1) {
                        $scope.currentUser.type = 'subcontractor';
                        return false;
                    }
                });

                _.each($scope.invitePeople.consultants, function(item) {
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
                            {value: 'addTeamMember', text: 'Team'}, 
                            {value: 'addConsultant', text: 'Consultant'}
                        ];
                        break;
                    case 'builder':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}, 
                            {value: 'addSubcontractor', text: 'Subcontractor'}, 
                            {value: 'addConsultant', text: 'Consultant'}
                        ];
                        break;
                    case 'architect':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}, 
                            {value: 'addClient', text: 'Client'}, 
                            {value: 'addBuilder', text: 'Builder'}, 
                            {value: 'addConsultant', text: 'Consultant'}
                        ];
                        if ($scope.invitePeople.clients.length > 0) {
                            if ($scope.invitePeople.clients[0].hasSelect) {
                                _.remove($scope.availableUserType, function(item) {
                                    return item.value == 'addClient';
                                });
                            }
                        }
                        if ($scope.invitePeople.builders.length > 0) {
                            if ($scope.invitePeople.builders[0].hasSelect) {
                                _.remove($scope.availableUserType, function(item) {
                                    return item.value == 'addBuilder';
                                });
                            }
                        }
                        break;
                    case 'subcontractor':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}
                        ];
                        break;
                    case 'consultant':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}
                        ];
                        break;
                    default: 
                        break;
                }
            } else if ($scope.builderPackage.projectManager.type == 'builder') {
                switch ($scope.currentUser.type) {
                    case 'client': 
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}, 
                            {value: 'addConsultant', text: 'Consultant'}
                        ];
                        break;
                    case 'builder':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}, 
                            {value: 'addClient', text: 'Client'}, 
                            {value: 'addArchitect', text: 'Architect'}, 
                            {value: 'addSubcontractor', text: 'Subcontractor'}, 
                            {value: 'addConsultant', text: 'Consultant'}
                        ];
                        if ($scope.invitePeople.clients.length > 0) {
                            if ($scope.invitePeople.clients[0].hasSelect) {
                                _.remove($scope.availableUserType, function(item) {
                                    return item.value == 'addClient';
                                });
                            }
                        }
                        if ($scope.invitePeople.architects.length > 0) {
                            if ($scope.invitePeople.architects[0].hasSelect) {
                                _.remove($scope.availableUserType, function(item) {
                                    return item.value == 'addArchitect';
                                });
                            }
                        }
                        break;
                    case 'architect':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}, 
                            {value: 'addConsultant', text: 'Consultant'}
                        ];
                        break;
                    case 'subcontractor':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}
                        ];
                        break;
                    case 'consultant':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}
                        ];
                        break;
                    default: 
                        break;
                }
            } else {
                switch ($scope.currentUser.type) {
                    case 'client': 
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}, 
                            {value: 'addBuilder', text: 'Builder'}, 
                            {value: 'addArchitect', text: 'Architect'}, 
                            {value: 'addConsultant', text: 'Consultant'}
                        ];
                        if ($scope.invitePeople.builders.length > 0) {
                            if ($scope.invitePeople.builders[0].hasSelect) {
                                _.remove($scope.availableUserType, function(item) {
                                    return item.value == 'addBuilder';
                                });
                            }
                        }
                        if ($scope.invitePeople.architects.length > 0) {
                            if ($scope.invitePeople.architects[0].hasSelect) {
                                _.remove($scope.availableUserType, function(item) {
                                    return item.value == 'addArchitect';
                                });
                            }
                        }
                        break;
                    case 'builder':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}, 
                            {value: 'addSubcontractor', text: 'Subcontractor'}, 
                            {value: 'addConsultant', text: 'Consultant'}
                        ];
                        break;
                    case 'architect':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}, 
                            {value: 'addConsultant', text: 'Consultant'}
                        ];
                        break;
                    case 'subcontractor':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}
                        ];
                        break;
                    case 'consultant':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'Team'}
                        ];
                        break;
                    default: 
                        break;
                }
            }

            switch ($scope.currentUser.type) {
                case 'builder':
                    notificationService.get().$promise.then(function(res){
                        var builders = [];
                        _.each($scope.invitePeople.builders, function(builder) {
                            if (builder._id) {
                                if (builder._id._id == $scope.currentUser._id || _.findIndex(builder.teamMember, function(item){ return item._id == $scope.currentUser._id;}) != -1) {
                                    builders.push(builder._id);
                                    _.each(builder.teamMember, function(member) {
                                        builders.push(member);
                                    });
                                }

                                if (builder._id._id == $scope.currentUser._id) {
                                    $scope.currentUser.isLeader = true;
                                } else {
                                    $scope.currentUser.isLeader = false;
                                }
                            }
                        });
                        _.each(builders, function(builder) {
                            builder.unreadMessagesNumber = 0;
                            _.each(res, function(item) {
                                if (item.fromUser._id.toString() == builder._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                    builder.unreadMessagesNumber++;
                                } else if (item.fromUser._id.toString() == builder._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                    builder.unreadMessagesNumber++;
                                }
                            })
                        });
                        $scope.invitePeople.builders = builders;
                        $scope.currentTeamMembers = builders;
                        $scope.currentTeamMembers = _.uniq($scope.currentTeamMembers, '_id');
                        _.remove($scope.currentTeamMembers, {_id: $scope.currentUser._id});

                        $scope.teamMembersCanInvite = [];
                        _.each($scope.availableTeamMember, function(member, index) {
                            if (_.findIndex($scope.currentTeamMembers, {_id: member._id}) == -1) {
                                $scope.teamMembersCanInvite.push(member);
                            }
                        });

                        _.each($scope.invitePeople.clients, function(client) {
                            if (client._id) {
                                client.unreadMessagesNumber = 0;
                                _.each(res, function(item) {
                                    if (item.fromUser._id.toString() == client._id._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                        client.unreadMessagesNumber++;
                                    } else if (item.fromUser._id.toString() == client._id._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                        client.unreadMessagesNumber++;
                                    }
                                });
                            }
                        });

                        _.each($scope.invitePeople.architects, function(architect) {
                            if (architect._id) {
                                architect.unreadMessagesNumber = 0;
                                _.each(res, function(item) {
                                    if (item.fromUser._id.toString() == architect._id._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                        architect.unreadMessagesNumber++;
                                    } else if (item.fromUser._id.toString() == architect._id._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                        architect.unreadMessagesNumber++;
                                    }
                                });
                            }
                        });

                        _.each($scope.invitePeople.subcontractors, function(subcontractor) {
                            subcontractor.unreadMessagesNumber = 0;
                            _.each(res, function(item) {
                                if (subcontractor._id) {
                                    if (subcontractor._id.toString() == item.fromUser._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                        subcontractor.unreadMessagesNumber++;
                                    } else if (item.fromUser._id.toString() == subcontractor._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                        subcontractor.unreadMessagesNumber++;
                                    }
                                }
                            });
                        });

                        _.each($scope.invitePeople.consultants, function(consultant) {
                            consultant.unreadMessagesNumber = 0;
                            _.each(res, function(item) {
                                if (consultant._id) {
                                    if (consultant._id.toString() == item.fromUser._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                        consultant.unreadMessagesNumber++;
                                    } else if (item.fromUser._id.toString() == consultant._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                        consultant.unreadMessagesNumber++;
                                    }
                                }
                            });
                        });

                        if ($rootScope.inComingSelectThread) {
                            $scope.selectUser($rootScope.inComingSelectThread.owner,'');
                        } else if ($rootScope.inComingSelectTask) {
                            $scope.selectUser($rootScope.inComingSelectTask.user, '');
                        } else {
                            if ($scope.currentTeamMembers.length > 0) {
                                $scope.selectUser($scope.currentTeamMembers[0], 'team');
                            } else if ($scope.invitePeople.subcontractors.length > 0) {
                                $scope.selectUser($scope.invitePeople.subcontractors[0], 'subcontractor');
                            } else if ($scope.invitePeople.consultants.length > 0) {
                                $scope.selectedUser($scope.invitePeople.consultants[0], 'consultant');
                            }
                        }
                    });
                    break;

                case 'architect':
                    notificationService.get().$promise.then(function(res){
                        var architects = [];
                        _.each($scope.invitePeople.architects, function(architect) {
                            if (architect._id) {
                                if (architect._id._id == $scope.currentUser._id || _.findIndex(architect.teamMember, function(item){ return item._id == $scope.currentUser._id;}) != -1) {
                                    architects.push(architect._id);
                                    _.each(architect.teamMember, function(member) {
                                        architects.push(member);
                                    });
                                }

                                if (architect._id._id == $scope.currentUser._id) {
                                    $scope.currentUser.isLeader = true;
                                } else {
                                    $scope.currentUser.isLeader = false;
                                }
                            }
                        });
                        _.each(architects, function(architect) {
                            architect.unreadMessagesNumber = 0;
                            _.each(res, function(item) {
                                if (item.fromUser._id.toString() == architect._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                    architect.unreadMessagesNumber++;
                                }  else if (item.fromUser._id.toString() == architect._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                    architect.unreadMessagesNumber++;
                                }
                            });
                        });

                        $scope.invitePeople.architects = architects;
                        $scope.currentTeamMembers = architects;
                        $scope.currentTeamMembers = _.uniq($scope.currentTeamMembers, '_id');
                        _.remove($scope.currentTeamMembers, {_id: $scope.currentUser._id});

                        $scope.teamMembersCanInvite = [];
                        _.each($scope.availableTeamMember, function(member, index) {
                            if (_.findIndex($scope.currentTeamMembers, {_id: member._id}) == -1) {
                                $scope.teamMembersCanInvite.push(member);
                            }
                        });

                        _.each($scope.invitePeople.builders, function(builder) {
                            if (builder._id) {
                                builder.unreadMessagesNumber = 0;
                                _.each(res, function(item) {
                                    if (item.fromUser._id.toString() == builder._id._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                        builder.unreadMessagesNumber++;
                                    } else if (item.fromUser._id.toString() == builder._id._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                        builder.unreadMessagesNumber++;
                                    }
                                });
                            }
                        });

                        _.each($scope.invitePeople.clients, function(client) {
                            if (client._id) {
                                client.unreadMessagesNumber = 0;
                                _.each(res, function(item) {
                                    if (item.fromUser._id.toString() == client._id._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                        client.unreadMessagesNumber++;
                                    } else if (item.fromUser._id.toString() == client._id._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                        client.unreadMessagesNumber++;
                                    }
                                });
                            }
                        });

                        _.each($scope.invitePeople.consultants, function(consultant) {
                            consultant.unreadMessagesNumber = 0;
                            _.each(res, function(item) {
                                if (consultant._id) {
                                    if (consultant._id.toString() == item.fromUser._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                        consultant.unreadMessagesNumber++;
                                    } else if (item.fromUser._id.toString() == consultant._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                        consultant.unreadMessagesNumber++;
                                    }
                                }
                            });
                        });

                        if ($rootScope.inComingSelectThread) {
                            $scope.selectUser($rootScope.inComingSelectThread.owner,'');
                        } else if ($rootScope.inComingSelectTask) {
                            $scope.selectUser($rootScope.inComingSelectTask.user, '');
                        } else {
                            if ($scope.currentTeamMembers.length > 0) {
                                $scope.selectUser($scope.currentTeamMembers[0], 'team');
                            } else if ($scope.invitePeople.consultants.length > 0) {
                                $scope.selectUser($scope.invitePeople.consultants[0], 'consultant');
                            }
                        }
                    });
                    break;

                case 'client':
                    notificationService.get().$promise.then(function(res){
                        var clients = [];
                        _.each($scope.invitePeople.clients, function(client) {
                            if (client._id) {
                                if (client._id._id == $scope.currentUser._id || _.findIndex(client.teamMember, function(item){ return item._id == $scope.currentUser._id;}) != -1) {
                                    clients.push(client._id);
                                    _.each(client.teamMember, function(member) {
                                        clients.push(member);
                                    });
                                }

                                if (client._id._id == $scope.currentUser._id) {
                                    $scope.currentUser.isLeader = true;
                                } else {
                                    $scope.currentUser.isLeader = false;
                                }
                            }
                        });
                        _.each(clients, function(client) {
                            client.unreadMessagesNumber = 0;
                            _.each(res, function(item) {
                                if (item.fromUser._id.toString() == client._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                    client.unreadMessagesNumber++;
                                } else if (item.fromUser._id.toString() == client._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                    client.unreadMessagesNumber++;
                                }
                            });
                        });
                        $scope.invitePeople.clients = clients;
                        $scope.currentTeamMembers = clients;
                        $scope.currentTeamMembers = _.uniq($scope.currentTeamMembers, '_id');
                        _.remove($scope.currentTeamMembers, {_id: $scope.currentUser._id});

                        $scope.teamMembersCanInvite = [];
                        _.each($scope.availableTeamMember, function(member, index) {
                            if (_.findIndex($scope.currentTeamMembers, {_id: member._id}) == -1) {
                                $scope.teamMembersCanInvite.push(member);
                            }
                        });

                        _.each($scope.invitePeople.architects, function(architect) {
                            if (architect._id) {
                                architect.unreadMessagesNumber = 0;
                                _.each(res, function(item) {
                                    if (item.fromUser._id.toString() == architect._id._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                        architect.unreadMessagesNumber++;
                                    } else if (item.fromUser._id.toString() == architect._id._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                        architect.unreadMessagesNumber++;
                                    }
                                });
                            }
                        });

                        _.each($scope.invitePeople.builders, function(builder) {
                            if (builder._id) {
                                builder.unreadMessagesNumber = 0;
                                _.each(res, function(item) {
                                    if (item.fromUser._id.toString() == builder._id._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                        builder.unreadMessagesNumber++;
                                    } else if (item.fromUser._id.toString() == builder._id._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                        builder.unreadMessagesNumber++;
                                    }
                                });
                            }
                        });

                        _.each($scope.invitePeople.consultants, function(consultant) {
                            consultant.unreadMessagesNumber = 0;
                            _.each(res, function(item) {
                                if (consultant._id.toString() == item.fromUser._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                    consultant.unreadMessagesNumber++;
                                } else if (item.fromUser._id.toString() == consultant._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                    consultant.unreadMessagesNumber++;
                                }
                            });
                        });

                        if ($rootScope.inComingSelectThread) {
                            $scope.selectUser($rootScope.inComingSelectThread.owner,'');
                        } else if ($rootScope.inComingSelectTask) {
                            $scope.selectUser($rootScope.inComingSelectTask.user, '');
                        } else {
                            if ($scope.currentTeamMembers.length > 0) {
                                $scope.selectUser($scope.currentTeamMembers[0], 'team');
                            } else if ($scope.invitePeople.consultants.length > 0) {
                                $scope.selectedUser($scope.invitePeople.consultants[0], 'consultant');
                            }
                        }
                    });
                    break;

                case 'subcontractor':
                    notificationService.get().$promise.then(function(res){
                        var subcontractors = [];
                        $scope.inviterTypeText = 'BUILDER';
                        _.each($scope.invitePeople.subcontractors, function(subcontractor) {
                            if (subcontractor._id) {
                                if (subcontractor._id._id == $scope.currentUser._id || _.findIndex(subcontractor.teamMember, function(item){ return item._id == $scope.currentUser._id;}) != -1) {
                                    subcontractors.push(subcontractor._id);
                                    _.each(subcontractor.teamMember, function(member) {
                                        subcontractors.push(member);
                                    });
                                }

                                $scope.invitePeople.inviter = subcontractor.inviter;

                                if (subcontractor._id._id == $scope.currentUser._id) {
                                    $scope.currentUser.isLeader = true;
                                    return false;
                                } else {
                                    $scope.currentUser.isLeader = false;
                                }
                            }
                        });
                        _.each(subcontractors, function(subcontractor) {
                            subcontractor.unreadMessagesNumber = 0;
                            _.each(res, function(item) {
                                if (subcontractor._id.toString() == item.fromUser._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                    subcontractor.unreadMessagesNumber++;
                                } else if (item.fromUser._id.toString() == subcontractor._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                    subcontractor.unreadMessagesNumber++;
                                }
                            });
                        });

                        $scope.invitePeople.subcontractors = subcontractors;
                        $scope.invitePeople.inviter.unreadMessagesNumber = 0;
                        _.each(res, function(item) {
                            if ($scope.invitePeople.inviter._id.toString() == item.fromUser._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                $scope.invitePeople.inviter.unreadMessagesNumber++;
                            } else if (item.fromUser._id.toString() == $scope.invitePeople.inviter._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                $scope.invitePeople.inviter.unreadMessagesNumber++;
                            }
                        });
                        $scope.currentTeamMembers = subcontractors;
                        $scope.currentTeamMembers = _.uniq($scope.currentTeamMembers, '_id');
                        _.remove($scope.currentTeamMembers, {_id: $scope.currentUser._id});

                        $scope.teamMembersCanInvite = [];
                        _.each($scope.availableTeamMember, function(member, index) {
                            if (_.findIndex($scope.currentTeamMembers, {_id: member._id}) == -1) {
                                $scope.teamMembersCanInvite.push(member);
                            }
                        });

                        if ($rootScope.inComingSelectThread) {
                            $scope.selectUser($rootScope.inComingSelectThread.owner,'');
                        } else if ($rootScope.inComingSelectTask) {
                            $scope.selectUser($rootScope.inComingSelectTask.user, '');
                        } else {
                            if ($scope.currentTeamMembers.length > 0) {
                                $scope.selectUser($scope.currentTeamMembers[0], 'team');
                            }
                        }
                    });
                    break;
                case 'consultant':
                    notificationService.get().$promise.then(function(res){
                        $scope.inviterTypeText = 'INVITER';
                        var consultants = [];
                        _.each($scope.invitePeople.consultants, function(consultant) {
                            if (consultant._id) {
                                if (consultant.inviterType == 'builder') {
                                    $scope.inviterTypeText = "BUILDER";
                                } else if (consultant.inviterType == 'client') {
                                    $scope.inviterTypeText = "CLIENT";
                                } else if (consultant.inviterType == 'architect') {
                                    $scope.inviterTypeText = "ARCHITECT";
                                }

                                if (consultant._id._id == $scope.currentUser._id) {
                                    $scope.currentUser.isLeader = true;
                                } else {
                                    $scope.currentUser.isLeader = false;
                                }
                                $scope.invitePeople.inviter = consultant.inviter;
                                $scope.invitePeople.inviter.unreadMessagesNumber = 0;
                                _.each(res, function(item) {
                                    if ($scope.invitePeople.inviter._id.toString() == item.fromUser._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                        $scope.invitePeople.inviter.unreadMessagesNumber++;
                                    } else if (item.fromUser._id.toString() == $scope.invitePeople.inviter._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                        $scope.invitePeople.inviter.unreadMessagesNumber++;
                                    }
                                });

                                if (consultant._id._id == $scope.currentUser._id || _.findIndex(consultant.teamMember, function(item){ return item._id == $scope.currentUser._id;}) != -1) {
                                    consultants.push(consultant._id);
                                    if (consultant.teamMember.length > 0) {
                                        _.each(consultant.teamMember, function(member) {
                                            consultants.push(member);
                                        });
                                    }
                                    return false;
                                }
                            }
                        });
                        _.each(consultants, function(consultant) {
                            consultant.unreadMessagesNumber = 0;
                            _.each(res, function(item) {
                                if (consultant._id.toString() == item.fromUser._id.toString() && item.referenceTo == 'people-chat' && item.element.people == $scope.invitePeople._id) {
                                    consultant.unreadMessagesNumber++;
                                }  else if (item.fromUser._id.toString() == consultant._id.toString() && item.referenceTo == 'people-chat-without-mention' && item.element.people == $scope.invitePeople._id) {
                                    consultant.unreadMessagesNumber++;
                                }
                            });
                        });
                        
                        // $scope.invitePeople.consultants = consultants;
                        $scope.currentTeamMembers = consultants;
                        $scope.currentTeamMembers = _.uniq($scope.currentTeamMembers, '_id');
                        _.remove($scope.currentTeamMembers, {_id: $scope.currentUser._id});

                        $scope.teamMembersCanInvite = [];
                        _.each($scope.availableTeamMember, function(member, index) {
                            if (_.findIndex($scope.currentTeamMembers, {_id: member._id}) == -1) {
                                $scope.teamMembersCanInvite.push(member);
                            }
                        });

                        if ($rootScope.inComingSelectThread) {
                            $scope.selectUser($rootScope.inComingSelectThread.owner,'');
                        } else if ($rootScope.inComingSelectTask) {
                            $scope.selectUser($rootScope.inComingSelectTask.user, '');
                        } else {
                            if ($scope.currentTeamMembers.length > 0) {
                                $scope.selectUser($scope.currentTeamMembers[0], 'team');
                            }
                        }
                    });
                    break;
                default:
                    break;
            }
        });
    };

    getAvailableUser();

    function getUnreadMessage(selectedChatPeople) {
        socket.emit('join',selectedChatPeople._id);
        notificationService.get().$promise.then(function(res){
            $scope.unreadMessages = res;
            var unreadMessagesNumber = 0;
            var temp = 0;
            if (!selectedChatPeople.unreadMessagesNumber) {
                selectedChatPeople.unreadMessagesNumber = 0;
            }
            _.each($scope.unreadMessages, function(message){
                if (message.element._id == selectedChatPeople._id && message.referenceTo == "people-chat") {
                    unreadMessagesNumber++;
                    selectedChatPeople.unreadMessagesNumber++;
                }
                if (message.element._id == selectedChatPeople._id && message.referenceTo == "people-chat-without-mention") {
                    unreadMessagesNumber++;
                    selectedChatPeople.unreadMessagesNumber++;
                }
            });
            _.each($scope.unreadMessages, function(message){
                if (message.element._id == $scope.selectedChatPeople._id && (message.referenceTo == "people-chat" || message.referenceTo == "people-chat-without-mention")) {
                    $scope.selectedChatPeople.hasUnreadMessage = true;
                    for (var i = $scope.selectedChatPeople.messages.length - 1; i >= 0; i--) {
                        $scope.selectedChatPeople.messages[i].latestMessage = false;
                        if ($scope.selectedChatPeople.messages[i].user._id != $scope.currentUser._id) {
                            $scope.selectedChatPeople.messages[i].unread = true;
                            temp += 1;
                        } else {
                            $scope.selectedChatPeople.messages[i].unread = false;
                        }
                        if (temp == unreadMessagesNumber) {
                            $scope.selectedChatPeople.messages[i].latestMessage = true;
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
                                        selectedChatPeople.unreadMessagesNumber -= 1;
                                        if (selectedChatPeople.unreadMessagesNumber < 0) {
                                            selectedChatPeople.unreadMessagesNumber = 0;
                                        }
                                        _.each($scope.currentTeamMembers, function(member) {
                                            if (member._id == selectedChatPeople.owner) {
                                                member.unreadMessagesNumber = selectedChatPeople.unreadMessagesNumber;
                                            }
                                        });
                                        _.each($scope.invitePeople.architects, function(architect) {
                                            if (architect._id._id == selectedChatPeople.owner) {
                                                architect.unreadMessagesNumber = selectedChatPeople.unreadMessagesNumber;
                                            }
                                        });
                                        _.each($scope.invitePeople.clients, function(client) {
                                            if (client._id._id == selectedChatPeople.owner) {
                                                client.unreadMessagesNumber = selectedChatPeople.unreadMessagesNumber;
                                            }
                                        });
                                        _.each($scope.invitePeople.builders, function(builder) {
                                            if (builder._id._id == selectedChatPeople.owner) {
                                                builder.unreadMessagesNumber = selectedChatPeople.unreadMessagesNumber;
                                            }
                                        });

                                        _.each($scope.invitePeople.subcontractors, function(subcontractor) {
                                            if (subcontractor._id == selectedChatPeople.owner) {
                                                subcontractor.unreadMessagesNumber = selectedChatPeople.unreadMessagesNumber;
                                            }
                                        });
                                        _.each($scope.invitePeople.consultants, function(consultant) {
                                            if (consultant._id == selectedChatPeople.owner) {
                                                consultant.unreadMessagesNumber = selectedChatPeople.unreadMessagesNumber;
                                            }
                                        });
                                        if ($scope.currentUser.type == "subcontractor" || $scope.currentUser.type == "consultant") {
                                            $scope.invitePeople.inviter.unreadMessagesNumber = selectedChatPeople.unreadMessagesNumber;
                                        }
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
        });
    };

    socket.on('peopleChat:new', function (peopleChat) {
        if (peopleChat._id == $scope.selectedChatPeople._id) {
            var latestMessage = _.last(peopleChat.messages);
            if ($scope.currentUser.type == "consultant" || $scope.currentUser.type == "subcontractor") {
                if (latestMessage.user._id == $scope.invitePeople.inviter._id) {
                    $scope.invitePeople.inviter.unreadMessagesNumber++;
                }
            }
            $scope.selectedChatPeople = peopleChat;
            getUnreadMessage(peopleChat);
        } else {
            _.each($scope.currentTeamMembers, function(member) {
                if (member._id == peopleChat.owner) {
                    member.unreadMessagesNumber++;
                }
            });
            _.each($scope.invitePeople.architects, function(architect) {
                if (architect._id._id == peopleChat.owner) {
                    architect.unreadMessagesNumber++;
                }
            });
            _.each($scope.invitePeople.clients, function(client) {
                if (client._id._id == peopleChat.owner) {
                    client.unreadMessagesNumber++;
                }
            });
            _.each($scope.invitePeople.builders, function(builder) {
                if (builder._id._id == peopleChat.owner) {
                    builder.unreadMessagesNumber++;
                }
            });

            _.each($scope.invitePeople.subcontractors, function(subcontractor) {
                if (subcontractor._id == peopleChat.owner) {
                    subcontractor.unreadMessagesNumber++;
                }
            });
            _.each($scope.invitePeople.consultants, function(consultant) {
                if (consultant._id == peopleChat.owner) {
                    consultant.unreadMessagesNumber++;
                }
            });
        }
    });

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

    function getTaskAndDocumentBySelectedUser() {
        taskService.getByPackage({id: $scope.invitePeople._id, type: 'people'}).$promise.then(function(res){
            $scope.tasks = res;
            _.each($scope.tasks, function(task){
                task.isOwner = false;
                if (task.peopleChat == $scope.selectedChatPeople._id) {
                    task.isOwner = true;
                }
            });
            if ($rootScope.inComingSelectTask) {
                _.each($scope.tasks, function(task) {
                    task.isFocus = false;
                    if (task._id == $rootScope.inComingSelectTask._id) {
                        task.isFocus = true;
                    }
                });
                $timeout(function(){$("#taskTab > a").trigger('click')},1000);
            }
        });
        fileService.getFileInPeople({id: $scope.invitePeople._id}).$promise.then(function(res){
            $scope.files = res;
            _.each($scope.files, function(file) {
                file.isOwner = false;
                if (file.peopleChat == $scope.selectedChatPeople._id) {
                    file.isOwner = true;
                }
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

            if ($rootScope.inComingSelectThread) {
                _.each(selectedChatPeople.messages, function(message) {
                    message.isFocus = false;
                    if (message._id == $rootScope.inComingSelectThread.messageId) {
                        message.isFocus = true;
                    }
                });
            }
            $timeout(function(){
                _.each(selectedChatPeople.messages, function(message){
                    message.isFocus = false;
                });
            },3000);
        });
    };

    $scope.getTenderListByType = function(type) {
        $scope.selectedTeamType = type;
        $scope.tendersList = [];
        if (type == 'subcontractor') {
            _.each($scope.invitePeople.subcontractors, function(subcontractor) {
                if (subcontractor._id && subcontractor.inviter._id == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: subcontractor, type: 'subcontractor'});
                    if (subcontractor.hasSelect) {
                        $scope.tendersList = [];
                        return false;
                    }
                }
            });
            $scope.tendersList.type = 'subcontractor';
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
            $scope.tendersList.type = 'builder';
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
            $scope.tendersList.type = 'client';
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
            $scope.tendersList.type = 'architect';
        } else if (type == 'consultant') {
            _.each($scope.invitePeople.consultants, function(consultant) {
                if (consultant._id && consultant.inviter._id == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: consultant, type: 'consultant'});
                    if (consultant.hasSelect) {
                        $scope.tendersList = [];
                        return false;
                    }
                }
            });
            $scope.tendersList.type = 'consultant';
        }
    };

    $scope.selectWinnerTender = function(tender) {
        peopleService.selectWinnerTender({id: $stateParams.id}, tender).$promise.then(function(res) {
            getAvailableUser();
            $("#view_tender_detail").closeModal();
        }, function(err) {
            console.log(err);
        });
    };

    $scope.setInvite = function() {
        $scope.invite = {
            isTender : true,
            isInviteTeamMember: false,
            teamMember: [],
            invitees: []
        };
    };

    $scope.invitePeopleStep = 1;
    $scope.getChangeTypeValue = function(type) {
        $scope.invitePeopleStep = 2;
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
        $scope.teamMembersCanInvite.splice(index,1);
        member.canRevoke = true;
    };
    $scope.revokeTeamMember = function(member, index) {
        $scope.teamMembersCanInvite.push(member);
        $scope.invite.teamMember.splice(index, 1);
        member.canRevoke = false;
    };

    $scope.inviteMorePeople = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            $scope.invite.inviterType = $scope.currentUser.type;
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
                    getAvailableUser();
                    $scope.submitted = false;
                    $("#tender_modal").closeModal();
                }, function(res){
                    console.log(res);
                });
            } else {
                peopleService.update({id: $stateParams.id},$scope.invite).$promise.then(function(res){
                    getAvailableUser();
                    $scope.submitted = false;
                    $("#tender_modal").closeModal();
                }, function(res){
                    console.log(res);
                });
            }
        }
    };

    $scope.setUpload = function() {
        $scope.uploadFiles = [];
    };

    $scope.selectedTags = [];
    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pickMultiple(
            {
                maxFiles: 5
            },
            onSuccess
        );
    };

    function onSuccess(files){
        _.each(files, function(file) {
            file.belongToType = 'people';
            file.assignees = $scope.selectedChatPeople.members;
            file.tags = $scope.selectedTags;
            file.isQuote = $scope.isQuote;
            file._id = ($scope.fileId) ? $scope.fileId : '';
            file.peopleChat = $scope.selectedChatPeople._id;
        });
        $scope.uploadFiles = files;
    };

    $scope.uploadNewAttachment = function() {
        uploadService.uploadInPeople({id: $scope.invitePeople._id, files: $scope.uploadFiles}).$promise.then(function(res){
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
            $scope.task.assignees = [currentUser];
            if ($scope.selectedUser._id) {
                if ($scope.selectedUser._id._id) {
                    $scope.task.assignees.push($scope.selectedUser._id);
                } else if ($scope.selectedUser._id) {
                    $scope.task.assignees.push($scope.selectedUser);
                }
            }
            $scope.task.peopleChat = $scope.selectedChatPeople._id;
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
                    getAvailableUser();
                    $scope.submitted = false;
                }, function(res){
                    console.log(res);
                });
            },1000);
        }
    };

    $scope.selectUser = function(user, type) {
        $scope.selectedUser = user;
        $scope.selectedUser.type = type;

        peopleChatService.selectPeople(
            {id: $scope.invitePeople._id},
            {project: $stateParams.id, user: user}
        ).$promise.then(function(res){
            $scope.selectedChatPeople = res;
            getTaskAndDocumentBySelectedUser();
            getUnreadMessage($scope.selectedChatPeople);
            getAllChatMessageNotificationByUserInPeople($scope.selectedChatPeople);
        }, function(err){
            console.log(err);
        });
    };

    $scope.enterMessage = function ($event) {
        if ($event.keyCode === 13) {
            $event.preventDefault();
            $scope.sendMessage();
        } else if (($event.keyCode === 32 || $event.keyCode === 8) && $scope.showPopup) {
            $event.preventDefault();
            $scope.showPopup = false;
        } else if ($event.keyCode === 9) {
            $event.preventDefault();
            $scope.getMentionValue($scope.selectedUser);
        }
    };

    $scope.message = {};

    $scope.showPopup = false;

    $scope.getMentionValue = function(mention) {
        console.log(mention);
        $scope.message.mentions = [];
        $scope.message.text = $scope.message.text.substring(0, $scope.message.text.length -1);
        $scope.message.text += (mention.type == 'team') ? mention.name : mention._id.name;  
        if (mention.type == 'team') {
            $scope.message.mentions.push(mention._id);
        } else {
            $scope.message.mentions.push(mention._id._id);
        }
        $scope.showPopup = false;
        $timeout(function(){ 
            document.getElementById("textarea1-people-chat").focus();
        },500);
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