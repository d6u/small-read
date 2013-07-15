class AddTopTweetsToFeeds < ActiveRecord::Migration

  def up
    add_column :feeds,  :top_tweets,      :string

    add_column :tweets, :score,           :integer, :default => 0
    add_column :tweets, :with_image,      :boolean, :default => false
    add_column :tweets, :with_url,        :boolean, :default => false
    add_column :tweets, :with_coordinate, :boolean, :default => false
    add_column :tweets, :with_mention,    :boolean, :default => false
    add_column :tweets, :with_hashtag,    :boolean, :default => false

    add_column :read_tweets, :score,           :integer, :default => 0
    add_column :read_tweets, :with_image,      :boolean, :default => false
    add_column :read_tweets, :with_url,        :boolean, :default => false
    add_column :read_tweets, :with_coordinate, :boolean, :default => false
    add_column :read_tweets, :with_mention,    :boolean, :default => false
    add_column :read_tweets, :with_hashtag,    :boolean, :default => false
  end


  def down
    remove_column :feeds,  :top_tweets
    remove_columns :tweets, :score,
                            :with_image,
                            :with_url,
                            :with_coordinate,
                            :with_mention,
                            :with_hashtag
    remove_columns :read_tweets, :score,
                                 :with_image,
                                 :with_url,
                                 :with_coordinate,
                                 :with_mention,
                                 :with_hashtag
  end

end
