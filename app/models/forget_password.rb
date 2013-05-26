require 'securerandom'

class ForgetPassword < ActiveRecord::Base

  belongs_to :user

  before_create :generate_verification_string

  private
  def generate_verification_string
    self.verification_string = SecureRandom.hex
  end

end
