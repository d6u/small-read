class FutureUser < ActiveRecord::Base
  attr_accessible :email

  EMAIL_REGEX = /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/
  validates :email, :format => { :with => EMAIL_REGEX, :message => "Email is not valid." }
end
