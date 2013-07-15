class Twitter < ActiveRecord::Base
  include OauthTwitter

  # Relationships
  belongs_to :user, foreign_key: "local_user_id"
  has_many   :feeds, :dependent => :destroy
  has_many   :tweets, :through => :feeds
  has_many   :read_tweets, :through => :feeds

  # Attributes
  attr_accessible :user_id, :oauth_token, :oauth_token_secret, :screen_name


  ##
  # Fetch friends and tweets data from Twitter API
  #
  # ----------------------------------------
  def refresh_account(options={})
    # 1. compare local friends id with remote friends id deciding which to delete on local db
    feeds = Feed.where(:twitter_id => self.id)
    friends_id_remote = self.friends_ids(:user_id => self.user_id, :stringify_ids => true)[:data]['ids']
    friends_id_local = feeds.map {|f| f.id_str}

    # expection for empty friends_id_remote
    friends_id_remote = friends_id_local if friends_id_remote.empty?

    removing_ids = friends_id_local - friends_id_remote
    Feed.destroy_all(:id_str => removing_ids, :twitter_id => self.id) if !removing_ids.empty?

    home_timeline = self.home_timeline({:count => 200}, {:pages => 5})[:data]
    # home_timeline is not empty (not exceeding API limits)
    if !home_timeline.empty?
      # 2. assamble user data from home_timeline
      timeline_users = (home_timeline.map {|t| t['user']['id_str'] === self.user_id ? nil : t['user']}).compact.uniq

      # 3. fetch user data that is not on home_timeline
      friends_id_timeline = timeline_users.map {|u| u['id_str']}
      fetching_ids = friends_id_remote - friends_id_timeline
      all_users = self.users_lookup(:user_id => fetching_ids)[:data] + timeline_users

    # home_timeline is empty
    else
      # load all user data from remote when home_timeline is not available
      all_users = self.users_lookup(:user_id => friends_id_remote)[:data]
    end

    # 4. save new users into 'general' folder
    new_friends_id = friends_id_remote - friends_id_local
    if !new_friends_id.empty?
      new_users = all_users.select {|u| new_friends_id.include? u['id_str']}
      general_folder = Folder.where(["user_id = ? AND lower(name) = 'general'", self.local_user_id]).first
      Feed.mass_insert(new_users, self.id, general_folder.id)
    end

    # 5. update other user
    existing_users = new_friends_id.empty? ? all_users : all_users - new_users
    update_existing_users(feeds, existing_users) if !existing_users.empty?

    # home_timeline is not empty (not exceeding API limits)
    if !home_timeline.empty?
      # 6. insert new tweets from home_timeline
      if self.newest_tweet_id
        new_tweets = home_timeline.select {|t| t['id_str'].to_i > self.newest_tweet_id.to_i}
        # 7. update existing tweets
        existing_tweets = home_timeline - new_tweets
        update_existing_tweets(existing_tweets) if !existing_tweets.empty?
      else
        new_tweets = home_timeline
      end

      # insert new tweets if there are new tweets
      if !new_tweets.empty?
        Tweet.mass_insert(new_tweets.reverse, self)

        # 7. update newest_tweet_id and unread_count
        self.update_attribute(:newest_tweet_id, home_timeline.first['id_str'])
        Feed.where(:id_str => friends_id_timeline, :twitter_id => self.id).each {|f| f.count_unread}
        Folder.where(:user_id => self.local_user_id).each {|f| f.count_unread}
      end
    end
  end


  ##
  # Analyze timeline, arrange top tweet for show
  #
  # ----------------------------------------
  def self.analyze_timeline(twitter_id, options={})
    ActiveRecord::Base.transaction do
      Twitter.find_by_id(twitter_id).feeds.each {|feed| feed.update_top_tweets(options)}
    end
  end


  ##
  # private methods
  #
  # ========================================
  private
  ##
  # update existing users with users' data from Twitter API
  #
  # ----------------------------------------
  def update_existing_users(feeds, existing_users)
    existing_users_list = Hash[(existing_users.map {|u| [u['id_str'], u]})]
    feeds.each do |feed|
      begin
        feed.attributes = {
          :screen_name => existing_users_list[feed.id_str]['screen_name'],
          :name => existing_users_list[feed.id_str]['name'],
          :profile_image_url => existing_users_list[feed.id_str]['profile_image_url']
        }
        feed.save if feed.changed?
      rescue NoMethodError
        puts "--> NoMethodError:"
        ap feed
        ap existing_users_list[feed.id_str]
        puts "--> Rescue finish."
      end
    end
  end


  ##
  # update existing tweets with home_timeline data
  #
  # retweet_count, favorite_count
  # ----------------------------------------
  def update_existing_tweets(existing_tweets)
    existing_tweets.each do |t|
      tweet = self.tweets.where(:id_str => t['id_str']).first
      begin
        tweet.attributes = {:retweet_count => t['retweet_count'], :favorite_count => t['favorite_count']}
        tweet.save if tweet.changed?
      rescue NoMethodError
        puts "--> Skipping tweet with: 'id_str' => #{t['id_str']}"
      end
    end
  end

end
