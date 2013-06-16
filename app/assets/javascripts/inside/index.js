//= require jquery-2.0.0.min.js
//= require angular.min.js
//= require angular-sanitize.js
//  require angular-resource.js
//= require modules/ng-infinite-scroll.js
//= require jquery.icheck.min.js


// App Init
// ========
var app = angular.module('SmallRead', ['ngSanitize', 'infinite-scroll']);

// MainCtrl
// --------
app.controller(
    'AppCtrl',
    function($scope, $http) {
        $scope.loadFoldersAndFeeds = function() {
            $http.get('/bg/load_folders_and_feeds.json')
            .success(function(data) {
                $scope.folders = data;
            });
        };
        $scope.loadFoldersAndFeeds();
        // folder & feed
        $scope.showFeedsList = function(showList) {
            showList.list = showList.list === "show" ? "" : "show";
        };
        $scope.fetchWithTwitter = function() {
            $http.get('/bg/refresh')
            .success(function(data) {
                $scope.loadFoldersAndFeeds();
            });
        };
        // tweets
        $scope.tweets = [];
        $scope.loadTweets = function(type, id) {
            if (type) $scope.souce_type = type;
            if (id) $scope.souce_id = id;
            if ((type && id) || ($scope.souce_type && $scope.souce_id)) {
                if ( $scope.load_only_unread === true ) {
                    $scope.baseUrl = '/'+$scope.souce_type+'s/'+$scope.souce_id+'/tweets';
                } else {
                    $scope.baseUrl = '/'+$scope.souce_type+'s/'+$scope.souce_id+'/tweets?all=true';
                }
                $http.get($scope.baseUrl)
                .success(function(data){
                    for (var i = 0; i < data.length; i++) {
                        data[i].entities = angular.fromJson(data[i].entities);
                    }
                    if (data.length < 20) $scope.reaches_end = true;
                    if (data.length > 0) $scope.max_tweet_id = data[data.length - 1].id - 1;
                    $('.tweets-list').scrollTop(0);
                    $scope.tweets = data;
                });
            }
        };
        // laod more tweets
        $scope.busy = false;
        $scope.listScrolling = function() {
            if ($scope.reaches_end || $scope.busy || $scope.tweets.length === 0) return;
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
                $scope.tweets = $scope.tweets.concat(data);
                if (data.length > 0) $scope.max_tweet_id = data[data.length - 1].id - 1;
                if (data.length < 20) $scope.reaches_end = true;
                $scope.busy = false;
            });
        };
        // unread count
        $scope.countUnread = function(feed_id) {
            $scope.$broadcast('tweetMarkedRead', feed_id);
        };
        // load only unread
        $scope.load_only_unread = true;
        $('#display_only_unread').iCheck({
            checkboxClass: 'icheckbox_square-blue display-only-unread-icheck',
            increaseArea: '20%'
        })
        .on('ifChecked', function(event) {
            $scope.load_only_unread = true;
            $scope.loadTweets();

        })
        .on('ifUnchecked', function(event) {
            $scope.load_only_unread = false;
            $scope.loadTweets();
        });
        // mark all read
        $scope.markAllRead = function() {
            if ( $scope.souce_type && $scope.souce_id && confirm("Sure want to mark everything as read?") ) {
                var sending_data = {};
                sending_data[$scope.souce_type+'_id'] = $scope.souce_id;
                $http.post( '/mark_all_read', sending_data)
                .success(function() {
                    $scope.$broadcast('markedAllRead', $scope.souce_type, $scope.souce_id);
                });
            }
        };
    }
);

// Folder
app.directive(
    'folder',
    function() {
        return {
            controller: function($scope) {
                $scope.showList = {
                    list: ""
                };
                $scope.$on('feedReduceUnreadCount', function(event) {
                    $scope.folder.unread_count--;
                });
                // mark all read
                $scope.$on('markedAllRead', function(event, type, id) {
                    if ( type === 'folder' && $scope.folder.id === id ) {
                        $scope.folder.unread_count = 0;
                        $scope.$broadcast('folderMarkedAllRead');
                    }
                });
                $scope.$on('feedMarkedAllRead', function(event, feed_unread_count) {
                    $scope.folder.unread_count -= feed_unread_count;
                });
            },
            link: function(scope, element, attrs) {
            }
        };
    }
);

// Feed
app.directive(
    'feed',
    function() {
        return {
            controller: function($scope) {
                $scope.$on('tweetMarkedRead', function(event, feed_id) {
                    if ( feed_id == $scope.feed.id ) {
                        $scope.feed.unread_count--;
                        $scope.$emit('feedReduceUnreadCount');
                    }
                });
                // mark all read
                $scope.$on('markedAllRead', function(event, type, id) {
                    if ( type === 'feed' && $scope.folder.id === id ) {
                        $scope.$emit('feedMarkedAllRead', $scope.feed.unread_count);
                        $scope.feed.unread_count = 0;
                    }
                });
                $scope.$on('folderMarkedAllRead', function(event) {
                    $scope.feed.unread_count = 0;
                });
            },
            link: function(scope, element, attrs) {
            }
        };
    }
);

// Tweets
app.controller(
    'TweetsCtrl',
    function($scope, $element) {
        $element.children('.tweets-list').on('scroll', function() {
            $scope.$broadcast( 'listScrolling', $element.children('.tweets-list').scrollTop() );
        });
    }
);

app.directive(
    'tweet',
    function($compile) {
        var non_retweet_template = document.querySelector('#tweet-template').innerHTML;
        var retweet_template = document.querySelector('#retweet-template').innerHTML;

        var getTemplate = function(retweeted_status_id_str) {
            // TODO: simplify
            if (retweeted_status_id_str) {
                return retweet_template;
            } else {
                return non_retweet_template;
            }
        };

        var link = function(scope, element, attrs) {
            element.html(getTemplate(scope.tweet.retweeted_status_id_str));
            $compile(element.contents())(scope);
        };

        return {
            controller: function($scope, $element, $http) {

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
                        $scope.countUnread($scope.tweet.feed_id);
                    });
                };
                // mark all read
                $scope.$on('markedAllRead', function(event) {
                    $scope.tweet.read = true;
                });
            },
            link: link
        };
    }
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
                    case "medias":
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
