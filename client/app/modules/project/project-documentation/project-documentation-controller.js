angular.module('buiiltApp').controller('projectDocumentationCtrl', function($q, $rootScope, $scope, $mdDialog, documents, uploadService, $mdToast, $stateParams, socket, $state, fileService, documentSets, people, dialogService, documentService, contactBooks) {
    $scope.contentHeight = $rootScope.maximunHeight - $("header").innerHeight() - 30;

    $scope.documents = documents;
    $scope.documentSets = documentSets;
    $scope.dialogService = dialogService;

    function getItemIndex(document, type) {
        var index, setIndex;
        if (type==="documentSet" && document.documentSet) {
            index = _.findIndex($scope.documentSets, function(set) {
                if (set._id) 
                    return set._id.toString()===document.documentSet.toString();
            });
        } else if (type==="document") {
            if (document.documentSet) {
                setIndex = _.findIndex($scope.documentSets, function(set) {
                    if (set._id) 
                        return set._id.toString()===document.documentSet.toString();
                });
                if (setIndex!==-1) {
                    index = _.findIndex($scope.documentSets[setIndex].documents, function(doc) {
                        return doc._id.toString()===document._id.toString();
                    });
                }
            } else {
                index = _.findIndex($scope.documents, function(doc) {
                    return doc._id.toString()===document._id.toString();
                });
            }
        }
        return index;
    };

    function documentSetInitial() {
        /*Check to allow added document set 1*/
        var allowAddedSet1 = true;
        _.each($scope.documentSets, function(documentSet) {
            if (documentSet.name==="Set 1" && documentSet.notAllowEditOrCopy) {
                allowAddedSet1 = false;
                return false;
            }
        });
        if (allowAddedSet1) 
            $scope.documentSets.push({name: "Set 1", documents: [], notAllowEditOrCopy: true});

        /*Add documents to document set 1 which haven't belong to any document set */
        _.each($scope.documents, function(document) {
            if (!document.documentSet) {
                document.project = (document.project._id) ? document.project._id : document.project;
                $scope.documentSets[$scope.documentSets.length -1].documents.push(document);
            }
        });
    }
    documentSetInitial();

    if ($state.includes("project.documentation.all")) {
        var prom = [documentService.me({id: $stateParams.id}).$promise, fileService.getProjectFiles({id: $stateParams.id, type: "document"}).$promise];
        $q.all(prom).then(function(data) {
            $scope.documentSets = data[0];
            $scope.documents = data[1];
            documentSetInitial();
            getLastAccess($scope.documents);
        });
    }

    $scope.selectedDocumentSetId = $rootScope.selectedDocumentSetId;
    $scope.selectDocumentSet = function(documentSet) {
        $scope.selectedDocumentSet = documentSet;
        $rootScope.selectedDocumentSetId = $scope.selectedDocumentSetId = documentSet._id;
    };
	
	$scope.showFilter = false;

    function getNotMembersName() {
        _.each($scope.documentSets, function(set) {
            set.notMembersName = [];
            _.each(set.notMembers, function(email) {
                var index = _.findIndex(contactBooks, function(contact) {
                    return email===contact.email;
                });
                if (index !== -1) {
                    set.notMembersName.push(contactBooks[index].name);
                }
            })
        });
    }
    getNotMembersName();

    /*Get project members list*/
    function getProjectMembers() {
        $scope.projectMembers = [];
        _.each($rootScope.roles, function(role) {
            _.each(people[role], function(tender){
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
                                    $scope.projectMembers.push(member);
                                });
                            }
                        });
                        if (tender.tenderers[0]._id) {
                            tender.tenderers[0]._id.select = false;
                            $scope.projectMembers.push(tender.tenderers[0]._id);
                        } else {
                            $scope.projectMembers.push({email: tender.tenderers[0].email, name: tender.tenderers[0].name, phoneNumber: tender.tenderers[0].phoneNumber, select: false});
                        }
                    } else {
                        $scope.projectMembers.push(tender.tenderers[0]._id);
                        _.each(tender.tenderers, function(tenderer) {
                            if (tenderer._id._id.toString() === $rootScope.currentUser._id.toString()) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.select = false;
                                    $scope.projectMembers.push(member);
                                });
                            }
                        });
                    }
                }
            });
        });
        _.remove($scope.projectMembers, {_id: $rootScope.currentUser._id});
        if ($rootScope.selectedDocumentSet && !$rootScope.isCopyDocumentSet) {
            _.each($rootScope.selectedDocumentSet.members, function(member) {
                if (member._id) 
                    _.remove($scope.projectMembers, {_id: member._id});
            });
            _.each($rootScope.selectedDocumentSet.notMembers, function(email) {
                _.remove($scope.projectMembers, {email: email});
            })
        }
    };
    getProjectMembers();

    function setUploadFile(){
        $scope.uploadFile = {
            tags:[],
            members: []
        };
        $scope.allowUploadDocument = ($rootScope.project.projectManager._id == $rootScope.currentUser._id) ? true : false;
        $scope.tags = [];
        _.each($rootScope.currentTeam.documentTags, function(tag) {
            $scope.tags.push({name: tag, select: false});
        });
    };
    setUploadFile();

    // if ($state.includes("project.documentation.all")) {
    //     fileService.getProjectFiles({id: $stateParams.id, type: "document"}).$promise.then(function(res) {
    //         $scope.documents = res;
    //         getLastAccess($scope.documents);
    //     });
    // }

    /*Get last access of user for each document to show recently open first*/
    function getLastAccess(documents) {
        _.each(documents, function(document) {
            if (document.lastAccess&&document.lastAccess.length>0) {
                var accessIndex = _.findIndex(document.lastAccess, function(access) {
                    return access.user.toString()===$rootScope.currentUser._id.toString();
                });
                if (accessIndex !==-1) {
                    document.createdAt = document.lastAccess[accessIndex].time;
                }
            }
        });
    };
    getLastAccess($scope.documents);

    // filter document
    $scope.filterTags = [];
    $scope.selectFilterTag = function(tagName) {
        var tagIndex = _.indexOf($scope.filterTags, tagName);
        if (tagIndex !== -1) {
            $scope.filterTags.splice(tagIndex, 1);
        } else 
            $scope.filterTags.push(tagName);
    };

    $scope.search = function(document) {
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
        }  else if ($scope.showArchived) {
            var found = (document.isArchive) ? true: false;
            return found;
        } else {
            var found = (!document.isArchive) ? true : false;
            return found;
        }
    };
    // end filter

    /*Receive when owner created new document*/
    var listenerCleanFnPush = $rootScope.$on("Document.Uploaded", function(event, data) {
        if (data.documentSet) {
            var index = _.findIndex($scope.documentSets, function(set) {
                if (set._id) {
                    return set._id.toString()===data.documentSet.toString();
                }
            });
            if (index !== -1) {
                $scope.documentSets[index].documents.push(data);
            }
        } else {
            $scope.documents.push(data);
        }
    });

    // Reveice when owner uploaded bulk of documents
    var listenerCleanFnPushBulkDoc = $rootScope.$on("BulkDocument.Uploaded", function(event, data) {
        if (data[0].documentSet) {
            var index = _.findIndex($scope.documentSets, function(set) {
                if (set._id) {
                    return set._id.toString()=== data[0].documentSet.toString();
                }
            });
            if (index !== -1) {
                $scope.documentSets[index].documents = _.union($scope.documentSets[index].documents, data);
            }
        } else {
            $scope.documents = _.union($scope.documents, data);
        }
    });

    if (!$rootScope.$$listeners["Document.Read"]) {
        $rootScope.$on("Document.Read", function(ev, data) {
            var index = _.findIndex($scope.documentSets, function(set) {
                if (data.documentSet) {
                    return set._id.toString()=== data.documentSet.toString();
                } else {
                    return set.name==="Set 1";
                }
            });
            if (index !== -1) {
                var docIndex = _.findIndex($scope.documentSets[index].documents, function(doc) {
                    return doc._id.toString()===data._id.toString();
                });
                if (docIndex!==-1) {
                    if ($scope.documentSets[index].__v > 0) {
                        $scope.documentSets[index].__v -= 1;
                        if ($scope.documentSets[index].__v === 0) {
                            $rootScope.$broadcast("UpdateCountNumber", {type: "document", number: 1});
                        }
                    }
                    $scope.documentSets[index].documents[docIndex].__v = 0;
                }
            }
        });
    }

    var listenerRemove = $rootScope.$on("Document.Remove", function(ev, data) {
        index = _.findIndex($scope.documentSets, function(set) {
            if (data.documentSet) {
                return set._id.toString()===data.documentSet.toString();
            } else {
                return set.name=== "Set 1";
            }
        });
        if (index !== -1) {
            var docIndex = _.findIndex($scope.documentSets[index].documents, function(doc) {
                return doc._id.toString()===data._id.toString();
            });
            if (docIndex !== -1) {
                $scope.documentSets[index].documents.splice(docIndex, 1);
            }
        }
    });

    $scope.$on('$destroy', function() {
        listenerCleanFnPush();
        listenerCleanFnPushBulkDoc();
        listenerRemove();
    });

    /*Receive when archived document then move it to archived list*/
    socket.on("document:archive", function(data) {
        var currentFileIndex=_.findIndex($scope.documents, function(t) {
            return t._id.toString()===data._id.toString();
        });
        if (currentFileIndex !== -1) {
            $scope.documents[currentFileIndex].isArchive=true;
            $scope.documents[currentFileIndex].__v = 0;
        }
    });

    /*Receive when updated document*/
    socket.on("dashboard:new", function(data) {
        if (data.type==="document" && data.file.element.type==="document") {
            if (data.file.project._id.toString()===$stateParams.id.toString()) {
                var index = _.findIndex($scope.documentSets, function(set) {
                    if (data.file.documentSet) {
                        return set._id.toString()===data.file.documentSet.toString();
                    } else {
                        return set.name==="Set 1";
                    }
                });
                if (index !== -1) {
                    if ($scope.documentSets[index].__v === 0) {
                        $rootScope.$broadcast("UpdateCountNumber", {type: "document", isAdd: true, number: 1});
                    }
                    $scope.documentSets[index].__v += 1;
                    var documentIndex = _.findIndex($scope.documentSets[index].documents, function(doc) {
                        return doc._id.toString()===data.file._id.toString();
                    });
                    if (documentIndex!==-1 && ($scope.documentSets[index].documents[documentIndex] && $scope.documentSets[index].documents[documentIndex].uniqId!==data.uniqId)) {
                        $scope.documentSets[index].documents[documentIndex].uniqId = data.uniqId;
                        // if ($scope.documentSets[index].documents[documentIndex].__v===0) {
                        // }
                        $scope.documentSets[index].documents[documentIndex].__v+=1;
                    } else if (documentIndex === -1 && $rootScope.uniqId != data.uniqId) {
                        $rootScope.uniqId = data.uniqId;
                        data.file.__v = 1;
                        $scope.documentSets[index].documents.push(data.file);
                        // $rootScope.$broadcast("UpdateCountNumber", {type: "document", isAdd: true, number: 1});
                    }
                }
                // if (data.file.documentSet) {
                //     index = _.findIndex($scope.documentSets, function(set) {
                //         if (set._id) {
                //             return set._id.toString()===data.file.documentSet.toString();
                //         }
                //     });
                //     if (index !== -1) {
                //         var documentIndex = _.findIndex($scope.documentSets[index].documents, function(doc) {
                //             return doc._id.toString()===data.file._id.toString();
                //         });
                //         if (documentIndex!==-1 && ($scope.documentSets[index].documents[documentIndex] && $scope.documentSets[index].documents[documentIndex].uniqId!==data.uniqId)) {
                //             $scope.documentSets[index].documents[documentIndex].uniqId = data.uniqId;
                //             if ($scope.documentSets[index].documents[documentIndex].__v===0) {
                //                 $rootScope.$broadcast("UpdateCountNumber", {type: "document", isAdd: true, number: 1});
                //             }
                //             $scope.documentSets[index].documents[documentIndex].__v+=1;
                //         } else if (documentIndex === -1) {
                //             data.file.__v = 1;
                //             $scope.documentSets[index].documents.push(data.file);
                //             $rootScope.$broadcast("UpdateCountNumber", {type: "document", isAdd: true, number: 1});
                //         }
                //     }
                // } else {
                //     index = _.findIndex($scope.documents, function(document) {
                //         return document._id.toString()===data.file._id.toString();
                //     });
                //     if (index !== -1 && ($scope.documents[index] && $scope.documents[index].uniqId!==data.uniqId)) {
                //         $scope.documents[index].uniqId = data.uniqId;
                //         if ($scope.documents[index].__v===0) {
                //             $rootScope.$broadcast("UpdateCountNumber", {type: "document", isAdd: true, number: 1});
                //         }
                //         $scope.documents[index].__v+=1;
                //     } else if (index===-1) {
                //         data.file.__v = 1;
                //         $scope.documents.push(data);
                //         $rootScope.$broadcast("UpdateCountNumber", {type: "document", isAdd: true, number: 1});
                //     }
                // }
            }
        }
    });

    /*Receive when create new set of document*/
    socket.on("document-set:new", function(data) {
        if (data.project==$stateParams.id) {
            $scope.documentSets.push(data);
            $scope.selectedDocumentSet = data;
            getNotMembersName();
        }
    });

    /*Receive when update a set of document*/
    socket.on("document-set:update", function(data) {
        if (data.project==$stateParams.id) {
            var index = _.findIndex($scope.documentSets, function(set) {
                if (set._id) {
                    return set._id==data._id;
                }
            });
            if (index !== -1) {
                $scope.documentSets[index] = data;
                $scope.selectedDocumentSet = data;
                getNotMembersName();
            }
        }
    });
    
    /*Select document tags to create new document
    Select project members for create new document set*/
    $scope.selectedItem = function(index, type) {
        if (type==="member") 
            $scope.projectMembers[index].select = !$scope.projectMembers[index].select;
        else
            $scope.tags[index].select = !$scope.tags[index].select;
    };

	/*Create new document with valid tags
    then call mixpanel to track current user has created new document
    and open document detail*/
	$scope.addNewDocument = function(){
        // $scope.uploadFile.tags = _.filter($scope.tags, {select: true});
        // if ($scope.uploadFile.tags.length === 0) {
        //     dialogService.showToast("Please Select At Least 1 Document Tag...");
        // } else if (!$scope.selectedDocumentSetId) {
        //     dialogService.showToast("Please select a document set");
        // } else {
        $scope.uploadFile.type="document";
        $scope.uploadFile.tags = [];
        $scope.uploadFile.selectedDocumentSetId = $scope.selectedDocumentSetId;
        fileService.create({id: $stateParams.id}, $scope.uploadFile).$promise.then(function(res) {
            dialogService.closeModal();
            dialogService.showToast("Document Successfully Uploaded.");
            $rootScope.$emit("Document.Uploaded", res);
			
			//Track Document Upload
			mixpanel.identify($rootScope.currentUser._id);
			mixpanel.track("Document Uploaded");

            $rootScope.openDetail = true;
            $state.go("project.documentation.detail", {id: res.project._id, documentId: res._id});
        }, function(err){dialogService.showToast("There Was an Error...");});
        // }
	};

    $scope.showModal = function(modalName, value) {
        if (modalName==="edit-document-set.html") 
            $rootScope.selectedDocumentSet = value;
        else if (modalName==="copy-document-set.html") {
            $rootScope.selectedDocumentSet = angular.copy(value);
            $rootScope.selectedDocumentSet.name = null;
            $rootScope.isCopyDocumentSet = true;
        }
        $mdDialog.show({
            controller: "projectDocumentationCtrl",
            resolve: {
                documents: ["$stateParams", "fileService", function($stateParams, fileService) {
                    return fileService.getProjectFiles({id: $stateParams.id, type: "document"}).$promise;
                }],
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }],
                documentSets: ["$stateParams", "documentService", function($stateParams, documentService) {
                    return documentService.me({id: $stateParams.id}).$promise;
                }],
                contactBooks: ["contactBookService", function(contactBookService) {
                    return contactBookService.me().$promise;
                }]
            },
            templateUrl: 'app/modules/project/project-documentation/partials/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Open latest document history in new window*/
    $scope.showViewFileModal = function($event, document) {
        var win;
        if (document.owner._id==$rootScope.currentUser._id) {
            win = window.open(document.path, "_blank");
        } else {
            win = window.open(_.last(document.fileHistory).link, "_blank");
        }
        win.focus();
    };

    $scope.setDocument = {};
    $scope.selectedDocumentSet = $rootScope.selectedDocumentSet;
    $scope.addNewSetOfDocument = function(form) {
        if (form.$valid) {
            if (!$rootScope.isCopyDocumentSet)
                $scope.setDocument.newMembers = _.filter($scope.projectMembers, {select: true});
            else if ($rootScope.isCopyDocumentSet) 
                $scope.selectedDocumentSet.newMembers = _.filter($scope.projectMembers, {select: true});
            documentService.create({id: $stateParams.id, isCopy: $rootScope.isCopyDocumentSet}, (!$rootScope.isCopyDocumentSet) ? $scope.setDocument : $scope.selectedDocumentSet).$promise.then(function(res) {
                dialogService.closeModal();
                dialogService.showToast("Create new set of document successfully");
            }, function(err){
                dialogService.showToast("Error");
            });
        } else {    
            dialogService.showToast("Check your input again.");
        }
    };

    $scope.updateSetOfDocument = function(form) {
        if (form.$valid) {
            $scope.selectedDocumentSet.newMembers = _.filter($scope.projectMembers, {select: true});
            documentService.update({id: $scope.selectedDocumentSet._id}, $scope.selectedDocumentSet).$promise.then(function(res) {
                dialogService.closeModal();
                dialogService.showToast("Update a set of document successfully");
            }, function(err){
                dialogService.showToast("Error");
            });
        } else {
            dialogService.showToast("Check your input again.");   
        }
    };

    $scope.bulkDocument = {
        documents: []
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            onSuccess
        );
    };

    function onSuccess(files){
        $scope.bulkDocument.documents = files;
    };

    $scope.uploadBulkDocuments = function() {
        if (!$rootScope.selectedDocumentSetId) {
            return dialogService.showToast("Please Select Document Set To Countinue");
        }
        filepicker.pickMultiple(
            {
                services: ["computer", "DROPBOX", "gmail", "skydrive", "GOOGLE_DRIVE"],
            },
            function(Blobs){
                $scope.bulkDocument.documents = Blobs;
                if ($scope.bulkDocument.documents.length === 0) {
                    dialogService.showToast("Please Select At Least 1 Document");
                } else {
                    uploadService.uploadBulkDocument({id: $rootScope.selectedDocumentSetId}, $scope.bulkDocument).$promise.then(function(res) {
                        dialogService.showToast("Upload Bulk Document Successfully");
                        dialogService.closeModal();
                        $rootScope.$emit("BulkDocument.Uploaded", res);
                    }, function(err) {
                        dialogService.showToast("Error When Upload Bulk Document");
                    });
                }
            },
            function(error){
                dialogService.showToast("No Documentation Was Uploaded");
        });
    };
});