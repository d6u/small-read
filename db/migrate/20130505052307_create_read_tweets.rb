class CreateReadTweets < ActiveRecord::Migration
  def change
    create_table :read_tweets do |t|
      t.string      :id_str
      # t.datetime    :created_at
      t.string      :retweeted_status_id_str
      t.string      :retweeted_status_user_id_str
      t.string      :retweeted_status_user_screen_name
      t.string      :retweeted_status_user_name
      t.string      :retweeted_status_user_profile_image_url

      # depend on retweeted_status
      t.text        :text
      t.text        :entities
      t.string      :lang

      # custom attributes
      t.boolean     :read, :default => true

      t.references  :feed
      t.timestamps
    end
    add_index :read_tweets, :read
    add_index :read_tweets, :feed_id
  end
end
