class SendFeedback
  @queue = :send_feedback_queue

  def self.perform(params)
    puts "--> sedding feedbacks"
    FeedbackMailer.inside_feedback(params).deliver
    puts "--> feedbacks sent"
  end
end