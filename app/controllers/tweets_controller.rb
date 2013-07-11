class TweetsController < ApplicationController
  # Filters
  # ========================================


  # Actions
  # ========================================

  ##
  # GET /folders/:folder_id/tweets
  # GET /feeds/:feed_id/tweets
  # GET /tweets
  # ----------------------------------------
  def index
    query = params[:max_id] ? ['t.id <= ?', params[:max_id]] : ''
    query_loading_behavior = params[:all] === 'true' ? '' : 'read IS FALSE'
    if params[:folder_id]
      tweets = Tweet
               .select('f.name, f.profile_image_url, f.screen_name, t.*')
               .from('feeds f, tweets t')
               .where(['t.feed_id = f.id AND f.folder_id = ?', params[:folder_id]])
               .where(query_loading_behavior)
               .where(query)
               .order('t.id DESC').limit(20)

      # tweets = Folder.find(params[:folder_id]).tweets.where(query_loading_behavior).where(query).order('id DESC').limit(20)
    elsif params[:feed_id]
      tweets = Tweet
               .select('f.name, f.profile_image_url, f.screen_name, t.*')
               .from('feeds f, tweets t')
               .where(['t.feed_id = f.id AND f.id = ?', params[:feed_id]])
               .where(query_loading_behavior)
               .where(query)
               .order('t.id DESC').limit(20)

      # tweets = Feed.find(params[:feed_id]).tweets.where(query_loading_behavior).where(query).order('id DESC').limit(20)
    else
      head :no_content
    end

    render :json => tweets
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
    @tweet = Tweet.find(params[:id])

    if @tweet.update_attributes(params[:tweet])
      @tweet.feed.count_unread.folder.count_unread
      head :no_content
    else
      render json: @tweet.errors, status: :unprocessable_entity
    end
  end

  # GET /tweets/:id/mark_read
  # -------------------------
  def mark_read
    @tweet = Tweet.find(params[:id])

    if @tweet.update_attributes(:read => true)
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
      entities['urls'].each {|u| parsed_text[u['indices'][0], u['indices'][1]] = "<a href=\"#{u['url']}\" target=\"_blank\">#{u['display_url']}</a>"}
    end
    if entities['media']
      entities['media'].each {|u| parsed_text[u['indices'][0], u['indices'][1]] = "<a href=\"#{u['url']}\" target=\"_blank\">#{u['display_url']}</a>"}
    end
    return parsed_text
  end
end
