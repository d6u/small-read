require 'test_helper'

class InsideControllerTest < ActionController::TestCase
  test "should get index" do
    get :index
    assert_response :success
  end

  test "should get setting" do
    get :setting
    assert_response :success
  end

  test "should get logout" do
    get :logout
    assert_response :success
  end

end
