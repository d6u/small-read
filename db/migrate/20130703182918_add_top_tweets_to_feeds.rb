class AddTopTweetsToFeeds < ActiveRecord::Migration

  def up
    add_column :feeds,  :top_tweets, :string
    add_column :tweets, :score,      :integer, :default => 0

    puts "--> Updating score of tweets"
    Twitter.pluck('id').each {|id|Twitter.analyze_timeline(id, {:all => true})}
  end


  def down
    remove_column :feeds,  :top_tweets
    remove_column :tweets, :score
  end

end
