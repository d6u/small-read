class ApplicationController < ActionController::Base
  # Filters
  # =======
  protect_from_forgery
  before_filter :redirect_if_not_getsmallread if Rails.env.production?
  before_filter :validate_cookies_and_session

  # Private Filters
  # ===============
  private
  ##
  # redirect_if_not_getsmallread
  #
  # avoid small-read.herokuapp.com domain
  # ------------------------------
  def redirect_if_not_getsmallread
    redirect_to 'http://www.getsmallread.com' if request.domain != "getsmallread.com"
  end

  ##
  # validate_cookies_and_session
  #
  # session        => :user_id
  # cookies.signed => :user_token
  # ------------------------------
  def validate_cookies_and_session
    # user_id and user_token must match
    if session[:user_id] && cookies.signed[:user_token]
      if @user = User.find_by_id(session[:user_id]) &&
        rm= RememberLogin.find_by_matching_code(cookies.signed[:user_token]) &&
        @user === rm.user
        # PERFERCT EVERYTHING IS GOOD
      elsif @user != rm.user
        session[:user_id] = nil
        cookies.delete :user_token
        @user.remember_logins.destroy_all
        rm.user.remember_logins.destroy_all
        @user = nil
        rm = nil
      elsif @user && !rm
        session[:user_id] = nil
        cookies.delete :user_token
        @user.remember_logins.destroy_all
        @user = nil
      elsif rm=RememberLogin.find_by_matching_code(cookies.signed[:user_token])
        session[:user_id] = nil
        cookies.delete :user_token
        rm.user.remember_logins.destroy_all
        rm = nil
      end
    # validate user_token
    elsif cookies.signed[:user_token]
      unless rm = RememberLogin.find_by_matching_code(cookies.signed[:user_token])
        cookies.delete :user_token
      else
        @user = rm.user
        session[:user_id] = @user.id
      end
    # validate user_id
    elsif session[:user_id]
      session[:user_id] = nil unless @user = User.find_by_id(session[:user_id])
    end
  end

  # Protected methods
  # =================
  protected
  ##
  # remember_user_login
  #
  # ------------------------------------------
  def remember_user_login(args={})
    # cookies
    if args[:cookies] === true
      rm = RememberLogin.new
      @user.remember_logins << rm
      cookies.signed[:user_token] = {
        :value   => rm.matching_code,
        :domain  => '.' + request.domain,
        :expires => 1.month.from_now
      }
    end
    # session
    session[:user_id] = @user.id
  end

  # Used after signed in
  def redirect_if_not_logged_in
    redirect_to controller: 'outside', action: 'index' unless session[:user_id]
  end

  def redirect_to_welcome_if_no_email
    redirect_to controller: 'inside', action: 'welcome' unless @user.email
  end

  def forget_user(args={}, user=@user)
    session[:user_id] = nil
    if cookies.signed[:code]
      RememberLogin.delete_all(:matching_code => cookies.signed[:code])
      cookies.delete(:user_id)
      cookies.delete(:code)
    end
    if args[:all]
      user.remember_logins.each {|r| r.delete}
    end
  end

  # redirect_if_mobile
  # ------------------
  def redirect_if_mobile
    if cookies[:force_desktop] != 'true' && /iPhone/.match(request.env['HTTP_USER_AGENT'])
      redirect_to :controller => "mobile", :action => "index"
    end
  end

end
