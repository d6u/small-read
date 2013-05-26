class Tweet < ActiveRecord::Base

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
                  :text, :entities, :lang,
                  :read

  # Method
  def self.new_from_raw(tw)
    if tw['retweeted_status']
      content = {
        retweeted_status_id_str:      tw['retweeted_status']['id_str'],
        retweeted_status_user_id_str: tw['retweeted_status']['user']['id_str'],
        retweeted_status_user_screen_name: tw['retweeted_status']['user']['screen_name'],
        retweeted_status_user_name:   tw['retweeted_status']['user']['name'],
        retweeted_status_user_profile_image_url: tw['retweeted_status']['user']['profile_image_url'],
        # tweet content
        text:     tw['retweeted_status']['text'],
        entities: tw['retweeted_status']['entities'].to_json,
        lang:     tw['retweeted_status']['lang']
      }
    else
      content = {
        text:     tw['text'],
        entities: tw['entities'].to_json,
        lang:     tw['lang']
      }
    end
    content[:id_str] = tw['id_str']
    content[:created_at] = tw['created_at']
    return Tweet.new(content)
  end

end
