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


$(document).ready(function() {

// ================================ Tweets ====================================

// TweetView
var TweetView = Backbone.View.extend({

    tagName: 'div',
    className: 'tweet clearfix',
    template: _.template($('#tweet-template').html()),

    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.append(this.template(this.model.attributes));
        return this;
    }
});

// Tweet
var Tweet = Backbone.Model.extend({

    initialize: function(attrs, options) {
        this.entities = JSON.parse(attrs.entities);
        if (this.entities.media) {
            this.set('entities_image', this.entities.media[0].media_url);
        } else {
            this.set('entities_image', null);
        }
        this.view = new TweetView({model:this});
    },
    toggleRead: function() {
        var that = this;
        this.view.$el.addClass("read");
        this.save(
            {read: true},
            {
                success: function(model, response, options) {
                    var unread_count = model.collection.active_feed.get('unread_count');
                    model.collection.active_feed.set({unread_count: unread_count - 1});
                    // folder
                    if (!model.collection.active_feed.has('folder_id')) {
                        var folder = model.collection.active_feed;
                        var feed = folder.feeds.where({id: that.get('feed_id')})[0];
                        var feed_unread_count = feed.get('unread_count');
                        feed.set('unread_count', feed_unread_count - 1);
                    }
                },
                error: function(model, xhr, options) {}
            }
        );
    },
    markAllReadToggleRead: function() {
        this.view.$el.addClass("read");
    }
});

// TweetsContent view
var TweetsContent = Backbone.View.extend({

    el: '.tweets',
    events: {
        // 'scroll' event won't bubble up, attached in initialize()
        'click #mark_all_read': 'markAllRead'
    },

    initialize: function() {
        // attach 'scroll' event
        this.$('.tweets-list').on('scroll', function() {
            tweets.markRead();
        });
    },
    markAllRead: function(event) {
        var that = this;
        if (confirm('Sure to mark everything READ?')) {
            var mark_all_read_ids = this.collection.pluck('id');
            $.get('/mark_all_read', {ids: mark_all_read_ids.join()},
                function(data, textStatus, jqXHR) {
                    _.each(that.collection.models, function(model, index, models) {
                        model.markAllReadToggleRead();
                        var unread_count = model.collection.active_feed.get('unread_count');
                        model.collection.active_feed.set({unread_count: unread_count - 1});
                        // folder
                        if (!model.collection.active_feed.has('folder_id')) {
                            var folder = model.collection.active_feed;
                            var feed = folder.feeds.where({id: that.get('feed_id')})[0];
                            var feed_unread_count = feed.get('unread_count');
                            feed.set('unread_count', feed_unread_count - 1);
                        }
                    });
                }
            );
        }
    }
});

// Tweets
var Tweets = Backbone.Collection.extend({

    model: Tweet,

    // Functions
    initialize: function() {
        this.view = new TweetsContent({collection: this});
        this.on('add', function(tweet, tweets, options) {
            this.view.$('.tweets-list').append(tweet.view.el);
        }, this);
        this.on('reset', function(collection, options) {
            _.each(options.previousModels, function(model, index, models) {
                model.view.remove();
            }, this);
        }, this);
    },
    loadTweets: function(feed) {
        this.view.$('.tweets-list').scrollTop(0);
        this.reset();
        this.view.$('.tweets-list').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>');
        this.active_feed = feed;
        if (feed.has('folder_id')) {
            this.url = "/feeds/" + this.active_feed.id + "/tweets";
        } else {
            this.url = "/folders/" + this.active_feed.id + "/tweets";
        }
        this.fetch({
            success: function(collection, response) {},
            error: function(collection, response) {}
        });
    },
    parse: function(response) {
        this.view.$('.tweets-list').empty();
        return response;
    },
    markRead: function() {
        _.each(this.models, function(model, index, models) {
            if (!model.get('read') && (model.view.$el.position().top + 20) < 0) {
                model.toggleRead();
            }
        });
    }
});

// ================================ Feeds =====================================

// FolderView
var FolderView = Backbone.View.extend({

    tagName: 'div',
    className: 'folder list-container-item',
    attributes: {},
    template: _.template($('#folder-template').html()),
    events: {
        'click .folder-face': 'loadTweets'
    },

    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.append(this.template(this.model.attributes));
        return this;
    },

    // events callbacks
    loadTweets: function(event) {
        tweets.loadTweets(this.model);
        event.preventDefault();
    }
});

