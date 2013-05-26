class CleanDuplicates
  @queue = :clean_duplicates_query

  def self.perform
    puts "Perform CleanDuplicates"
    User.all.each do |user|
      user.twitters.each do |twitter|
        # clean duplicate feeds
        id_strs = []
        twitter.feeds.each do |feed|
          if id_strs.include? feed.id_str
            feed.destroy
          else
            id_strs << feed.id_str
          end
        end

        # clean orphan tweets
        Tweet.all.each do |tweet|
          if !tweet.feed
            tweet.destroy
            next
          end
        end

        # clean duplicate tweets
        id_strs = []
        twitter.tweets.each do |tweet|
          if id_strs.include? tweet.id_str
            tweet.destroy
          else
            id_strs << tweet.id_str
          end
        end

      end
    end
    puts "Finish Perform CleanDuplicates"
  end

end
