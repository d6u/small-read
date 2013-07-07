class Tweet < ActiveRecord::Base

  belongs_to      :feed
  delegate        :twitter, :to => :feed

  attr_accessible :created_at,
                  :id_str,
                  :text,
                  :coordinates,
                  :place,
                  :retweet_count,
                  :favorite_count,
                  :entities,
                  :favorited,
                  :retweeted,
                  :lang,
                  # retweeted attr
                  :retweeted_status_id_str,
                  :retweeted_status_user_id_str,
                  :retweeted_status_user_screen_name,
                  :retweeted_status_user_name,
                  :retweeted_status_user_profile_image_url,
                  # custom attr
                  :read,
                  :feed_id,
                  :score


  ##
  # Raw SQL mass insertion operation, values from twitter API
  #
  # --------------------------------------------------
  def self.mass_insert(tweets_raw, twitter, feeds=nil)
    return if tweets_raw.empty?
    # retrive friends id str and id pair
    if feeds
      id_map = Hash[feeds.map {|feed| [feed.id_str, feed.id]}]
    else
      id_map = Hash[twitter.feeds.select('id, id_str').map {|feed| [feed.id_str, feed.id]}]
    end

    # clean up raw data
    tweets_cleaned = tweets_raw.map do |tweet_raw|
      if tweet_raw['user']['id_str'] === twitter.user_id
        nil
      elsif tweet_raw['retweeted_status']
        [
          Time.now, # updated_at
          tweet_raw['created_at'],
          tweet_raw['id_str'],
          tweet_raw['text'],
          tweet_raw['coordinates'].to_json,
          tweet_raw['place'].to_json,
          tweet_raw['retweet_count'],
          tweet_raw['favorite_count'],
          tweet_raw['entities'].to_json,
          tweet_raw['favorited'],
          tweet_raw['retweeted'],
          tweet_raw['lang'],
          id_map[tweet_raw['user']['id_str']], # feed_id
          tweet_raw['retweeted_status']['id_str'],
          tweet_raw['retweeted_status']['user']['id_str'],
          tweet_raw['retweeted_status']['user']['screen_name'],
          tweet_raw['retweeted_status']['user']['name'],
          tweet_raw['retweeted_status']['user']['profile_image_url']
        ]
      else
        [
          Time.now, # updated_at
          tweet_raw['created_at'],
          tweet_raw['id_str'],
          tweet_raw['text'],
          tweet_raw['coordinates'].to_json,
          tweet_raw['place'].to_json,
          tweet_raw['retweet_count'],
          tweet_raw['favorite_count'],
          tweet_raw['entities'].to_json,
          tweet_raw['favorited'],
          tweet_raw['retweeted'],
          tweet_raw['lang'],
          id_map[tweet_raw['user']['id_str']], # feed_id
          "null",
          "null",
          "null",
          "null",
          "null"
        ]
      end
    end

    # generate sql statements
    insert_statements = tweets_cleaned.compact.map do |tweet_cleaned|
      "(#{(tweet_cleaned.map do |field|
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
    sql_insert = "INSERT INTO tweets (updated_at, created_at, id_str, text, coordinates, place, retweet_count, favorite_count, entities, favorited, retweeted, lang, feed_id, retweeted_status_id_str, retweeted_status_user_id_str, retweeted_status_user_screen_name, retweeted_status_user_name, retweeted_status_user_profile_image_url) VALUES #{insert_statements.join(',')};"

    return ActiveRecord::Base.connection.execute(sql_insert)
  end


  ##
  # Detect which element this tweet has
  #
  # :with_image, :with_url, :with_coordinate, :with_mention, :with_hashtag
  # --------------------------------------------------
  def detect_tweet_type
    begin
      coordinates = MultiJson.load(self.coordinates)
    rescue ArgumentError
      coordinates = nil
    end
    entities    = MultiJson.load(self.entities)
    self.with_coordinate = true if coordinates && !coordinates.empty?
    self.with_image      = true if entities['media'] && !entities['media'].empty?
    self.with_url        = true if entities['urls'] && !entities['urls'].empty?
    self.with_mention    = true if entities['user_mentions'] && !entities['user_mentions'].empty?
    self.with_hashtag    = true if entities['hashtags'] && !entities['hashtags'].empty?
    self.save
    return self
  end


  ##
  # Generate score for tweet, which is used to display top tweets
  #
  # --------------------------------------------------
  def calculate_score
    self.score = self.retweet_count * 10 + self.favorite_count * 10
    self.score += 10 if self.with_image
    self.save
    return self
  end


  # TODO: benchmark and clean up old methods
  def self.new_from_raw(tw)
    if tw['retweeted_status']
      content = {
        retweeted_status_id_str:      tw['retweeted_status']['id_str'],
        retweeted_status_user_id_str: tw['retweeted_status']['user']['id_str'],
        retweeted_status_user_screen_name: tw['retweeted_status']['user']['screen_name'],
        retweeted_status_user_name:   tw['retweeted_status']['user']['name'],
        retweeted_status_user_profile_image_url: tw['retweeted_status']['user']['profile_image_url'],
        # tweet content
        text:     tw['retweeted_status']['text'],
        entities: tw['retweeted_status']['entities'].to_json,
        lang:     tw['retweeted_status']['lang']
      }
    else
      content = {
        text:     tw['text'],
        entities: tw['entities'].to_json,
        lang:     tw['lang']
      }
    end
    content[:id_str] = tw['id_str']
    content[:created_at] = tw['created_at']
    return Tweet.new(content)
  end

end
