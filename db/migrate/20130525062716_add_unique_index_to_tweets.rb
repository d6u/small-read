class AddUniqueIndexToTweets < ActiveRecord::Migration
  def change
    add_index :tweets, [:feed_id, :id_str], :unique => true
  end
end
