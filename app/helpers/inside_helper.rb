module InsideHelper

  def navbar_yield_active(action, controller=nil)
    if action == params[:action] && (controller == nil || controller == params[:controller])
      'active'
    end
  end
  
end
