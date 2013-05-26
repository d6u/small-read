class BackgroundOptController < ApplicationController
  # Filter
  before_filter :redirect_if_not_logged_in

  # refresh
  def refresh
    @user.twitters.each {|tw| tw.refresh_account}
    render :nothing => true
  end

  # load_folders_and_feeds
  def load_folders_and_feeds
    json = @user.folders.order("position DESC").inject([]) do |inject, folder|
      inject << folder
      inject + folder.feeds.order("unread_count DESC")
    end
    render json: json
  end

end
