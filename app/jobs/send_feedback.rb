class SendFeedback
  @queue = :send_feedback_queue

  def self.perform(page_name, subject, content)
    FeedbackMailer.inside_feedback(page_name, subject, content).deliver
  end
end