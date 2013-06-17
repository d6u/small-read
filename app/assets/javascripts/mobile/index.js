//= require modules/ratchet/modals.js
//= require modules/ratchet/popovers.js
//= require modules/ratchet/segmented-controllers.js
//= require modules/ratchet/sliders.js
//= require modules/ratchet/toggles.js
//= require angular.min.js
//= require angular-sanitize.js


// App Init
// ========
var app = angular.module('SmallRead', ['ngSanitize']);

app.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider.when('/', {
            templateUrl: "/mobile/folders_and_feeds",
            controller: "FolderCtrl"
        })
        .when('/:type/:id/tweets', {
            templateUrl: "/mobile/tweets_content",
            controller: 'TweetCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
    }
]);

var needle;
// MainCtrl
// --------
app.controller(
    'AppCtrl',
    ['$scope', '$http', function($scope, $http) {

    }]
);

// FolderCtrl
app.controller(
    'FolderCtrl',
    ['$scope', '$http',
    function($scope, $http) {
        // load folders and feeds
        $scope.loadFoldersAndFeeds = function() {
            $http.get('/bg/load_folders_and_feeds.json')
            .success(function(data) {
                $scope.folders = data;
            });
        };
        $scope.loadFoldersAndFeeds();
    }]
);

// TweetCtrl
app.controller(
    'TweetCtrl',
    ['$scope', '$http', '$routeParams',
    function($scope, $http, $routeParams) {
        // load tweets
        $scope.load_only_unread = true;
        $scope.loadTweets = function() {
            if ( $scope.load_only_unread === true ) {
                $scope.baseUrl = '/'+$routeParams.type+'s/'+$routeParams.id+'/tweets';
            } else {
                $scope.baseUrl = '/'+$routeParams.type+'s/'+$routeParams.id+'/tweets?all=true';
            }
            $http.get($scope.baseUrl)
            .success(function(data){
                for (var i = 0; i < data.length; i++) {
                    data[i].entities = angular.fromJson(data[i].entities);
                }
                $scope.reaches_end = data.length < 20 ? true : false;
                if (data.length > 0) $scope.max_tweet_id = data[data.length - 1].id - 1;
                $scope.tweets = data;
            });
        };
        $scope.loadTweets();
    }]
);

// Filters
app.filter(
    'tweetTextFilter',
    function() {
        return function(input, entities) {
            // extract and sort entities
            var entity_array = [];
            for(var entity in entities) {
                angular.forEach(entities[entity], function(value, key){
                    value.type = entity;
                    entity_array.push(value);
                });
            }
            entity_array.sort(function(a,b){
                return a.indices[0] - b.indices[0];
            });
            // extract input pieces
            var input_pieces = [];
            var beginning_point = 0;
            angular.forEach(entity_array, function(value, key) {
                input_pieces.push(input.slice(beginning_point, value.indices[0]));
                switch (value.type) {
                    case "urls":
                        input_pieces.push('<a href="'+value.expanded_url+'" target="_blank">'+value.display_url+'</a>');
                        break;
                    case "hashtags":
                        input_pieces.push('<a href="https://twitter.com/search?q=%23'+value.text+'&src=hash" target="_blank>#'+value.text+'</a>');
                        break;
                    case "user_mentions":
                        input_pieces.push('<a href="http://twitter.com/'+value.screen_name+'" target="_blank>@'+value.screen_name+'</a>');
                        break;
                    case "media":
                        input_pieces.push('<a href="'+value.media_url+'" target="_blank>'+value.display_url+'</a>');
                        break;
                }
                beginning_point = value.indices[1];
            });
            input_pieces.push(input.slice(beginning_point));
            // return input
            return input_pieces.join("");
        };
    }
);
