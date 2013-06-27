class OutsideController < ApplicationController
  # Filters
  # =======
  skip_before_filter :redirect_if_not_logged_in
  before_filter :redirect_if_logged_in, :except => [:contact, :agreement]

  layout "outside_layout"


  # Actions
  # =======
  # index
  # -----
  def index
    @user = User.new
    if params[:future_user] && params[:future_user][:email]
      @future_user = FutureUser.new(params[:future_user])
      if @future_user.save
        flash[:newsletter_form_success] = "Thank you for leaving your email, we will let you know as soon as possible."
        redirect_to "#newsletter_form"
      end
    else
      @future_user = FutureUser.new
    end
  end

  # register
  # --------
  def register
    if params[:user]
      @user = User.new(params[:user])
      if @user.save
        UserMailer.welcome_email(@user).deliver
        remember_user_login(:cookies => true)
        flash[:mixpanel_first_time] = "yes"
        redirect_to(controller: 'settings', action: 'manage_twitter_account')
      end
    else
      @user = User.new
    end
  end

  # login
  # -----
  def login
    if params[:user]
      user = User.authorize_user(params[:user][:email], params[:user][:password])
      unless user
        @user = User.new(params[:user])
        flash.now[:login_error] = "Email does not match password."
      else
        @user = user
        remember_user_login(:cookies => true) if params[:remember_login] === 'yes'
        redirect_to controller: 'inside', action: 'index'
      end
    else
      @user = User.new
    end
  end

  # forget_password
  # ---------------
  def forget_password
    if params[:forget_password_email]
      if user = User.find_by_email(params[:forget_password_email])
        user.send_reset_password_email
        flash[:forget_password_success] = 'Reset password email sent, please check your inbox.'
        redirect_to :action => 'forget_password'
      else
        flash.now[:forget_password_error] = 'Email does not exist.'
      end
    end
  end

  # reset_password
  # --------------
  def reset_password
    if @forget_password = ForgetPassword.find_by_verification_string(params[:verification_string])
      if 2.hours > Time.now - @forget_password.created_at
        @user = @forget_password.user
        @user.verification_string = params[:verification_string]
        if params[:user] && @user.update_attributes(params[:user])
          @forget_password.destroy
          flash[:reset_password_success] = "Password has reset, please login."
          redirect_to :action => 'login'
        end
      else
        # @forget_password.destroy
        flash.now[:reset_password_error] = "Verification code has expired, please request a now one."
      end
    else
      redirect_to :action => 'login'
    end
  end

  # twitter_login
  # -------------
  def twitter_login
    # TODO: if false logic
    response = Twitter.new.oauth_request_token(:oauth_callback => "#{request.protocol}#{request.host_with_port}/twitter_login_successful")
    if response && response['oauth_callback_confirmed'] == 'true'
      session[:twitter_request_token] = response['oauth_token']
      session[:twitter_request_secret] = response['oauth_token_secret']
      redirect_to "https://api.twitter.com/oauth/authenticate?oauth_token=#{response['oauth_token']}"
    else
      render :status => 500
    end
  end

  # twitter_login_successful
  # ------------------------
  def twitter_login_successful
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
        when !twitter = Twitter.find_by_user_id(response["user_id"])
          @user = User.new(:name => response['screen_name'])
          @user.twitters << Twitter.new(response)
          @user.save
          Resque.enqueue(FetchTweets, @user.id, false)
          remember_user_login(:cookies => true)
          flash[:mixpanel_first_time] = "yes"
          redirect_to controller: 'inside', action: 'welcome'
        # Re-login
        else
          @user = twitter.user
          remember_user_login(:cookies => true)
          redirect_to controller: 'inside', action: 'index'
        end
      end
    end
  end

  # contact
  # -------
  def contact
  end

  # agreement
  # ---------
  def agreement
  end

  # Private methods
  # ===============
  private
  # redirect_if_logged_in
  #
  # -----------------------
  def redirect_if_logged_in
    redirect_to(controller: 'inside', action: 'index') if session[:user_id]
  end

end
