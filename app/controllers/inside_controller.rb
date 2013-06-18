class InsideController < ApplicationController
  # Filters
  # =======
  before_filter :redirect_if_mobile

  layout "inside_layout"


  # Actions
  # =======
  # index
  # =====
  def index
  end

  # ========================= logout ==========================================
  def logout
    if params[:confirmation] == 'yes'
      forget_user
      redirect_to({controller: 'outside', action: 'index'})
    else
      redirect_to({controller: 'inside', action: 'index'})
    end
  end

  # ========================= welcome =========================================
  def welcome
    redirect_to action: 'index' if @user.email
    if params[:user]
      if @user.update_attributes(params[:user])
        UserMailer.welcome_email(@user).deliver
        remember_user_login(:cookies => true)
        redirect_to action: 'index'
      end
    end
  end

  # Filters & Private
  private

end
