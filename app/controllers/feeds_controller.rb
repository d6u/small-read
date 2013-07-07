class FeedsController < ApplicationController
  # Filters
  # ========================================


  # Actions
  # ========================================

  ##
  # GET /feeds
  #
  # ----------------------------------------
  def index
    if params[:folder_id]
      @feeds = @user.folders.find(params[:folder_id]).feeds
    else
      @feeds = @user.twitters[0].feeds
    end

    render json: @feeds
  end


  ##
  # Add top tweets data onto feeds
  #
  # GET /feeds_with_top_tweets
  # ----------------------------------------
  def feeds_with_top_tweets
    render 'feeds_with_top_tweets.json', :formats => [:json]
  end


  # GET /feeds/1
  def show
    @feed = @user.twitters.first.feeds.find(params[:id])
    render json: @feed
  end

  # GET /feeds/new
  def new
    @feed = @user.twitters.first.feeds.new
    render json: @feed
  end

  # GET /feeds/1/edit
  def edit
    @feed = @user.twitters.first.feeds.find(params[:id])
  end

  # POST /feeds
  def create
    @feed = @user.twitters.first.feeds.new(params[:feed])

    if @feed.save
      render json: @feed, status: :created, location: @feed
    else
      render json: @feed.errors, status: :unprocessable_entity
    end
  end

  # PUT /feeds/1
  def update
    @feed = @user.twitters.first.feeds.find(params[:id])
    previous_folder = @feed.folder
    if @feed.update_attributes(:folder_id => params[:feed][:folder_id])
      previous_folder.count_unread
      @feed.folder.count_unread
      head :no_content
    else
      render json: @feed.errors, status: :unprocessable_entity
    end
  end

  # DELETE /feeds/1
  def destroy
    @feed = Feed.find(params[:id])
    @feed.destroy

    head :no_content
  end
end
