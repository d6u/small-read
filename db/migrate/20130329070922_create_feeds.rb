class CreateFeeds < ActiveRecord::Migration
  def change
    create_table :feeds do |t|
      t.string     :id_str
      t.string     :screen_name
      t.string     :name
      t.text       :profile_image_url
      t.integer    :order_in_folder
      t.integer    :unread_count

      t.references :folder
      t.references :twitter
      t.timestamps
    end
    add_index :feeds, :folder_id
    add_index :feeds, :twitter_id
  end
end
