json.array! @user.twitters.first.feeds.where('unread_count > 0').order('unread_count DESC') do |feed|

  json.id              feed.id
  json.profileImageUrl feed.profile_image_url
  json.name            feed.name
  json.screenName      feed.screen_name
  json.unreadCount     feed.unread_count


  json.topTweets       feed.top_tweets.split(',') do |tweet_id|

    tweet = Tweet.find_by_id tweet_id

    json.text      tweet.text
    json.createdAt tweet.created_at
    json.entities  tweet.entities
  end

end
