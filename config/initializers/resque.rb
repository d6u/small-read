require 'resque'
require 'resque_scheduler'
require 'resque/scheduler'
require 'resque/server'
require 'resque_scheduler/server'

rails_root    = ENV['RAILS_ROOT'] || File.dirname(__FILE__) + '/../..'
rails_env     = ENV['RAILS_ENV'] || 'development'
resque_config = YAML.load_file(rails_root + '/config/resque.yml')
uri           = URI.parse(resque_config[rails_env])

Resque.redis  = Redis.new(
  :host        => uri.host,     # "localhost"
  :port        => uri.port,     # 6379
  :password    => uri.password, # nil
  :thread_safe => true
)
Resque.redis.namespace = "small_read:resque"
Resque.schedule        = YAML.load_file(Rails.root.join('config', 'resque_schedule.yml'))
Resque::Server.use(Rack::Auth::Basic) do |user, password|
  user == "daiweilu123@gmail.com"
  password == "daiweiResqueS"
end


# if Rails.env.production?
#   ENV["REDISTOGO_URL"] ||= "redis://redistogo:9c6e519b0151ab038947d4b72d0dbbf8@spinyfin.redistogo.com:9393/"
# elsif Rails.env.staging?
#   ENV["REDISTOGO_URL"] ||= "redis://redistogo:9dc57c99cb50d5ee5d1ff8fc50388741@dory.redistogo.com:10839/"
# else
#   ENV["REDISTOGO_URL"] ||= "redis://localhost:6379/"
# end

# puts "--> Connecting to Redis"
# uri = URI.parse(ENV["REDISTOGO_URL"])
# $redis = Redis.new(:host => uri.host, :port => uri.port, :password => uri.password)
