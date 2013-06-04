class SettingsController < ApplicationController
  # Filter
  before_filter :redirect_if_not_logged_in
  before_filter :redirect_to_welcome_if_no_email
  layout "settings_layout"

  # Actions
  # ========================= settings ========================================
  def settings
    if params[:user]
      redirect_to action: 'settings' if @user.update_attributes(params[:user])
    end
  end

  # ========================= manage_folders ==================================
  def manage_folders
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
      @folders = @user.folders.order('position DESC')
    end
  end

  # ========================= manage_twitter_account ==========================
  def manage_twitter_account
    # delete twitter
    if params[:delete_twitter] && params[:delete_twitter] == 'true' && params[:twitter_id]
      if twitter = Twitter.find_by_id(params[:twitter_id])
        @status_message = "Twitter account @#{twitter.screen_name} deleted."
        twitter.destroy
      else
        render :status => 404
      end
    # add twitter
    elsif params[:link_twitter] && params[:link_twitter] == 'true'
      response = Twitter.new.oauth_request_token(:oauth_callback => "#{request.protocol}#{request.host_with_port}/add_twitter")
      if response && response['oauth_callback_confirmed'] == 'true'
        session[:twitter_request_token] = response['oauth_token']
        session[:twitter_request_secret] = response['oauth_token_secret']
        redirect_to "https://api.twitter.com/oauth/authenticate?oauth_token=#{response['oauth_token']}&force_login=true"
      else
        render :status => 500
      end
    end
  end

  # add_twitter
  # ===========
  def add_twitter
    if params[:oauth_token] && params[:oauth_verifier]
      if params[:oauth_token] == session[:twitter_request_token]
        twitter_account = Twitter.new(
          :oauth_token        => params[:oauth_token],
          :oauth_token_secret => session[:twitter_request_secret]
        )
        response = twitter_account.oauth_access_token(:oauth_verifier => params[:oauth_verifier])
        case
        # Login failed
        when !response
          # TODO: response false
          render status: 500
        # First time login
        when !Twitter.find_by_user_id(response["user_id"])
          @user.twitters << Twitter.new(response)
          # Resque.enqueue(FetchTweets, @user.id, false)
          redirect_to controller: 'settings', action: 'manage_twitter_account'
        # Re-login
        else
          flash[:add_twitter_error] = 'This Twitter account has already been linked.'
          redirect_to controller: 'settings', action: 'manage_twitter_account'
        end
      end
    else
      render :file => "#{Rails.root}/public/404", :layout => false, :status => 404
    end
  end

  # ========================= manage_email ====================================
  def manage_email
    if params[:user]
      redirect_to action: 'manage_email' if @user.update_attributes(params[:user])
    end
  end

  # ========================= manage_password =================================
  def manage_password
    if params[:user]
      if @user.update_attributes(params[:user])
        forget_user(:all => true)
        remember_user_login(:cookies => true)
        redirect_to action: 'manage_password'
      end
    end
  end

end
