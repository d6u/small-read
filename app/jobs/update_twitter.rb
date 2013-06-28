class UpdateTwitter
  @queue = :sync_twitter_queue

  def self.perform(twitter_id=nil)
    twitter_id ? Twitter.find_by_id(twitter_id).refresh_account : Twitter.all.each {|twitter| twitter.refresh_account}
  end

end
