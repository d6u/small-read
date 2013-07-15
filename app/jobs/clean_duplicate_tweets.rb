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

    Feed.select(:id).pluck(:id).each do |feed_id|
      tweets = Tweet.select('id, id_str').where('feed_id = ?', feed_id)
      tweets.inject([]) do |inject, tweet|
        if !inject.include? tweet.id_str
          inject << tweet.id_str
        else
          tweet.destroy
        end
        inject
      end
    end
    puts "--> CleanDuplicateTweets task part 1 finished, #{Time.now - timer} seconds used."


    puts "--> Updating score of tweets"
    twitter = Twitter.select(:id).pluck(:id)
    twitter.each {|twitter_id| Tweet.analyze_tweets_for_twitter_id twitter_id, {:count => :all}}


    puts "--> CleanDuplicateTweets task finished, #{Time.now - timer} seconds used."
  end

end