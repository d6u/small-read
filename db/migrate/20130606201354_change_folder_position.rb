class ChangeFolderPosition < ActiveRecord::Migration
  def up
    Folder.update_all({:position => 0, :name => 'Favorite'}, "name LIKE lower('favor%')")
    Folder.update_all({:position => 1, :name => 'General'}, "name = lower('general')")
    Folder.update_all({:position => 2, :name => 'Muted'}, "name = lower('muted')")
  end

  def down
    puts "--> There really is nothing we can do to change folder position back."
  end
end
