class CreateFutureUsers < ActiveRecord::Migration
  def change
    create_table :future_users do |t|
      t.string :email

      t.timestamps
    end

    add_index :future_users, :email
  end
end
