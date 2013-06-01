task "tweets:cleanup" => :environment do
  # Resque.enqueue(CleanDuplicates)
end
