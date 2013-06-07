module ApplicationHelper

  def output_attributes_as_dataset(active_record)
    active_record.attributes.inject("") do |memo, pair|
      if pair[1].instance_of?(TrueClass) || pair[1].instance_of?(FalseClass)
        full_boolean = pair[1] ? 'true' : 'false'
        memo << "data-#{pair[0]}=\"#{full_boolean}\" "
      else
        memo << "data-#{pair[0]}=\"#{pair[1]}\" " unless pair[0] === "created_at" || pair[0] === "updated_at"
      end
      memo
    end.strip.html_safe
  end

end
