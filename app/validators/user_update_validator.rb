class UserUpdateValidator < ActiveModel::Validator

  EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i

  def validate(user)
    # email
    if user.email
      # fill email
      if !user.email_already_set
        if EMAIL_REGEX !~ user.email
          user.errors[:email] << 'This is not a valid email.'
        elsif User.find_by_email(user.email)
          user.errors[:email] << 'Email has been used.'
        end
      # update email
      else
        if user.email != User.find(user.id).email
          if !user.password_match?
            user.errors[:current_password] << 'Current password does not match.'
          end
          if EMAIL_REGEX !~ user.email
            user.errors[:email] << 'This is not a valid email.'
          elsif User.find_by_email(user.email)
            user.errors[:email] << 'Email has been used.'
          end
        end
      end
    end

    # password
    if !user.verification_string && (user.password || user.password_confirmation)
      # fill password
      if !user.password_already_set
        if !user.password || !(user.password.length >= 6 && user.password.length <= 40)
          user.errors[:password] << 'Password has to be between 6 and 50 letters.'
        end
        if user.password != user.password_confirmation
          user.errors[:password_confirmation] << 'Password does not match.'
        end
      # update password
      else
        if !user.password_match?
          user.errors[:current_password] << 'Current password does not match.'
        end
        if !user.password || !(user.password.length >= 6 && user.password.length <= 40)
          user.errors[:password] << 'Password has to be between 6 and 50 letters.'
        end
        if user.password != user.password_confirmation
          user.errors[:password_confirmation] << 'Password confirmation does not match.'
        end
      end
    end

    # Reset Password
    if user.verification_string
      if forget_password = user.forget_passwords.find_by_verification_string(user.verification_string)
        if !user.password || !(user.password.length >= 6 && user.password.length <= 40)
          user.errors[:password] << 'Password has to be between 6 and 50 letters.'
        end
        if user.password != user.password_confirmation
          user.errors[:password_confirmation] << 'Password does not match.'
        end
      else
        user.errors[:verification_string] << 'Reset request cannot be verified.'
      end
    end

  end

end