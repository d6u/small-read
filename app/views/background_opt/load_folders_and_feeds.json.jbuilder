json.array! @user.folders.order('position ASC') do |folder|
  json.(folder, :id, :name, :color, :position, :reserved, :unread_count)
  json.feeds folder.feeds.order('unread_count DESC') do |feed|
    json.(feed, :id, :name, :profile_image_url, :screen_name, :unread_count)
  end
end
