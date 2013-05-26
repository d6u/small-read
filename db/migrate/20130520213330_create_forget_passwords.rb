class CreateForgetPasswords < ActiveRecord::Migration
  def change
    create_table :forget_passwords do |t|
      t.string :verification_string

      t.references :user
      t.timestamps
    end

    add_index :forget_passwords, :user_id
    add_index :forget_passwords, :verification_string
  end
end
