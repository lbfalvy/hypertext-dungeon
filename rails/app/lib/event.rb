require 'set'

class Event
  private_class_method :new
  attr_reader :metadata

  def initialize(actors, data)
    @actors = actors
    @data = data
  end

  def print(known_objects)
    key = @actors.map { |actor| (known_objects.include? actor) ? actor : nil }
    format(key, @data)
  end

  def spread(location, targets = { location => 0 }, distance = 1)
    propagate(location).each do |child|
      next if targets.include?(child) && targets[child] <= distance
      targets[child] = distance
      spread(child, targets, distance +1)
    end
    targets
  end

  def propagate(location) = location.parents

  def self.emit(origin, actors, data)
    Rails.logger.info "Emitting #{self} from #{origin}"
    event = self.new(actors, data)
    audience = event.spread origin
    audience.each { |target, distance| target.handle_event(event, audience) }
  end

  def format() = 'Something happened'
end
