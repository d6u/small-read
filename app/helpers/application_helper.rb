module ApplicationHelper

  def output_attributes_as_dataset(active_record)
    active_record.attributes.inject("") do |memo, pair|
      memo << "data-#{pair[0]}=\"#{pair[1]}\" " unless pair[0] === "created_at" || pair[0] === "updated_at"
      memo
    end.strip.html_safe
  end

end
