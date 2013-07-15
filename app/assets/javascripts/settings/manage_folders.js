//= require settings/settings_common
//= require jquery-ui-1.10.3.custom.min.js
//= require angular.min.js
//= require angular-resource.js
//= require modules/sr-feeds.js


// Setup
// ----------------------------------------
var app = angular.module('SmallRead', ['small-read:feeds']);


// Controller
// ----------------------------------------
app.controller('AppCtrl',
['$scope', '$http', 'Feeds',
function($scope, $http, Feeds) {
    $scope.folderManagement = {
        reservedWords: ['muted', 'general'],
        valid: false,
        validateName: function() {
            for (var i = 0; i < this.reservedWords.length; i++) {
                if ($scope.newFolderName.toLowerCase() === this.reservedWords[i]) {
                    $scope.message = "Cannot use reserved name \""+$scope.newFolderName+"\".";
                    this.valid = false;
                    break;
                } else {
                    this.valid = true;
                }
            };
            if ($scope.newFolderName.length <= 0) this.valid = false;
            if ($scope.newFolderName.length > 0) {
                if (this.valid) $scope.message = "\""+$scope.newFolderName+"\" is a valid name, press \"Enter\" key or click \"Add\" to add a new folder.";
            } else {
                $scope.message = "";
            }
        },
        submiting: false,
        addNewFolder: function() {
            if (this.submiting) return;
            if (this.valid) {
                this.submiting = true;
                var that = this;
                var folder = {name: $scope.newFolderName, position: 0};
                Feeds.addFolder(folder)
                .then(function(data) {
                    that.submiting = false;
                    $scope.message = "";
                    $scope.folders.unshift(data);
                    that.updateFolderPositions();
                });
            }
        },
        updateFolderPositions: function() {
            for (var i = 0; i < $scope.folders.length; i++) {
                $scope.folders[i].position = i;
            };
            Feeds.updateFolders($scope.folders);
        },
        removeFolder: function(folder, position) {
            var that = this;
            Feeds.deleteFolder(folder.id)
            .then(function(response) {
                $scope.folders.splice(position, 1);
                that.updateFolderPositions();
            });
        },
        updateFolderName: function(folder) {
            folder.name = folder.newName;
            Feeds.updateFolders([folder]);
        }
    };
    // init
    Feeds.getFolders().then(function(data) {
        $scope.folders = data;
    });
}]);


// Directive
// ----------------------------------------
app.directive('jqSortable',
['Feeds',
function(Feeds) {
    return function(scope, element, attrs) {
        var options = {
            handle: '.rearrange-folder',
            cursor: 'move',
            update: function(event, ui) {
                var children = element.children('[ng-repeat]');
                var folders = $.map(children, function(item, index) {
                    var folder = $(item).scope().folder;
                    folder.position = index;
                    return folder;
                });
                scope.$apply(function(scope) {
                    scope.folders = folders;
                });
                Feeds.updateFolders(folders);
            }
        };
        if (attrs.jqConnectWith) options['connectWith'] = attrs.jqConnectWith;
        element.sortable(options);
    };
}]);
