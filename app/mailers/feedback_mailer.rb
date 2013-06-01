class FeedbackMailer < ActionMailer::Base
  default from: "feedback@getsmallread.com"

  def inside_feedback(params)
    @params_fields = params
    puts "--> generating emails"
    mail(:to => 'contact@getsmallread.com', :subject => "Feedbacks: #{params[:subject]}")
    puts "--> feedbacks email generated"
  end
end
