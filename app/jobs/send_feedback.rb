class SendFeedback
  @queue = :email_queue

  def self.perform(params)
    puts "--> Begin sending feedback email"

    FeedbackMailer.inside_feedback(params).deliver

    puts "--> Finish sending feedback email"
  end
end
