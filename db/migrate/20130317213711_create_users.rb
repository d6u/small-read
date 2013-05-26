class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.string :email
      t.string :hashed_pw, limit: 40
      t.string :salt, limit: 40
      t.string :name

      t.timestamps
    end
    add_index :users, :email
  end
end
