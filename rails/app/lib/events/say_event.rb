class Events::SayEvent < Event
  def format(target) = "#{@data}"
end