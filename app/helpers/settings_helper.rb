module SettingsHelper

  def indicator_if(action)
    ' active'.html_safe if params[:action] === action
  end

  def disabled_if_reserved(folder)
    'disabled'.html_safe if folder.reserved === true
  end

end
