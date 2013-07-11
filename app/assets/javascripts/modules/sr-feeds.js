(function(window, angular, Date, undefined) {

// Modify Date to accept time string from sever
// ----------------------------------------
Date.prototype.setISO8601 = function (string) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
}


// Init
// ----------------------------------------
var SmallRead = angular.module('small-read:feeds', []);

SmallRead.factory('Feeds',
    ['$http', '$q', '$timeout', function($http, $q, $timeout) {
        return {
            parseTweetEntities: function(tweet) {
                tweet.entities = angular.fromJson(tweet.entities);
            },
            parseTweetTime: function(tweet) {
                var date = new Date();
                date.setISO8601(tweet.created_at);
                tweet.created_at = date;
            },
            getFeedCards: function(callback, groupId) {
                var params = {cards: 'true'};
                if (groupId) params['folder_id'] = groupId;
                var that = this;
                var http = $http.get('/feeds', {
                    params: params,
                    transformResponse: function(data, headersGetter) {
                        var object = angular.fromJson(data);
                        for (var i = 0; i < object.length; i++) {
                            that.parseTweetEntities(object[i].coverTweet);
                            that.parseTweetTime(object[i].coverTweet);
                            for (var j = 0; j < object[i].topTweets.length; j++) {
                                that.parseTweetEntities(object[i].topTweets[j]);
                                that.parseTweetTime(object[i].topTweets[j]);
                            };
                        };
                        return object;
                    }
                });
                return http.then(function(response) {
                    return (callback) ? callback(response.data) : response.data;
                });
            },
            getFeeds: function(folderId) {
                folderId = typeof folderId !== 'undefined' ? folderId : null;
                var url = folderId ? '/folders/'+folderId+'/feeds' : '/feeds';
                var http = $http.get(url);
                return http.then(function(response) {return response.data;});
            },
            getTweets: function(sourceId, maxId, sourceType, readOnly) {
                // default args
                sourceId   = typeof sourceId !== 'undefined' ? sourceId : null;
                maxId      = typeof maxId !== 'undefined' ? maxId : null;
                sourceType = typeof sourceType !== 'undefined' ? sourceType : 'feed';
                readOnly   = typeof readOnly !== 'undefined' ? readOnly : true;
                // options for http get
                var url = sourceId ? '/'+sourceType+'s/'+sourceId+'/tweets' : '/tweets';
                var all = readOnly ? null : 'true';
                // $http
                var that = this;
                if (maxId || all) {
                    var params = {};
                    if (maxId) params['max_id'] = maxId;
                    if (all)   params['all']    = all;
                } else {
                    var params = null;
                }
                var http = $http.get('/'+sourceType+'s/'+sourceId+'/tweets', {
                    params: params,
                    transformResponse: function(data, headersGetter) {
                        var object = angular.fromJson(data);
                        for (var i = 0; i < object.length; i++) {
                            that.parseTweetEntities(object[i]);
                            that.parseTweetTime(object[i]);
                        };
                        return object;
                    }
                });
                return http.then(function(response) {return response.data;});
            }
        };
    }]
);


})(window, window.angular, window.Date);
