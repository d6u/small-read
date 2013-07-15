json.array! @user.twitters.first.feeds.where('unread_count > 0').order('unread_count DESC') do |feed|

  json.id                feed.id
  json.profile_image_url feed.profile_image_url
  json.name              feed.name
  json.screen_name       feed.screen_name
  json.unread_count      feed.unread_count
  json.group_id          feed.folder_id
  json.folder_id         feed.folder_id

  # retrive data from db
  cover_tweet   = feed.top_image_tweets.limit(1).first
  top_tweets    = feed.top_tweets.limit(3)
  if cover_tweet
    top_tweets.pop
  else
    cover_tweet = top_tweets.shift
  end
  # finish

  json.coverTweet do
    json.idStr      cover_tweet.id_str
    json.text       cover_tweet.text
    json.created_at cover_tweet.created_at
    json.entities   cover_tweet.entities
    json.withImage  cover_tweet.with_image
    json.lang       cover_tweet.lang
  end

  json.topTweets    top_tweets do |tweet|
    json.idStr      tweet.id_str
    json.text       tweet.text
    json.created_at  tweet.created_at
    json.entities   tweet.entities
  end

end
