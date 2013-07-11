(function(window, angular, undefined) {


var Filters = angular.module('small-read:filters', []);

// Filters
// ========================================
Filters.filter(
    'tweetTextFilter',
    function() {
        return function(input, params) {
            if (params instanceof Array) {
                var entities = params[0], includeImage = params[1];
            } else {
                var entities = params;
            }
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
            var imageTag = null, input_pieces = [], beginning_point = 0;
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
                        if (imageTag === null) imageTag = '<a href="'+value.media_url+'" target="_blank"><img src="'+value.media_url+':thumb" /></a>';
                        break;
                }
                beginning_point = value.indices[1];
            });
            // last piece, '140' fix truncated tweet text issue
            input_pieces.push(input.slice(beginning_point, 140));
            // top tweets
            if (includeImage) {
                var output = imageTag ? imageTag+"<p>"+input_pieces.join("")+"</p>" : "<p>"+input_pieces.join("")+"</p>";
            } else {
                var output = input_pieces.join("");
            }
            // return
            return output;
        };
    }
);


Filters.filter(
    'tweetTimestampFilter',
    function() {
        return function(input) {
            var inputDate = input, currentDate = new Date();
            var diffInTime = currentDate - inputDate;
            if (diffInTime / 1000 / 60 <= 60) {
                return Math.floor(diffInTime / 1000 / 60) + " mins ago";
            } else if (diffInTime / 1000 / 60 / 60 <= 24) {
                return Math.floor(diffInTime / 1000 / 60 / 60) + " hours ago";
            } else {
                return inputDate.toDateString();
            }
        };
    }
);


})(window, window.angular);
