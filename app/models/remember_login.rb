require 'securerandom'

class RememberLogin < ActiveRecord::Base
  # Relationships
  belongs_to :user

  # Atrributes
  # Validations
  # Methods
  # => class methods
  # => instance methods

  # Callbacks
  before_create :generate_codes

  private
  def generate_codes
    self.matching_code = SecureRandom.hex
  end
end
