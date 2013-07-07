class AddFieldsToTweet < ActiveRecord::Migration
  def change
    add_column :tweets, :coordinates,    :text
    add_column :tweets, :place,          :text
    add_column :tweets, :retweet_count,  :integer, :default => 0
    add_column :tweets, :favorite_count, :integer, :default => 0
    add_column :tweets, :favorited,      :boolean, :default => false
    add_column :tweets, :retweeted,      :boolean, :default => false
    add_index  :tweets, [:feed_id, :id_str],       :unique => true


    add_column :read_tweets, :coordinates,    :text
    add_column :read_tweets, :place,          :text
    add_column :read_tweets, :retweet_count,  :integer, :default => 0
    add_column :read_tweets, :favorite_count, :integer, :default => 0
    add_column :read_tweets, :favorited,      :boolean, :default => false
    add_column :read_tweets, :retweeted,      :boolean, :default => false
    add_index  :read_tweets, [:feed_id, :id_str],       :unique => true
  end
end
