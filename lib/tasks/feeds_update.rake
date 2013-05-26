task "feeds:update" => :environment do
  Resque.enqueue(FetchTweets)
end
