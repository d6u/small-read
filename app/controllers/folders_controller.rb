class FoldersController < ApplicationController
  # Filters
  # =======


  # Actions
  # =======
  # GET /folders
  def index
    @folders = @user.folders.all.order('position ASC')
    render json: @folders
  end

  # GET /folders/1
  def show
    @folder = @user.folders.find(params[:id])
    render json: @folder
  end

  # GET /folders/new
  def new
    @folder = @user.folders.new
    render json: @folder
  end

  # GET /folders/1/edit
  def edit
    @folder = @user.folders.find(params[:id])
  end

  # POST /folders
  def create
    @folder = @user.folders.new(params[:folder])

    if @folder.save
      render json: @folder, status: :created, location: @folder
    else
      render json: @folder.errors, status: :unprocessable_entity
    end
  end

  # PUT /folders/1
  def update
    @folder = Folder.find(params[:id])
    # TODO: prevent updating Muted and General folder :name and :reserved
    if @folder.update_attributes(params[:folder])
      head :no_content
    else
      render json: @folder.errors, status: :unprocessable_entity
    end
  end

  # DELETE /folders/1
  def destroy
    @folder = Folder.find(params[:id])
    if @folder.name.downcase === "muted" || @folder.name.downcase === "general"
      raise "ERROR: cannot delete Muted or General folder"
    else
      @user.folders.where("lower(name) = 'general'").first.feeds << @folder.feeds
      @folder.destroy
    end
    head :no_content
  end
end
