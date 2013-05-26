require 'test_helper'

class BackgroundOptControllerTest < ActionController::TestCase
  test "should get first_time" do
    get :first_time
    assert_response :success
  end

  test "should get refresh" do
    get :refresh
    assert_response :success
  end

end
