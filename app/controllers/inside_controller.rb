class InsideController < ApplicationController
  # Filter
  before_filter :redirect_if_not_logged_in
  before_filter :redirect_to_welcome_if_no_email, except: [:welcome, :logout]
  layout "inside_layout"

  # Actions
  # ========================= index ===========================================
  def index
  end

  # feedback
  # ========
  def feedback
    redirect_to :action => 'index' unless params[:subject] && params[:content] && params[:page_name]
    Resque.enqueue(SendFeedback, params[:page_name], params[:subject], params[:content])
  end

  # ========================= logout ==========================================
  def logout
    if params[:confirmation] == 'yes'
      forget_user
      redirect_to({controller: 'outside', action: 'index'})
    else
      redirect_to({controller: 'inside', action: 'index'})
    end
  end

  # ========================= welcome =========================================
  def welcome
    redirect_to action: 'index' if @user.email
    if params[:user]
      if @user.update_attributes(params[:user])
        UserMailer.welcome_email(@user).deliver
        remember_user_login(:cookies => true)
        redirect_to action: 'index'
      end
    end
  end

  # ========================= welmark_all_readcome ============================
  def mark_all_read
    tweets_ids = params[:ids].split(/,/)
    tweets = Tweet.find(tweets_ids)
    updated_feeds = []
    tweets.each do |t|
      t.update_attributes(:read => true)
      updated_feeds << t.feed unless updated_feeds.include? t.feed
    end
    updated_feeds.each {|fd| fd.count_unread }
    head :no_content
  end

  # Filters & Private
  private

end
