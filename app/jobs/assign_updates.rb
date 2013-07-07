class AssignUpdates
  @queue = :fetch_twitter_queue

  def self.perform
    timer = Time.now

    Twitter.all.each {|twitter| Resque.enqueue(UpdateTwitter, twitter.id)}

    puts "--> UpdatesAssignments task finished, #{Time.now - timer} time used."
  end

end