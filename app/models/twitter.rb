class Twitter < ActiveRecord::Base
  include OauthTwitter

  # Relationships
  belongs_to :user, foreign_key: "local_user_id"
  has_many   :feeds, :dependent => :destroy
  has_many   :tweets, :through => :feeds
  has_many   :read_tweets, :through => :feeds

  # Attributes
  attr_accessible :user_id, :oauth_token, :oauth_token_secret, :screen_name


  # def refresh_account
  def refresh_account(options={})
    # Load id: 15/15min
    remote_ids     = self.friends_ids(:user_id => self.user_id)['ids']
    remote_id_strs = remote_ids.map {|id| id.to_s}
    local_id_strs  = Feed.friends_id_strs(self.id)

    # Compare friends list
    new_ids        = remote_id_strs - local_id_strs
    deleted_ids    = local_id_strs - remote_id_strs

    # Add new friends: 180/15min
    if !new_ids.empty?
      new_friends    = self.users_lookup(:user_id => new_ids)
      general_folder = self.user.folders.where(:name => 'general')[0]
      new_feeds      = new_friends.map {|f| Feed.create_from_raw(f)}
      new_feeds.count_unread
      self.feeds     << new_feeds
      general_folder.feeds << new_feeds
    end

    # Delete friends
    self.feeds.where(:id_str => deleted_ids).destroy_all if !deleted_ids.empty?

    # Update tweets
    page_num = options[:as_much_as_possible] == true ? 9 : nil
    if self.newest_tweet_id
      raw_tweets = self.home_timeline({:since_id => self.newest_tweet_id, :count => 200}, {:pages => page_num})
    else
      raw_tweets = self.home_timeline({:count => 200}, {:pages => page_num})
    end

    if !raw_tweets.empty?
      affected_feeds = Feed.create_tweets_from_raw(raw_tweets, self.id, :return_affected_feeds => true)
      self.update_attribute(:newest_tweet_id, raw_tweets[0]['id_str'])

      # Update unread_count
      # self.user.folders.each {|fd| fd.count_unread(:count_feeds_unread => true)}
      affected_feeds.each {|fe| fe.count_unread}
      self.user.folders.each {|fd| fd.count_unread}
    end
  end

end
