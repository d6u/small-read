source 'https://rubygems.org'

ruby '2.0.0'

# Core
gem 'rails', '3.2.13'
gem 'pg'
gem 'unicorn'
gem 'asset_sync'
gem 'oauth_twitter'
# gem 'oauth_twitter', :path => '../oauth_twitter'
gem "resque", "~> 1.24.1"
gem 'resque-scheduler', :require => 'resque_scheduler'


# Core plugin
gem 'oj', '~> 2.0'
gem 'jbuilder'
gem 'gravatar-ultimate'


group :development do
  gem 'better_errors'
  gem 'binding_of_caller'
  gem 'awesome_print'
end


group :test do
  gem 'system-metrics'
end


group :production do
  # Monitor
  gem 'garelic'
  gem 'newrelic_rpm'
end


group :assets do
  gem 'sass-rails', '~> 3.2'
  gem 'jquery-rails'
  gem 'uglifier', '>= 1.0.3'
end

# Deploy with Capistrano
# gem 'capistrano'

# To use debugger
# gem 'debugger'
