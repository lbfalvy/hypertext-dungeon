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

  def spread(location, targets = Set.new([location]))
    propagate(location).each do |child|
      next if targets === child
      targets << child
      spread(child, targets)
    end
    targets
  end

  def propagate(location) = location.parents.chain(location.sound_destinations)

  def self.emit(origin, actors, data)
    event = self.new(actors, data)
    audience = self.spread origin
    audience.each { |target| target.handle_event(event, audience) }
  end

  def format() = 'Something happened'
end
