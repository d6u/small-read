# Unicorn configuration
worker_processes Integer(3)
timeout 5
preload_app true


# before_fork
before_fork do |server, worker|

  Signal.trap 'TERM' do
    puts 'Unicorn master intercepting TERM and sending myself QUIT instead'
    Process.kill 'QUIT', Process.pid
  end

  defined?(ActiveRecord::Base) and ActiveRecord::Base.connection.disconnect!

  defined?(Resque) and Resque.redis.client.disconnect

end


# after_fork
after_fork do |server, worker|

  Signal.trap 'TERM' do
    puts 'Unicorn worker intercepting TERM and doing nothing. Wait for master to send QUIT'
  end

  defined?(ActiveRecord::Base) and ActiveRecord::Base.establish_connection

  defined?(Resque) and Resque.redis.client.reconnect

end
