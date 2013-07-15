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

    Feed.all.each do |feed|
      feed.tweets.inject([]) do |inject, tweet|
        if !inject.include? tweet.id_str
          inject << tweet.id_str
        else
          tweet.destroy
        end
        inject
      end
    end

    puts "--> CleanDuplicateTweets task finished, #{Time.now - timer} seconds used."
  end

end