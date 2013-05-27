class Feed < ActiveRecord::Base

  belongs_to  :twitter
  belongs_to  :folder
  has_many    :tweets, :dependent => :destroy
  has_many    :read_tweets, :dependent => :destroy

  attr_accessible :id_str, :screen_name, :name, :profile_image_url,
                  :folder_id, :unread_count

  # self.create_from_raw(twitter_user)
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
  def self.create_tweets_from_raw(raw_tweets, twitter_id, options={})
    twitter = Twitter.find(twitter_id)
    # filter muted feeds
    muted_feeds_ids = twitter.user.folders.find_by_name('muted').feeds.pluck(:id_str)
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
  def self.friends_id_strs(twitter_id)
    return Feed.where(:twitter_id => twitter_id).select(:id_str).pluck(:id_str)
  end

  #
  def count_unread
    self.unread_count = self.tweets.where(['read IS NULL OR read IS FALSE']).size
    self.save
    self
  end

  #
  # def as_json(option={})
  #   # count_unread
  #   super option
  # end

end
