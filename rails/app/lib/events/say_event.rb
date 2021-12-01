class SayEvent < Event
  def format((player), data) = `#{player.name rescue 'somebody'} says: #{data[:message]}`
end