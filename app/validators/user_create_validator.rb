class UserCreateValidator < ActiveModel::Validator

  EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i

  def validate(user)
    # register
    if user.email || user.password || user.password_confirmation
      # email
      if EMAIL_REGEX !~ user.email
        user.errors[:email] << 'This is not a valid email.'
      elsif User.find_by_email(user.email)
        user.errors[:email] << 'Email has been used.'
      end
      # password
      if !user.password || !(user.password.length >= 6 && user.password.length <= 40)
        user.errors[:password] << 'Password has to be between 6 and 50 letters.'
      end
      # password_confirmation
      if user.password != user.password_confirmation
        user.errors[:password_confirmation] << 'Password does not match.'
      end
    # twitter login
    elsif user.twitters.empty?
      user.errors[:base] << 'User does not have a twitter or email.'
    end
  end

end
