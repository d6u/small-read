class TweetsController < ApplicationController
  # Filter
  before_filter :redirect_if_not_logged_in

  # GET /tweets
  def index
    if params[:folder_id]
      tweets = Folder.find(params[:folder_id]).tweets.where('read IS NULL OR read IS FALSE').sort {|a,b| b.created_at <=> a.created_at}
    elsif params[:feed_id]
      tweets = Feed.find(params[:feed_id]).tweets.where('read IS NULL OR read IS FALSE').sort {|a,b| b.created_at <=> a.created_at }
    else
      head :no_content
    end

    render json: (tweets.map do |t|
      if t.retweeted_status_id_str
        content = {
            is_status_a_retweet: true,
              profile_image_url: t.retweeted_status_user_profile_image_url,
                           name: t.retweeted_status_user_name,
                    screen_name: "@" + t.retweeted_status_user_screen_name,
                 this_user_name: t.feed.name,
          this_user_screen_name: "@" + t.feed.screen_name,
           original_tweets_link: "https://twitter.com/#{t.retweeted_status_user_screen_name}/status/#{t.retweeted_status_id_str}"
        }
      else
        content = {
            is_status_a_retweet: false,
              profile_image_url: t.feed.profile_image_url,
                           name: t.feed.name,
                    screen_name: "@" + t.feed.screen_name
        }
      end
      content[:id]       = t.id
      content[:entities] = t.entities
      content[:text]     = parse_text(t.text, t.entities)
      content[:read]     = t.read
      content[:feed_id]  = t.feed_id
      content[:link]     = "https://twitter.com/#{t.feed.screen_name}/status/#{t.id_str}"
      content
    end)
  end

  # GET /tweets/1
  def show
    @tweet = Feed.find(params[:feed_id]).tweets.find(params[:id])

    render json: @tweet
  end

  # GET /tweets/new
  def new
    @tweet = Tweet.new

    render json: @tweet
  end

  # GET /tweets/1/edit
  def edit
    @tweet = Feed.find(params[:feed_id]).tweets.find(params[:id])
  end

  # POST /tweets
  def create
    @tweet = Tweet.new(params[:tweet])

    if @tweet.save
      render json: @tweet, status: :created, location: @tweet
    else
      render json: @tweet.errors, status: :unprocessable_entity
    end
  end

  # PUT /tweets/1
  def update
    if params[:folder_id]
      @tweet = Folder.find(params[:folder_id]).tweets.find(params[:id])
    else
      @tweet = Feed.find(params[:feed_id]).tweets.find(params[:id])
    end

    if @tweet.update_attributes(params[:tweet])
      @tweet.feed.count_unread.folder.count_unread
      head :no_content
    else
      render json: @tweet.errors, status: :unprocessable_entity
    end
  end

  # DELETE /tweets/1
  def destroy
    @tweet = Feed.find(params[:feed_id]).tweets.find(params[:id])
    @tweet.destroy

    head :no_content
  end

  private
  def parse_text(text, raw_entities=nil)
    parsed_text = text.clone
    entities = MultiJson.load(raw_entities)
    if entities['urls']
      entities['urls'].each {|u| parsed_text[u['indices'][0], u['indices'][1]] = "<a href=\"#{u['url']}\" target=\"blank\">#{u['display_url']}</a>"}
    end
    if entities['media']
      entities['media'].each {|u| parsed_text[u['indices'][0], u['indices'][1]] = "<a href=\"#{u['url']}\" target=\"blank\">#{u['display_url']}</a>"}
    end
    return parsed_text
  end
end
