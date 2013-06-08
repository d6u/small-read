class BackgroundOptController < ApplicationController
  # Filter
  # ======
  before_filter :redirect_if_not_logged_in


  # Actions
  # =======

  # refresh
  # -------
  def refresh
    @user.twitters.each {|tw| tw.refresh_account}
    render :nothing => true
  end

  # load_folders_and_feeds
  # ----------------------
  def load_folders_and_feeds
    json = @user.folders.order("position DESC").inject([]) do |inject, folder|
      inject << folder
      inject + folder.feeds.order("unread_count DESC")
    end
    render json: json
  end

  # feedback
  # --------
  def feedback
    redirect_to :action => 'index' unless params[:subject] && params[:content] && params[:page_name]
    Resque.enqueue(SendFeedback, {
      :page_name           => params[:page_name],
      :feedback_user_id    => params[:feedback_user_id],
      :feedback_user_email => params[:feedback_user_email],
      :subject             => params[:subject],
      :content             => params[:content]
    })
  end

  # twitter_api_counts
  # ------------------
  def twitter_api_counts
    rate_limit_status = @user.twitters[0].rate_limit_status(:resources => 'statuses')
    render :json => {:limits => rate_limit_status['resources']['statuses']['/statuses/home_timeline']['remaining']}
  end

  # welmark_all_readcome
  # --------------------
  def mark_all_read
    if params[:feed_id]
      feed = Feed.find_by_id params[:feed_id]
      feed.tweets.update_all(:read => true)
      feed.update_attributes(:unread_count => 0)
      feed.folder.count_unread
    elsif params[:folder_id]
      folder = Folder.find_by_id params[:folder_id]
      folder.feeds.each do |f|
        f.tweets.update_all(:read => true)
        f.update_attributes(:unread_count => 0)
      end
      folder.count_unread
    end
    head :no_content
  end

  # update_folder_positions
  # -----------------------
  def update_folder_positions
    if params[:id_str] && params[:position_str]
      id_strs = params[:id_str].split(',')
      position_strs = params[:position_str].split(',')
      id_strs.each_with_index do |ele, index|
        Folder.find(ele).update_attribute(:position, position_strs[index])
      end
    end
    head :no_content
  end

  # manage_feeds
  # ------------
  def manage_feeds
    if params[:source_folder_id] && params[:dest_folder_id] && params[:feed_id]
      @feed = @user.twitters.first.feeds.find(params[:feed_id])
      previous_folder = @feed.folder
      if @feed.update_attributes(:folder_id => params[:dest_folder_id])
        previous_folder.count_unread
        @feed.folder.count_unread
        head :no_content
      else
        render json: @feed.errors, status: :unprocessable_entity
      end
    else
      head :no_content
    end
  end

# End of BackgroundOptController
end
