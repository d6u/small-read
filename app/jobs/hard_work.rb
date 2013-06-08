class HardWork
  @queue = :testing_queue

  def self.perform(name="Default", error=nil)
    puts "--> Working hard for #{name}!"
    raise "ERR> HardWork error" if error == true
    sleep 3
    puts "--> Finish hard work!"
  end

end