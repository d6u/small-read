class Folder < ActiveRecord::Base
  # Relationships
  belongs_to :user
  has_many   :feeds
  has_many   :tweets,      :through => :feeds
  has_many   :read_tweets, :through => :feeds

  # Atrributes
  attr_accessible :name, :color, :position, :reserved


  def count_unread(args = {})
    self.unread_count = 0
    feeds = self.feeds
    if args[:count_feeds_unread] == true
      feeds.each {|f| self.unread_count += f.count_unread.unread_count}
    else
      begin
        feeds.each {|f| self.unread_count += f.unread_count}
      rescue TypeError
        feeds.each {|f| self.unread_count += f.count_unread.unread_count}
      end
    end
    self.save
    [self, feeds]
  end


  ##
  # Callbacks
  #
  # ========================================
  before_destroy :move_feeds_to_general_folder
  # TODO: prevent general and muted folder from being deleted
  before_create :normalize_fields


  ##
  # ========================================
  private
  ##
  # Make sure remove every feeds belongs to this folder to general folder
  #
  # ----------------------------------------
  def move_feeds_to_general_folder
    general_folder = Folder.where(["user_id = ? AND lower(name) = 'general'", self.user_id]).first
    self.feeds.update_all(:folder_id => general_folder.id)
  end


  ##
  # Assign default value
  #
  # ----------------------------------------
  def normalize_fields
    self.unread_count = 0
  end

end
