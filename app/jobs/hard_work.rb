class HardWork
  @queue = :testing_queue

  def self.perform(name="Default", error=nil)
    puts "--> Working hard for #{name}!"
    raise "ERR> HardWork error" if error == true
    10.times {|i| puts "--> Think hard for No.#{i}"; sleep 1}
    puts "--> Finish hard work!"
  end

end