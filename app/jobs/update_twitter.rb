class UpdateTwitter
  @queue = :sync_twitter_queue

  def self.perform(twitter_id)
    timer = Time.now

    Twitter.find_by_id(twitter_id).refresh_account
    Resque.enqueue(AnalyzeTimeline, twitter_id)

    puts "--> UpdateTwitter(twitter_id: #{twitter_id}) task finished, #{Time.now - timer} time used."
  end

end
