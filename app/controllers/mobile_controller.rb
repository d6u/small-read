class MobileController < ApplicationController

  # Filter
  # ======
  before_filter :redirect_if_not_logged_in
  layout "mobile_layout"

  # Actions
  # =======
  # index
  # -----
  def index
  end

  # folders_and_feeds
  # -----------------
  def folders_and_feeds
    render :layout => false
  end

  # tweets_content
  # --------------
  def tweets_content
    render :layout => false
  end

  # settings
  # --------
  def settings
  end

end
