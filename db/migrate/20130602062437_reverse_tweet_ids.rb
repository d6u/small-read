class TempTweet < ActiveRecord::Base
  attr_accessible :id_str,
                  :retweeted_status_id_str,
                  :retweeted_status_user_id_str,
                  :retweeted_status_user_screen_name,
                  :retweeted_status_user_name,
                  :retweeted_status_user_profile_image_url,
                  :text, :entities, :lang, :read, :feed_id,
                  :created_at, :updated_at
end


class Tweet < ActiveRecord::Base
  attr_accessible :id_str,
                  :retweeted_status_id_str,
                  :retweeted_status_user_id_str,
                  :retweeted_status_user_screen_name,
                  :retweeted_status_user_name,
                  :retweeted_status_user_profile_image_url,
                  :text, :entities, :lang, :read, :feed_id,
                  :created_at, :updated_at
end


class ReverseTweetIds < ActiveRecord::Migration
  def up
    remove_index :tweets, :read
    remove_index :tweets, :feed_id
    rename_table :tweets, :temp_tweets

    create_table :tweets do |t|
      t.string      :id_str
      t.string      :retweeted_status_id_str
      t.string      :retweeted_status_user_id_str
      t.string      :retweeted_status_user_screen_name
      t.string      :retweeted_status_user_name
      t.string      :retweeted_status_user_profile_image_url
      t.text        :text
      t.text        :entities
      t.string      :lang
      t.boolean     :read, :default => false
      t.references  :feed
      t.timestamps
    end
    add_index :tweets, :read
    add_index :tweets, :feed_id

    tweets = TempTweet.select([
      :id_str,
      :retweeted_status_id_str,
      :retweeted_status_user_id_str,
      :retweeted_status_user_screen_name,
      :retweeted_status_user_name,
      :retweeted_status_user_profile_image_url,
      :text, :entities, :lang, :read, :feed_id,
      :created_at, :updated_at]).order('id_str ASC, id ASC')
    tweets.each do |tweet|
      t = Tweet.new(MultiJson.load tweet.to_json)
      t.read = false if t.read == nil
      t.save
    end

    drop_table :temp_tweets
  end


  def down
  end
end
