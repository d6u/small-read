class HardWork
  @queue = :testing_queue

  def self.perform(name="Default")
    puts "--> Working hard for #{name}!"
    sleep 3
    puts "--> Finish hard work!"
  end

end