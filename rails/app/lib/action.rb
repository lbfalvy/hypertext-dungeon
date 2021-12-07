class Action
  attr_reader :target
  attr_reader :target_path
  attr_reader :object
  attr_reader :object_path
  attr_reader :subject
  attr_reader :type
  attr_reader :data

  def name() = @type.name

  def initialize(type, subject, object, target, object_path, target_path, data)
    @type = type
    @subject = subject
    @data = data
    unless object.action_types.any? { |t| t == type } and !target or target.targeted_by.any? { |t| t == type }
      raise Exception.new 'Unsupported action'
    end
    @object = object
    @target = target
    @object_path = object_path
    @target_path = target_path
  end

  # target may be nil
  def self.make(type, subject, object_path, target_path, data=nil)
    # Trisect paths and ancestries
    common_path, object_subpath, target_subpath = (
      target_path ?
        Paths.common(object_path, target_path) :
        [[], object_path, nil]
    )
    common_ancestry = subject.resolve_path common_path
    common_ancestry.unshift subject # Also gets intercept and react
    object_ancestry = common_ancestry.last.resolve_path object_subpath
    object = object_ancestry.last || common_ancestry.last
    target_ancestry = common_ancestry.last.resolve_path target_subpath if target_subpath
    target = target_ancestry.last || common_ancestry.last if target_ancestry
    # Construct action object
    action = Action.new(type, subject, object, target, object_path, target_path, data)
    # Pair each ancestor with its respective path segment
    with_subpaths = common_ancestry.map do |ancestor|
      result = [ancestor, object_path, target_path]
      object_path = object_path[1..-1] || []
      target_path = target_path[1..-1] || [] unless target_path == nil
      next result
    end
    with_subpaths.concat object_ancestry.map { |ancestor|
      result = [ancestor, object_path, nil]
      object_path = object_path[1..-1] || []
      next result
    }.to_a
    with_subpaths.concat target_ancestry.map { |ancestor|
      result = [ancestor, nil, target_path]
      target_path = target_path[1..-1] || []
      next result
    }.to_a if target_ancestry
    with_subpaths.each do |ancestor, op, tp|
      ancestor.intercept(action, op, tp)
    end
    Rails.logger.info "#{subject} executed #{type} with #{object} on #{target} for #{data}"
    results = object.execute action
    with_subpaths.each do |ancestor, op, tp|
      ancestor.react(action, results, op, tp)
    end
    return true
  end
end