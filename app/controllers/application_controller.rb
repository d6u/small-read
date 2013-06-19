class ApplicationController < ActionController::Base
  # Filters
  # =======
  protect_from_forgery

  before_filter :redirect_if_not_getsmallread if Rails.env.production?
  before_filter :validate_cookies_and_session
  before_filter :redirect_if_not_logged_in


  # Private Filters
  # ===============
  private
  ##
  # redirect_if_not_getsmallread
  #
  # avoid small-read.herokuapp.com domain
  # ------------------------------
  def redirect_if_not_getsmallread
    redirect_to 'http://www.getsmallread.com' if request.domain != "getsmallread.com"
  end

  ##
  # validate_cookies_and_session
  #
  # session        => :user_id
  # cookies.signed => :user_token
  # ------------------------------
  def validate_cookies_and_session
    # user_id and user_token must match
    if session[:user_id] && cookies.signed[:user_token]
      @user = User.find_by_id(session[:user_id])
      rm = RememberLogin.find_by_matching_code(cookies.signed[:user_token])
      unless @user && rm && @user === rm.user
        session[:user_id] = nil
        cookies.delete :user_token
        if @user
          @user.remember_logins.destroy_all
          @user = nil
        end
        if rm
          rm.user.remember_logins.destroy_all
          rm = nil
        end
      end
    # validate user_token
    elsif cookies.signed[:user_token]
      unless rm = RememberLogin.find_by_matching_code(cookies.signed[:user_token])
        cookies.delete :user_token
      else
        @user = rm.user
        session[:user_id] = @user.id
      end
    # validate user_id
    elsif session[:user_id]
      session[:user_id] = nil unless @user = User.find_by_id(session[:user_id])
    end
  end

  # redirect_if_not_logged_in
  #
  # ---------------------------
  def redirect_if_not_logged_in
    redirect_to controller: 'outside', action: 'index' unless session[:user_id]
  end


  # Protected methods
  # =================
  protected
  ##
  # remember_user_login
  #
  # ------------------------------------------
  def remember_user_login(args={})
    # cookies
    if args[:cookies] === true
      rm = RememberLogin.new
      @user.remember_logins << rm
      cookies.signed[:user_token] = {
        :value   => rm.matching_code,
        :domain  => '.' + request.domain,
        :expires => 1.month.from_now
      }
    end
    # session
    session[:user_id] = @user.id
  end

  # TODO: remove
  def redirect_to_welcome_if_no_email
    redirect_to controller: 'inside', action: 'welcome' unless @user.email
  end

  # TODO: refactor
  # forget_user
  #
  # ----------------------------------
  def forget_user(args={})
    session[:user_id] = nil
    if cookies.signed[:user_token]
      RememberLogin.delete_all(:matching_code => cookies.signed[:user_token])
      cookies.delete(:user_token)
    end
    if args[:all] === true
      @user.remember_logins.destroy_all
    end
  end

  # redirect_if_mobile
  #
  # ------------------
  def redirect_if_mobile
    if cookies[:force_desktop] != 'true'
      redirect_to :controller => "mobile", :action => "index" if /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.match(request.user_agent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.match(request.user_agent[0..3])
    end
  end

end
