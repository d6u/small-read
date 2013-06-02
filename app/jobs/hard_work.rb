class HardWork
  include Sidekiq::Worker

  def perform(name="")
    puts "--> Thinking hard!"
    sleep 3
    puts "--> Finish hard work! #{name}"
  end

end