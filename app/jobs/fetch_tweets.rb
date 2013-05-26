class FetchTweets
  @queue = :fetch_tweets_query

  def self.perform(user_id=nil, as_much_as_possible=true)
    puts "Perform FetchTweets"
    if user_id
      user = User.find_by_id user_id
      user.twitters[0].refresh_account(:as_much_as_possible => as_much_as_possible) if !user.twitters.empty?
    else
      User.all.each do |u|
        u.twitters[0].refresh_account(:as_much_as_possible => true) if !u.twitters.empty?
      end
    end
    puts "Finish perform FetchTweets"
  end

end