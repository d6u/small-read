//= require jquery-2.X.min.js
//= require angular.min.js
//= require angular-sanitize.js


// App Init
// ========================================
var app = angular.module('SmallRead', ['ngSanitize']);

app.controller('AppCtrl',
    ['$scope', '$http', function($scope, $http) {
        $http.get('/feeds_with_top_tweets')
        .then(function(response) {
            for (var i = 0; i < response.data.length; i++) {
                // parase entities from JSON to object
                for (var j = 0; j < response.data[i].topTweets.length; j++) {
                    response.data[i].topTweets[j].entities = angular.fromJson(response.data[i].topTweets[j].entities);
                };
                // inject topTweetBg for background image
                if (response.data[i].topTweets[0] && response.data[i].topTweets[0].entities.media) {
                    response.data[i].topTweetBg = {
                        backgroundImage: "url(\""+response.data[i].topTweets[0].entities.media[0].media_url+":small\")"
                    };
                } else {
                    response.data[i].topTweetBg = {
                        backgroundColor: '#bdc3c7'
                    };
                }
            };
            $scope.feeds = response.data;
        });
    }]
);


// Filters
// ========================================
app.filter(
    'tweetTextFilter',
    function() {
        return function(input, entities) {
            console.log(input);
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
            input_pieces.push(input.slice(beginning_point, 140)); // last piece
            // return input
            return input_pieces.join("");
        };
    }
);
