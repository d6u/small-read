class Folder < ActiveRecord::Base
  # Relationships
  belongs_to :user
  has_many   :feeds,       :dependent => :destroy
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

end
