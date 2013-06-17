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

  # settings
  # --------
  def settings
  end

end
