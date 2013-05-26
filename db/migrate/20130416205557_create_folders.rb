class CreateFolders < ActiveRecord::Migration
  def change
    create_table :folders do |t|
      t.string     :name,                        null: false
      t.string     :color,    default: "ECF0F1"
      t.integer    :position,                    null: false
      t.integer    :unread_count

      t.references :user
      t.timestamps
    end
    add_index :folders, :user_id
  end
end
