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


// Manage Folders view
// -------------------
var ManageFoldersView = Backbone.View.extend({
    el: '.folder-management',
    events: {
        'click #create_new_folder_button': 'addNewFolder'
    },
    initialize: function(options) {
        var that = this;
        this.initSortable();
    },
    initSortable: function() {
        this.$('.folder-list').sortable({
            handle: ".rearrange-folder",
            placeholder: "folder-list-sortable-placeholder",
            scrollSpeed: 40,
            zIndex: 100,
            update: function(event, ui) {
                that.collection.updatedFolderPositions();
            }
        }).disableSelection();
    },
    addNewFolder: function(event) {
        event.preventDefault();
        if (this.$('#new_folder_name').val() === "") {
            this.showCreateFolderWarning();
        } else {
            this.hideCreateFolderWarning();
            this.collection.create(
                {
                    name: this.$('#new_folder_name').val(),
                    position: 0
                },
                { wait: true }
            );
        }
    },
    showCreateFolderWarning: function() {
        this.$('#create_folder_alert').fadeIn(200);
    },
    hideCreateFolderWarning: function() {
        this.$('#create_folder_alert').fadeOut(200);
    }
});

// FolderOnlyView View
// -------------------
var FolderOnlyView = Backbone.View.extend({
    tagName: 'div',
    className: 'folder-list-item alert alert-info',
    template: _.template($('#folder-management-template').html()),
    events: {
        'click .rename-folder': 'renameFolder',
        'dblclick .folder-list-item-name': 'renameFolder',
        'click .submit-folder-rename': 'finishRenaming',
        'click .delete-folder': 'deleteFolder'
    },
    initialize: function(options) {
        var that = this;
        this.listenTo(this.model, 'change:name', function(model, value, options) {
            that.$('.folder-list-item-name').html(model.get('name'));
        });
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
    renameFolder: function(event) {
        this.$('.folder-list-item-rename input').val(this.model.get('name'));
        this.$('.folder-list-item-name').toggle();
        this.$('.folder-list-item-rename').toggle();
        if ( this.$('.rename-folder').html() === "Rename" ) {
            this.$('.rename-folder').html('Cancel');
        } else {
            this.$('.rename-folder').html('Rename');
        }
    },
    finishRenaming: function(event) {
        var new_name = this.$('.folder-list-item-rename input').val();
        if ( new_name !== "" && new_name !== this.model.name ) {
            this.model.save({name: new_name});
        }
        this.$('.folder-list-item-rename').hide();
        this.$('.folder-list-item-name').show();
    },
    deleteFolder: function(event) {
        if (confirm('Do you want to delete folder: '+this.model.get('name')+'?')) {
            var that = this;
            var collection = this.model.collection;
            this.model.destroy({
                wait: true,
                success: function(model, response, options) {
                    that.remove();
                    collection.updatedFolderPositions();
                }
            });
        }
    }
});

// FolderOnly Model
// ----------------
var FolderOnly = Backbone.Model.extend({
    initialize: function(attributes, options) {
        if (options.view) {
            this.view = new FolderOnlyView({
                el: options.view,
                model: this
            });
        } else {
            this.view = new FolderOnlyView({
                model: this
            });
        }
    }
});

// FolderOnlyCollection
// --------------------
var FolderOnlyCollection = Backbone.Collection.extend({
    model: FolderOnly,
    url: '/folders',
    initialize: function(models, options) {
        this.view = options.view;
        this.view.collection = this;
        this.on('add', function(model, collection, options) {
            this.view.$('.folder-list').append(model.view.render().el);
            this.updatedFolderPositions();
        }, this);
    },
    updatedFolderPositions: function() {
        var position_pair = [];
        this.each(function(folder_only_model) {
            position_pair.push({
                id: folder_only_model.id,
                position: folder_only_model.view.$el.index()
            });
        });
        var id_str = _.pluck(position_pair, 'id').join();
        var position_str = _.pluck(position_pair, 'position').join();
        $.post(
            '/bg/update_folder_positions',
            {
                id_str: id_str,
                position_str: position_str
            },
            function(data, textStatus, jqXHR) {
            }
        );
    }
});

// Initialization
// ==============
var folder_list_items = [];
$('.folder-list-item').each(function(index, ele) {
    folder_list_items.push(new FolderOnly(
        ele.dataset,
        { view: ele }
    ));
});

var folder_only_collection = new FolderOnlyCollection(
    folder_list_items,
    { view: new ManageFoldersView() }
);

// END of Document Ready
});