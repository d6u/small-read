require 'resque/tasks'
require 'resque_scheduler/tasks'

Resque.logger       = Logger.new(STDOUT)
Resque.logger.level = Logger::INFO

task "resque:setup" => :environment do
  puts "--> Settings up Resque environment"
end
