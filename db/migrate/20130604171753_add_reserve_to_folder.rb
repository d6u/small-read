class AddReserveToFolder < ActiveRecord::Migration
  def up
    add_column :folders, :reserved, :boolean, :default => false
    Folder.update_all({:reserved => true}, "lower(name) = 'general'")
    Folder.update_all({:reserved => true}, "lower(name) = 'muted'")
  end

  def down
    remove_column :folders, :reserved
  end
end
