class SendFeedback
  include Sidekiq::Worker

  def perform(params)
    puts "--> Sedding feedbacks"

    FeedbackMailer.inside_feedback(params).deliver

    puts "--> Feedbacks sent"
  end
end
