class ReadTweet < ActiveRecord::Base

  belongs_to      :feed
  belongs_to      :twitter

  attr_accessible :id_str, :created_at,
                  # retweeted attr
                  :retweeted_status_id_str,
                  :retweeted_status_user_id_str,
                  :retweeted_status_user_screen_name,
                  :retweeted_status_user_name,
                  :retweeted_status_user_profile_image_url,
                  # tweet content
                  :text, :entities, :lang

  # Method

end