// FeedView
var FeedView = Backbone.View.extend({

    tagName: 'div',
    className: 'feed list-container-item',
    template: _.template($('#feed-template').html()),
    events: {
        'click .item-face': 'loadTweets'
    },

    initialize: function() {
        this.render();
        this.listenTo(this.model, 'change:unread_count', function() {
            this.$('.unread-count').html(this.model.get('unread_count'));
        });
    },
    render: function() {
        this.$el.append(this.template(this.model.attributes));
        return this;
    },

    // events callbacks
    loadTweets: function(event) {
        tweets.loadTweets(this.model);
        event.preventDefault();
    }
});

// Feed model
var Feed = Backbone.Model.extend({

    urlRoot: "/feeds",

    initialize: function() {
        this.view = new FeedView({
            model: this,
            attributes: {
                'data-id': this.id
            }
        });
    }
});

// Feeds collection
var Feeds = Backbone.Collection.extend({

    model: Feed,
    folder: null,

    initialize: function(models, options) {
        this.folder = options.folder;
        this.url = '/folders/'+this.folder.id+'/feeds';
        this.on('add', function(feed, feeds, options) {
            this.folder.view.$('.folder-feeds-list').append(feed.view.el);
        }, this);
        this.on('remove', function(feed, feeds, options) {
            feed.view.remove();
        }, this);
    }
});

// Folder model
var Folder = Backbone.Model.extend({

    initialize: function() {
        this.view = new FolderView({
            model: this,
            attributes: {
                'data-id': this.id
            }
        });
        this.feeds = new Feeds([], {folder: this});
        // events
        this.view.listenTo(this.feeds, 'change:unread_count', function(feed, value, options) {
            var unread_count = 0;
            _.each(this.model.feeds.models, function(model, index, models) {
                unread_count += model.get('unread_count');
            });
            this.model.set('unread_count', unread_count);
        });
        this.view.listenTo(this, 'change:unread_count', function(folder, value, options) {
            this.$('.folder-name + .unread-count').html(this.model.get('unread_count'));
        });
    }
});

// FeedsContent view
var FeedsContent = Backbone.View.extend({

    el: '.feeds'
});

// Folders collection
var Folders = Backbone.Collection.extend({

    model: Folder,
    url: '/folders',

    initialize: function() {
        this.view = new FeedsContent({collection: this});
        this.on('add', function(folder, folders, options) {
            this.view.$('.feeds-list').append(folder.view.el);
        }, this);
    }
});

// ================================ Navbar ====================================

// Navbar view
var NavbarView = Backbone.View.extend({

    el: '.navbar',
    events: {
        'click .refresh-feeds': 'animateRefreshButton'
    },

    animateRefreshButton: function(event) {
        if (!$(event.currentTarget).children('.icon-refresh').hasClass('icon-spin')) {
            var url = $(event.currentTarget).attr('href');
            $(event.currentTarget).children('.icon-refresh').addClass('icon-spin');
            $.get(url, function(data, textStatus, jqXHR) {
                $(event.currentTarget).children('.icon-refresh').removeClass('icon-spin');
                _.each(folders.models, function(folder, index, models) {
                    folder.feeds.fetch();
                });
            });
        }
        event.preventDefault();
    }
});

var navbar_view = new NavbarView();

// Initialization of App
var folders, tweets;

$.get('/bg/load_folders_and_feeds', function(response, textStatus, jqXHR) {

    folders = new Folders();
    tweets = new Tweets();

    folders.view.$('.feeds-list').empty();
    var last_folder;
    _.each(response, function(element, index, response) {
        // folder
        if (element.color) {
            last_folder = new Folder(element);
            folders.add(last_folder);
        }
        // feed
        else {
            last_folder.feeds.add(element);
        }
    });
    folders.view.$('.folder-feeds-list').sortable({
        axis: "y",
        connectWith: ".folder-feeds-list",
        placeholder: "feed-sortable-placeholder",
        scrollSpeed: 40,
        zIndex: 100,
        update: function(event, ui) {
            if (ui.sender) {
                var sender_id = Number(ui.sender.closest('.folder').attr('data-id')),
                    receiver_id = Number(ui.item.closest('.folder').attr('data-id')),
                    item_id = Number(ui.item.attr('data-id'));
                var sender = folders.where({id: sender_id})[0],
                    receiver = folders.where({id: receiver_id})[0],
                    feed = sender.feeds.where({id: item_id})[0];
                feed.save({folder_id: receiver_id});
                sender.feeds.remove(feed, {silent: true});
                receiver.feeds.add(feed, {silent: true});
            }
        }
    });
});

}); // End of doc ready
