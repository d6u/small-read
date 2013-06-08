# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20130608184844) do

  create_table "feeds", :force => true do |t|
    t.string   "id_str"
    t.string   "screen_name"
    t.string   "name"
    t.text     "profile_image_url"
    t.integer  "order_in_folder"
    t.integer  "unread_count"
    t.integer  "folder_id"
    t.integer  "twitter_id"
    t.datetime "created_at",        :null => false
    t.datetime "updated_at",        :null => false
  end

  add_index "feeds", ["folder_id"], :name => "index_feeds_on_folder_id"
  add_index "feeds", ["twitter_id"], :name => "index_feeds_on_twitter_id"

  create_table "folders", :force => true do |t|
    t.string   "name",                               :null => false
    t.string   "color",        :default => "ECF0F1"
    t.integer  "position",                           :null => false
    t.integer  "unread_count"
    t.integer  "user_id"
    t.datetime "created_at",                         :null => false
    t.datetime "updated_at",                         :null => false
    t.boolean  "reserved",     :default => false
  end

  add_index "folders", ["user_id"], :name => "index_folders_on_user_id"

  create_table "forget_passwords", :force => true do |t|
    t.string   "verification_string"
    t.integer  "user_id"
    t.datetime "created_at",          :null => false
    t.datetime "updated_at",          :null => false
  end

  add_index "forget_passwords", ["user_id"], :name => "index_forget_passwords_on_user_id"
  add_index "forget_passwords", ["verification_string"], :name => "index_forget_passwords_on_verification_string"

  create_table "future_users", :force => true do |t|
    t.string   "email"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "future_users", ["email"], :name => "index_future_users_on_email"

  create_table "read_tweets", :force => true do |t|
    t.string   "id_str"
    t.string   "retweeted_status_id_str"
    t.string   "retweeted_status_user_id_str"
    t.string   "retweeted_status_user_screen_name"
    t.string   "retweeted_status_user_name"
    t.string   "retweeted_status_user_profile_image_url"
    t.text     "text"
    t.text     "entities"
    t.string   "lang"
    t.boolean  "read",                                    :default => true
    t.integer  "feed_id"
    t.datetime "created_at",                                                :null => false
    t.datetime "updated_at",                                                :null => false
  end

  add_index "read_tweets", ["feed_id"], :name => "index_read_tweets_on_feed_id"
  add_index "read_tweets", ["read"], :name => "index_read_tweets_on_read"

  create_table "remember_logins", :force => true do |t|
    t.string   "matching_code"
    t.integer  "user_id"
    t.datetime "created_at",    :null => false
    t.datetime "updated_at",    :null => false
  end

  add_index "remember_logins", ["matching_code"], :name => "index_remember_logins_on_matching_code"
  add_index "remember_logins", ["user_id"], :name => "index_remember_logins_on_user_id"

  create_table "system_metrics", :force => true do |t|
    t.string   "name",               :null => false
    t.datetime "started_at",         :null => false
    t.string   "transaction_id"
    t.text     "payload"
    t.float    "duration",           :null => false
    t.float    "exclusive_duration", :null => false
    t.integer  "request_id"
    t.integer  "parent_id"
    t.string   "action",             :null => false
    t.string   "category",           :null => false
  end

  create_table "tweets", :force => true do |t|
    t.string   "id_str"
    t.string   "retweeted_status_id_str"
    t.string   "retweeted_status_user_id_str"
    t.string   "retweeted_status_user_screen_name"
    t.string   "retweeted_status_user_name"
    t.string   "retweeted_status_user_profile_image_url"
    t.text     "text"
    t.text     "entities"
    t.string   "lang"
    t.boolean  "read",                                    :default => false
    t.integer  "feed_id"
    t.datetime "created_at",                                                 :null => false
    t.datetime "updated_at",                                                 :null => false
  end

  add_index "tweets", ["feed_id"], :name => "index_tweets_on_feed_id"
  add_index "tweets", ["read"], :name => "index_tweets_on_read"

  create_table "twitters", :force => true do |t|
    t.string   "user_id"
    t.string   "oauth_token"
    t.string   "oauth_token_secret"
    t.string   "screen_name"
    t.string   "newest_tweet_id"
    t.integer  "local_user_id"
    t.datetime "created_at",         :null => false
    t.datetime "updated_at",         :null => false
  end

  add_index "twitters", ["local_user_id"], :name => "index_twitters_on_local_user_id"
  add_index "twitters", ["user_id"], :name => "index_twitters_on_user_id"

  create_table "users", :force => true do |t|
    t.string   "email"
    t.string   "hashed_pw",  :limit => 40
    t.string   "salt",       :limit => 40
    t.string   "name"
    t.datetime "created_at",               :null => false
    t.datetime "updated_at",               :null => false
  end

  add_index "users", ["email"], :name => "index_users_on_email"

end
