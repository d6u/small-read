class FetchTweets
  @queue = :fetch_twitter_content_queue

  def self.perform(user_id=nil, as_much_as_possible=true)
    if as_much_as_possible == true
      puts "--> Begin fetching tweets (all users)"
    else
      puts "--> Begin fetching tweets (for user.id = #{user_id})"
    end

    if user_id
      user = User.find_by_id user_id
      user.twitters.first.refresh_account(:as_much_as_possible => as_much_as_possible) if !user.twitters.empty?
    else
      Twitter.all.each do |twitter|
        twitter.refresh_account(:as_much_as_possible => true)
      end
    end

    if as_much_as_possible == true
      puts "--> Finish fetching tweets (all users)"
    else
      puts "--> Finish fetching tweets (for user.id = #{user_id})"
    end
  end

end