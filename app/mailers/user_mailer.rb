class UserMailer < ActionMailer::Base
  default from: "nonreply@getsmallread.com"

  # UserMailer.welcome_email(u).deliver
  def welcome_email(user)
    @user      = user
    @user_name = user.name || 'friend'
    @url       = "http://www.getsmallread.com/"
    @login_url = "http://www.getsmallread.com/login"
    mail(:to => @user.email, :subject => "Welcome to Small Read!")
  end

  def forget_password_email(user, verification_string)
    @user = user
    @reset_password_url = "http://www.getsmallread.com/reset_password/#{verification_string}"
    mail(:to => @user.email, :subject => "Reset password request.")
  end

end
