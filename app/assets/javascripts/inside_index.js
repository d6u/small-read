//= require modernizr-2.6.2.min.js
//= require jquery-2.0.0.min.js
//= require jquery_ujs
//= require jquery-ui-1.10.3.custom.min.js
//= require underscore.min.js
//= require json2.js
//= require backbone.min.js
//= require jquery.simplemodal.1.4.4.min.js
//= require custom-functions.js
//= require modules/feedback_modal.js


var needle;
$(document).ready(function() {

// Navbar View
// ===========
var NavbarView = Backbone.View.extend({
    el: '.navbar',
    events: {
        'click .refresh-feeds': 'fetchFoldersAndFeeds'
    },
    fetchFoldersAndFeeds: function(event) {
        event.preventDefault();
        if (!$(event.currentTarget).children('.icon-refresh').hasClass('icon-spin')) {
            var url = $(event.currentTarget).attr('href');
            $(event.currentTarget).children('.icon-refresh').addClass('icon-spin');
            $.get(url, function(data, textStatus, jqXHR) {
                _.each(folders.models, function(folder, index, models) {
                    folder.feeds.fetch({
                        success: function(collection, response, options) {
                            folder.fetch();
                        }
                    });
                });
                $(event.currentTarget).children('.icon-refresh').removeClass('icon-spin');
            });
        }
    }
});

var navbar_view = new NavbarView();

// Tweets
// ======
var TweetView = Backbone.View.extend({
    tagName: 'div',
    className: 'tweet clearfix',
    template: _.template($('#tweet-template').html()),
    events: {
        'click': 'toggleReadWhenClick'
    },
    render: function() {
        this.$el.append(this.template(this.model.attributes));
        return this;
    },
    toggleReadWhenClick: function(event) {
        if (this.model.get('read') !== true) {
            this.model.toggleRead();
        }
    }
});

var Tweet = Backbone.Model.extend({
    initialize: function(attributes, options) {
        this.entities = JSON.parse(attributes.entities);
        if (this.entities.media) {
            this.set('entities_image', this.entities.media[0].media_url);
        } else {
            this.set('entities_image', null);
        }
        this.view = new TweetView({ model: this });
    },
    toggleRead: function(save) {
        save = typeof save !== 'undefined' ? save : true;
        var that = this;
        this.view.$el.addClass("read");
        this.set('read', true);
        if (save === true) {
            var unread_count = tweets.current_source.get('unread_count');
            tweets.current_source.set('unread_count', unread_count - 1);
            if (!tweets.current_source.has('folder_id')) {
                // folder
                var source_feed = tweets.current_source.feeds.where({id: this.get('feed_id').toString()})[0];
                var feed_unread_count = source_feed.get('unread_count');
                source_feed.set('unread_count', feed_unread_count - 1);
            } else {
                // feed
                var parent_folder_id = tweets.current_source.get('folder_id');
                var parent_folder = folders.where({id: parent_folder_id})[0];
                var parent_folder_unread_count = parent_folder.get('unread_count');
                parent_folder.set('unread_count', parent_folder_unread_count - 1);
            }
            this.save(
                {read: true},
                {
                    success: function(model, response, options) {},
                    error: function(model, xhr, options) {}
                }
            );
        }
    }
});

var TweetsContent = Backbone.View.extend({
    el: '.tweets',
    events: {
        // 'scroll' event won't bubble up, attached in initialize()
        'click #mark_all_read': 'markAllRead'
    },
    initialize: function() {
        // attach 'scroll' event
        var that = this;
        this.$('.tweets-list').on('scroll', function() {
            that.markRead();
        });
    },
    markRead: function() {
        _.each(this.collection.models, function(model, index, models) {
            if (!model.get('read') && (model.view.$el.position().top + 20) < 0) {
                model.toggleRead();
            }
        });
    },
    markAllRead: function(event) {
        event.preventDefault();
        var that = this;
        if (confirm('Mark everything READ?')) {
            var all_tweets_ids = [];
            _.each(this.collection.where({read: null}), function(ele, index, eles) {
                all_tweets_ids.push(ele.id);
            });
            $.post('/mark_all_read', {ids: all_tweets_ids.join()},
                function(data, textStatus, jqXHR) {
                    _.each(that.collection.models, function(tweet, index, models) {
                        tweet.toggleRead(false);
                        tweets.current_source.set('unread_count', 0);
                        if (!tweets.current_source.has('folder_id')) {
                            // folder
                            var source_feed = tweets.current_source.feeds.where({id: this.get('feed_id').toString()})[0];
                            source_feed.set('unread_count', 0);
                        }
                    });
                }
            );
        }
    }
});

var Tweets = Backbone.Collection.extend({
    model: Tweet,
    initialize: function(models, options) {
        this.view = options.view;
        this.view.collection = this;
        // empty current set of Tweets
        this.on('reset', function(collection, options) {
            _.each(options.previousModels, function(model, index, models) {
                model.view.remove();
            }, this);
        }, this);
        // add new Tweets
        this.on('add', function(tweet, tweets, options) {
            this.view.$('.tweets-list').append(tweet.view.render().el);
        }, this);
    },
    loadTweets: function(source) {
        this.view.$('.tweets-list').scrollTop(0);
        this.reset();
        this.view.$('.tweets-list').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>');
        this.current_source = source;
        this.url = source.has('folder_id') ? ("/feeds/"+this.current_source.id + "/tweets") : ("/folders/"+this.current_source.id + "/tweets");
        this.fetch({
            success: function(collection, response) {},
            error: function(collection, response) {}
        });
    },
    parse: function(response) {
        this.view.$('.tweets-list').empty();
        return response;
    }
});

// Folder
// ======
var FolderView = Backbone.View.extend({
    tagName: 'div',
    className: 'folder list-container-item',
    template: _.template($('#folder-template').html()),
    events: {
        'click .folder-face': 'loadTweets'
    },
    initialize: function(options) {
        var that = this;
        this.listenTo(this.model, 'change:unread_count', function(model, value, options) {
            that.el.dataset.unread_count = value;
            that.$('.folder-face .unread-count').html(value);
        });
    },
    render: function() {
        this.$el.append(this.template(this.model.attributes));
        return this;
    },
    // events callbacks
    loadTweets: function(event) {
        event.preventDefault();
        tweets.loadTweets(this.model);
    }
});

var Folder = Backbone.Model.extend({
    urlRoot: '/folders',
    initialize: function(attributes, options) {
        if (!options.view) {
            this.view = new FolderView({model: this});
        } else {
            this.view = new FolderView({el: options.view, model: this});
        }
        this.feeds = options.feeds;
        this.feeds.folder = this;
    }
});

var Folders = Backbone.Collection.extend({
    model: Folder,
    initialize: function(models, options){
        this.view = options.view;
        this.view.collection = this;
    }
});

// Feed
// ====
var FeedView = Backbone.View.extend({
    tagName: 'div',
    className: 'feed list-container-item',
    template: _.template($('#feed-template').html()),
    events: {
        'click .item-face': 'loadTweets'
    },
    initialize: function(options){
        var that = this;
        this.listenTo(this.model, 'change:folder_id', function(model, value, options) {
            that.el.dataset.folder_id = value;
        });
        this.listenTo(this.model, 'change:unread_count', function(model, value, options) {
            that.el.dataset.unread_count = value;
            that.$('.unread-count').html(value);
        });
    },
    render: function() {
        this.$el.append(this.template(this.model.attributes));
        return this;
    },
    // events callbacks
    loadTweets: function(event) {
        event.preventDefault();
        tweets.loadTweets(this.model);
    }
});

var Feed = Backbone.Model.extend({
    urlRoot: "/feeds",
    initialize: function(attributes, options) {
        if (!options.view) {
            this.view = new FeedView({model: this, attributes: this.attributes});
        } else {
            this.view = new FeedView({el: options.view, model: this});
        }
    }
});

var Feeds = Backbone.Collection.extend({
    model: Feed,
    initialize: function(models, options) {
        this.url = '/folders/'+options.folder_id+'/feeds';
        this.on('add', function(feed, feeds, options) {
            this.folder.view.$('.folder-feeds-list').append(feed.view.render().el);
        }, this);
        this.on('remove', function(feed, feeds, options) {
            feed.view.remove();
        }, this);
    }
});

// Main Views
// ==========
var FeedsContent = Backbone.View.extend({
    el: '.feeds'
});

// Initialization of App
// =====================
var folder_models = [];

$('.folder').each(function(index, folder_element) {
    var $folder_ele = $(folder_element);

    // Feed
    var feed_models = [];

    $folder_ele.find('.feed').each(function(index, feed_element) {
        // var $feed_ele = $(feed_element);
        feed_models.push(new Feed(
            feed_element.dataset,
            { view: feed_element }
        ));
    });

    // Folder
    folder_models.push(new Folder(
        folder_element.dataset,
        {
            view: folder_element,
            feeds: new Feeds(
                feed_models,
                {folder_id: folder_element.dataset.id}
            )
        }
    ));
});

// Init Folders and Tweets
var folders = new Folders(
    folder_models,
    { view: new FeedsContent() }
);
var tweets = new Tweets(
    [],
    { view: new TweetsContent() }
);

folders.view.$('.folder-feeds-list').sortable({
    axis: "y",
    connectWith: ".folder-feeds-list",
    placeholder: "feed-sortable-placeholder",
    scrollSpeed: 40,
    zIndex: 100,
    update: function(event, ui) {
        if (ui.sender) {
            var sender_id   = ui.sender.closest('.folder')[0].dataset.id,
                receiver_id = ui.item.closest('.folder')[0].dataset.id,
                feed_id     = ui.item[0].dataset.id;
            var sender      = folders.where({id: sender_id})[0],
                receiver    = folders.where({id: receiver_id})[0],
                feed        = sender.feeds.where({id: feed_id})[0];
            feed.save({folder_id: receiver_id});
            sender.feeds.remove(feed, {silent: true});
            receiver.feeds.add(feed, {silent: true});
        }
    }
});

// END of Document Ready
});
