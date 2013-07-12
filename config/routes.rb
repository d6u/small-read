SmallRead::Application.routes.draw do

  # => Outside
  root  :to                                   => 'outside#index'
  match 'twitter_login'                       => 'outside#twitter_login'
  match 'twitter_login_successful'            => 'outside#twitter_login_successful'
  match 'login'                               => 'outside#login'
  match 'forget_password'                     => 'outside#forget_password'
  match 'reset_password/:verification_string' => 'outside#reset_password'
  match 'register'                            => 'outside#register'
  match 'contact'                             => 'outside#contact'

  # => Inside
  match 'home'    => 'inside#index'
  match 'logout'  => 'inside#logout'
  match 'welcome' => 'inside#welcome'

  # => Settings
  match 'settings'               => 'settings#settings'
  match 'manage_folders'         => 'settings#manage_folders'
  get   'manage_feeds'           => 'settings#manage_feeds'
  match 'manage_twitter_account' => 'settings#manage_twitter_account'
  match 'add_twitter'            => 'settings#add_twitter'
  match 'manage_email'           => 'settings#manage_email'
  match 'manage_password'        => 'settings#manage_password'

  # => Mobile
  get "mobile/index"
  get "mobile/folders_and_feeds"
  get "mobile/tweets_content"
  get "mobile/settings"

  # => Background
  match 'bg/refresh'                  => 'background_opt#refresh'
  match 'bg/load_folders_and_feeds'   => 'background_opt#load_folders_and_feeds'
  post  'bg/feedback'                 => 'background_opt#feedback'
  get   'bg/twitter_api_counts'       => 'background_opt#twitter_api_counts'
  post  'mark_all_read'               => 'background_opt#mark_all_read'
  post  '/bg/update_folder_positions' => 'background_opt#update_folder_positions'
  post  '/bg/manage_feeds'             => 'background_opt#manage_feeds'

  # => Resources
  get  '/tweets/:id/mark_read'  => 'tweets#mark_read'
  get  '/feeds_with_top_tweets' => 'feeds#feeds_with_top_tweets'
  resources :tweets

  resources :folders do
    resources :feeds
    resources :tweets
    resources :read_tweets
  end

  resources :feeds do
    resources :tweets
    resources :read_tweets
  end

  # Adminstrative Plugins
  mount Resque::Server, :at => "/resque"


  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', :on => :collection
  #     end
  #   end

end
