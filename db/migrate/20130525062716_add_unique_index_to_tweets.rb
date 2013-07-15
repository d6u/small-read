class AddUniqueIndexToTweets < ActiveRecord::Migration

  def up
    add_index :tweets, [:feed_id, :id_str], :unique => true
  end


  def down

  end

end
