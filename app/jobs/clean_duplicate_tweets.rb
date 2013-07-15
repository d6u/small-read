class CleanDuplicateTweets
  ##
  # Clean up duplicate tweets based on tweet[feed_id, id_str] index
  #
  #     This is a resque job class
  #
  # ========================================


  @queue = :database_maintenance_queue


  def self.perform
    timer = Time.now

    Tweet.all.inject([]) do |inject, tweet|
      if !inject.include? "#{tweet.feed_id}-#{tweet.id_str}"
        inject << "#{tweet.feed_id}-#{tweet.id_str}"
      else
        tweet.destroy
      end
      inject
    end

    puts "--> CleanDuplicateTweets task finished, #{Time.now - timer} seconds used."
  end

end