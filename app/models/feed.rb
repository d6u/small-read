class Feed < ActiveRecord::Base

  belongs_to :twitter
  belongs_to :folder
  has_many   :tweets,        :dependent  => :destroy
  has_many   :read_tweets,   :dependent  => :destroy
  has_many   :unread_tweets, :class_name => 'Tweet', :conditions => 'tweets.read = false'

  attr_accessible :id_str,
                  :screen_name,
                  :name,
                  :profile_image_url,
                  :folder_id,
                  :twitter_id,
                  :created_at,
                  :updated_at,
                  :unread_count,
                  :top_tweets

  ##
  # Mass insert feeds from Twitter API user data
  #
  # ------------------------------------------
  def self.mass_insert(twitter_users, twitter_id, folder_id)
    return if twitter_users.empty?
    # clean up raw data
    users_cleaned = twitter_users.map do |user|
      [
        user['id_str'],
        user['screen_name'],
        user['name'],
        user['profile_image_url'],
        folder_id,
        twitter_id,
        Time.now, # created_at
        Time.now  # updated_at
      ]
    end

    # generate sql statements
    insert_statements = users_cleaned.map do |user|
      "(#{(user.map do |field|
        if field.class == String
          "'#{field.gsub("'", "''")}'"
        elsif field.class == Time # TODO: make sure time zone is right
          "'#{field.to_s}'"
        else
          field
        end
      end).join(',')})"
    end

    # insertion
    sql_insert = "INSERT INTO feeds (id_str, screen_name, name, profile_image_url, folder_id, twitter_id, created_at, updated_at) VALUES #{insert_statements.join(',')};"

    return ActiveRecord::Base.connection.execute(sql_insert)
  end


  ##
  # Analyze unread tweets and marking top tweets
  #
  # ------------------------------------------
  def update_top_tweets
    unread_tweets = self.unread_tweets
    unread_tweets.each {|t| t.calculate_score}
    unread_tweets.sort {|a, b| b.score <=> a.score}
    self.top_tweets = (unread_tweets[0..2].map {|t| t.id}).join(',')
    self.save
  end


  # self.create_from_raw(twitter_user)
  # ----------------------------------
  def self.create_from_raw(twitter_user)
    return Feed.new({
                 id_str: twitter_user['id_str'],
            screen_name: twitter_user['screen_name'],
                   name: twitter_user['name'],
      profile_image_url: twitter_user['profile_image_url'],
           unread_count: 0
    })
  end

  # self.create_tweets_from_raw(raw_tweets, twitter_id)
  # ---------------------------------------------------
  def self.create_tweets_from_raw(raw_tweets, twitter_id, options={})
    twitter = Twitter.find(twitter_id)
    # filter muted feeds
    muted_feeds_ids = twitter.user.folders.where("lower(name) = 'muted'").first.feeds.pluck(:id_str)
    muted_feeds_ids << twitter.user_id
    # insert tweets
    if options[:return_affected_feeds] === true
      affected_feeds = []
      raw_tweets.each do |raw_t|
        next if muted_feeds_ids.include? raw_t['user']['id_str']
        feed = twitter.feeds.find_by_id_str(raw_t['user']['id_str'])
        begin
          feed.tweets << Tweet.new_from_raw(raw_t)
        rescue ActiveRecord::RecordNotUnique
          next
        end
        affected_feeds << feed
      end
      return affected_feeds.uniq
    else
      raw_tweets.each do |raw_t|
        next if muted_feeds_ids.include? raw_t['user']['id_str']
        feed = twitter.feeds.find_by_id_str(raw_t['user']['id_str'])
        begin
          feed.tweets << Tweet.new_from_raw(raw_t)
        rescue ActiveRecord::RecordNotUnique
          next
        end
      end
      return nil
    end
  end

  # self.friends_id_strs(twitter_id)
  # --------------------------------
  def self.friends_id_strs(twitter_id)
    return Feed.where(:twitter_id => twitter_id).select(:id_str).pluck(:id_str)
  end

  # count_unread
  # ------------
  def count_unread
    self.unread_count = self.tweets.where(['read IS FALSE']).size
    self.save
    self
  end

end
