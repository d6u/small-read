if Rails.env.production?
  ENV["REDISTOGO_URL"] ||= "redis://redistogo:9c6e519b0151ab038947d4b72d0dbbf8@spinyfin.redistogo.com:9393/"
elsif Rails.evn.staging?
  ENV["REDISTOGO_URL"] ||= "redis://redistogo:9dc57c99cb50d5ee5d1ff8fc50388741@dory.redistogo.com:10839/"
else
  ENV["REDISTOGO_URL"] ||= "redis://localhost:6379/"
end

puts "--> Connecting to Redis"
uri = URI.parse(ENV["REDISTOGO_URL"])
$redis = Redis.new(:host => uri.host, :port => uri.port, :password => uri.password)
