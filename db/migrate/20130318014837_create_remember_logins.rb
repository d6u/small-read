class CreateRememberLogins < ActiveRecord::Migration
  def change
    create_table :remember_logins do |t|
      t.string 	   :matching_code
      t.references :user
      t.timestamps
    end
    add_index :remember_logins, :user_id
    add_index :remember_logins, :matching_code
  end
end
