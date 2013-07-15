class InsideController < ApplicationController
  # Filters
  # =======
  # before_filter :redirect_if_mobile

  layout "inside_layout"


  # Actions
  # =======
  # index
  # -----
  def index
    @folders = @user.folders.order('position ASC')
  end

  # logout
  # ------
  def logout
    if params[:confirmation] == 'yes'
      forget_user
      redirect_to({:controller => 'outside', :action => 'index'})
    else
      redirect_to({:controller => 'inside', :action => 'index'})
    end
  end

  # Filters & Private
  # =================
  private

end
