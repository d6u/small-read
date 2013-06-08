source 'https://rubygems.org'


# Core
gem 'rails', '3.2.13'
gem 'pg'
gem 'thin'
gem 'asset_sync'
# gem 'clockwork'
gem 'oauth_twitter'
# gem 'oauth_twitter', :path => '../oauth_twitter'
gem "resque", "~> 1.24.1"
gem 'resque-scheduler', :require => 'resque_scheduler'


# Core plugin
gem 'oj', '~> 2.0'
gem 'gravatar-ultimate'
gem 'newrelic_rpm'


group :development do
  gem 'better_errors'
  gem 'binding_of_caller'
  gem 'awesome_print'
  gem 'system-metrics'
end


group :production do
  # Monitor
  gem 'garelic'
end


group :assets do
  gem 'sass-rails', '~> 3.2'
  gem 'jquery-rails'
  gem 'uglifier', '>= 1.0.3'
end

# To use Jbuilder templates for JSON
# gem 'jbuilder'

# Deploy with Capistrano
# gem 'capistrano'

# To use debugger
# gem 'debugger'
