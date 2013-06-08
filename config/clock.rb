# require 'clockwork'
# require './config/boot'
# require './config/environment'

# module Clockwork

#   configure do |cofig|
#     config[:tz] = "America/Chicago"
#   end

#   handler do |job|
#     puts "Running #{job}"
#   end

#   every(15.minutes, 'fetch.tweets.all') { FetchTweets.perform_async }
#   every(24.hours, 'clean.duplicates') { CleanDuplicates.perform_async }
# end