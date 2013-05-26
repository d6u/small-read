class CreateTwitters < ActiveRecord::Migration
  def change
    create_table :twitters do |t|
      t.string     :user_id            # => twitter account id
      t.string     :oauth_token
      t.string     :oauth_token_secret
      t.string     :screen_name
      t.string     :newest_tweet_id

      t.references :local_user # => local_user_id: User
      t.timestamps
    end
    add_index :twitters, :user_id
    add_index :twitters, :local_user_id
  end
end
