//= require modules/ratchet/modals.js
//= require modules/ratchet/popovers.js
//= require modules/ratchet/segmented-controllers.js
//= require modules/ratchet/sliders.js
//= require modules/ratchet/toggles.js
//= require jquery-2.0.0.min.js
//= require angular.min.js
//= require angular-sanitize.js
//= require modules/ng-infinite-scroll.js


// App Init
// ========
var app = angular.module('SmallRead', ['ngSanitize', 'infinite-scroll']);

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
        $scope.tweets = [];
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
        // laod more tweets
        $scope.busy = false;
        $scope.listScrolling = function() {
            if ($scope.reaches_end || $scope.busy || $scope.tweets.length === 0) return;
            $('.tweets-list').append('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>');
            $scope.busy = true;
            if ( $scope.load_only_unread === true ) {
                var url = $scope.baseUrl + "?max_id=" + $scope.max_tweet_id;
            } else {
                var url = $scope.baseUrl + "&max_id=" + $scope.max_tweet_id;
            }
            $http.get(url).success(function(data) {
                for (var i = 0; i < data.length; i++) {
                    data[i].entities = angular.fromJson(data[i].entities);
                }
                $('.progress.progress-striped.active').remove();
                $scope.tweets = $scope.tweets.concat(data);
                if (data.length > 0) $scope.max_tweet_id = data[data.length - 1].id - 1;
                $scope.reaches_end = data.length < 20 ? true : false;
                $scope.busy = false;
            });
        };
        // end of Ctrl
    }]
);

app.controller(
    'TweetListCtrl',
    ['$scope', '$element', function($scope, $element) {
        // marking read
        $element.on('scroll', function() {
            $scope.$broadcast( 'listScrolling', $($element[0]).children('.tweets-list').scrollTop() );
        });
    }]
);

app.directive(
    'tweet',
    [function() {
        return {
            controller: ['$scope', '$element', '$http', function($scope, $element, $http) {

                $scope.$on('listScrolling', function(event, parentScrollTop){
                    if ($element.position().top < -20) {
                        $scope.markRead();
                    }
                });

                $scope.marking_read = false;
                $scope.markRead = function() {
                    if ($scope.tweet.read || $scope.marking_read) return;
                    $scope.marking_read = true;
                    $scope.tweet.read = true;
                    // TODO: wait for angular.js fix
                    // use get function to avoid angular.js repid put error
                    $http.get('/tweets/'+$scope.tweet.id+'/mark_read')
                    .success(function() {
                        $element.addClass('read');
                        $scope.marking_read = false;
                    });
                };
                // mark all read
                $scope.$on('markedAllRead', function(event) {
                    $scope.tweet.read = true;
                });
            }],
            link: function(scope, element, attrs) {
            }
        };
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

app.filter(
    'tweetReadFilter',
    function() {
        return function(input) {
            return input ? 'read' : '';
        };
    }
);
