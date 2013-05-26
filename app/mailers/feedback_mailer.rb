class FeedbackMailer < ActionMailer::Base
  default from: "feedback@getsmallread.com"

  def inside_feedback(page_name, subject, content)
    @page_name = page_name
    @subject = subject
    @content = content
    mail(:to => 'contact@getsmallread.com', :subject => "Feedbacks: #{subject}")
  end
end
