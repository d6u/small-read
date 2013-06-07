class ChangeFolderPosition < ActiveRecord::Migration
  def up
    Folder.update_all({:position => 0, :name => 'Favorite'}, "lower(name) LIKE 'favor%'")
    Folder.update_all({:position => 1, :name => 'General'}, "lower(name) = 'general'")
    Folder.update_all({:position => 2, :name => 'Muted'}, "lower(name) = 'muted'")
  end

  def down
    puts "--> There really is nothing we can do to change folder position back."
  end
end
