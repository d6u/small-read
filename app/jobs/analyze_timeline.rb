class AnalyzeTimeline
  @queue = :analyze_timeline_queue

  def self.perform(twitter_id)
    timer = Time.now

    Tweet.analyze_tweets_for_twitter_id(twitter_id)

    puts "--> AnalyzeTimeline(twitter_id: #{twitter_id}) task finished, #{Time.now - timer} time used."
  end
end
