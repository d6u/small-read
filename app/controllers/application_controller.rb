class ApplicationController < ActionController::Base

  protect_from_forgery
  before_filter :check_cookies_and_session

  protected
  # remember_user_login
  def remember_user_login(args={}, user=@user)
    # cookies
    if args[:cookies]
      remember_login = RememberLogin.new
      user.remember_logins << remember_login
      cookies.signed[:code] = {value: remember_login.matching_code, expires: 1.month.from_now}
      cookies.signed[:user_id] = {value: user.id, expires: 1.month.from_now}
    end
    # session
    session[:user_id] = user.id
  end

  def check_cookies_and_session
    # Integrity test
    unless session[:user_id] && @user = User.find_by_id(session[:user_id])
      session[:user_id], session[:user_name] = nil, nil
    end

    if ( cookies.signed[:user_id] && !cookies.signed[:code] ) || ( !cookies.signed[:user_id] && cookies.signed[:code] )
      cookies.delete(:user_id)
      cookies.delete(:code)
    end

    # Relationship between session and cookies test
    if session[:user_id] && session[:user_id] != cookies.signed[:user_id].to_i
      cookies.delete(:user_id)
      cookies.delete(:code)
    end

    # Issue session if cookies valid
    if !session[:user_id] && cookies.signed[:user_id]
      rm = RememberLogin.find_by_matching_code(cookies.signed[:code])
      if rm && rm.user.id == cookies.signed[:user_id].to_i
        @user = rm.user
        session[:user_id] = @user.id

        rm.destroy
        cookies.delete(:user_id)
        cookies.delete(:code)

        rm = RememberLogin.new
        @user.remember_logins << rm
        cookies.signed[:user_id] = @user.id
        cookies.signed[:code] = rm.matching_code
      else
        cookies.delete(:user_id)
        cookies.delete(:code)
      end
    end
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

end
