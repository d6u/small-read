require 'securerandom'
require 'digest/sha1'

class User < ActiveRecord::Base
  # Relationships
  has_many :remember_logins
  has_many :forget_passwords
  has_many :twitters, foreign_key: "local_user_id"
  has_many :folders

  # Atrributes
  attr_accessor   :password, :password_confirmation, :current_password,
                  :verification_string
  attr_reader     :email_already_set, :password_already_set
  attr_accessible :password, :password_confirmation, :current_password,
                  :email, :name, :verification_string

  # Validations
  validates_with UserCreateValidator, :on => :create
  validates_with UserUpdateValidator, :on => :update

  # Callbacks
  before_create :create_salt_and_hashed_pw_if_not_twitter_login
  before_create :create_default_folders
  after_find    :determine_account_settings
  before_update :create_salt_and_hashed_pw_if_change_password
  after_save    :determine_account_settings

  # Methods
  # self.authorize_user(email, password)
  def self.authorize_user(email, password)
    user = User.find_by_email(email)
    return false if !user || !user.password_match?(password)
    return user
  end

  # password_match?(entered_password)
  def password_match?(entered_password=@current_password)
    self.hashed_pw == generate_hashed_pw(entered_password)
  end

  # generate_forget_password_email
  def send_reset_password_email
    if !self.new_record?
      forget_password = ForgetPassword.new
      self.forget_passwords << forget_password
      UserMailer.forget_password_email(self, forget_password.verification_string).deliver
    end
  end

  # Callback functions
  private
  def create_salt_and_hashed_pw_if_not_twitter_login
    create_salt_and_hashed_pw if self.email || self.password || self.password_confirmation
  end

  def generate_salt
    Digest::SHA1.hexdigest("Use #{self.email} with #{Time.now} to make salt")
  end

  def generate_hashed_pw(entered_password=@password)
    Digest::SHA1.hexdigest("Put #{self.salt} on the #{entered_password}")
  end

  def create_default_folders
    self.folders << [
      Folder.new(name: "favorate", position:  1),
      Folder.new(name: "general",  position:  0),
      Folder.new(name: "muted",    position: -1, :reserved => true)
    ]
  end

  def determine_account_settings
    @email_already_set = (self.email && !self.email.empty?) ? true : false
    @password_already_set = (self.hashed_pw && !self.hashed_pw.empty?) ? true : false
  end

  def create_salt_and_hashed_pw_if_change_password
    create_salt_and_hashed_pw if self.password || self.password_confirmation
  end

  def create_salt_and_hashed_pw
    self.salt = generate_salt
    self.hashed_pw = generate_hashed_pw
  end

end
