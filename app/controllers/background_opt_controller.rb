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

  # feedback
  # ========
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
  # ==================
  def twitter_api_counts
    rate_limit_status = @user.twitters[0].rate_limit_status(:resources => 'statuses')
    render :json => {:limits => rate_limit_status['resources']['statuses']['/statuses/home_timeline']['remaining']}
  end

end
