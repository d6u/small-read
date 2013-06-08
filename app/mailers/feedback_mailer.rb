class FeedbackMailer < ActionMailer::Base
  default from: "feedback@getsmallread.com"

  def inside_feedback(params)
    @params_fields = params
    puts "--> Generating contents of email"
    mail(:to => 'contact@getsmallread.com', :subject => "Feedbacks: #{params[:subject]}")
    puts "--> Email content generated"
  end
end
