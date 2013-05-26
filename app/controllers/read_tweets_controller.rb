class ReadTweetsController < ApplicationController
  # Filters
  before_filter :redirect_if_logged_in, :except => [:contact, :agreement]
end
