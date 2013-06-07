module SettingsHelper

  def indicator_if(action)
    '<div class="settings-nav-active-indicator"></div>'.html_safe if params[:action] === action
  end

  def disabled_if_reserved(folder)
    'disabled'.html_safe if folder.reserved === true
  end

end
