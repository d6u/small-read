module SettingsHelper

  def indicator_if(action)
    '<div class="settings-nav-active-indicator"></div>'.html_safe if params[:action] === action
  end

end
