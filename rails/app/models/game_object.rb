require 'set'

class GameObject < ApplicationRecord
  has_many :entries, inverse_of: :parent, foreign_key: :parent_id, autosave: true,
    after_add: :on_entry_add, after_remove: :on_entry_rm
  has_many :occurences, class_name: 'Entry', inverse_of: :child, foreign_key: :child_id, autosave: true
  has_many :children, class_name: 'GameObject', through: :entries, inverse_of: :parents, autosave: true
  has_many :parents, class_name: 'GameObject', through: :occurences, inverse_of: :children, autosave: true
  has_and_belongs_to_many(:action_types,
    after_add: :on_action_type_add, after_remove: :on_action_type_rm, autosave: true)
  has_and_belongs_to_many(:targeted_by, class_name: 'ActionType',
    join_table: :targets_actions, foreign_key: :game_object_id, association_foreign_key: :action_type_id,
    after_add: :on_targeted_by_add, after_remove: :on_targeted_by_rm, autosave: true)
  has_and_belongs_to_many(:event_sources, class_name: 'GameObject',
    join_table: :event_paths, foreign_key: :destination, association_foreign_key: :source, autosave: true)
  has_and_belongs_to_many(:event_destinations, class_name: 'GameObject',
    join_table: :event_paths, foreign_key: :source, association_foreign_key: :destination, autosave: true)

  after_create do
    self.version = 0
  end

  # Ensure that parents get notified when something visible changes
  def on_entry_add(ent) = self.alert_parents(:add, :entries, ent)
  def on_entry_rm(ent) = self.alert_parents(:remove, :entries, ent)
  def on_targeted_by_add(at) = self.alert_parents(:add, :targeted_by, at)
  def on_action_type_add(at) = self.alert_parents(:add, :action_types, at)
  def on_targeted_by_rm(at) = self.alert_parents(:remove, :targeted_by, at)
  def on_action_type_rm(at) = self.alert_parents(:remove, :action_types, at)
  def alert_parents(change, property, value)
    self.ancestry.each do |parent, path|
      parent.perceive_change(change, property, value, path, version)
    end
    self.version += 1
  end

  # Tree navigation methods
  def get(name) = entries.find_by(name: name).child rescue nil
  def set(name, value)
    raise Exception.new 'Name in use' if get(name)
    entry = Entry.create(name: name, child: value)
    self.entries << entry
  end
  def namesfor(child) = entries.where(child: child).map(&:name) rescue nil
  def unlink(name) = entries.find_by(name: name).destroy rescue raise(Exception.new 'Entry not found')

  # Recursively get()
  def resolve_path(path)
    object = self
    ancestry = []
    path.each do |name|
      object = object.get(name)
      ancestry.push(object || raise(Exception.new 'Invalid path'))
    end
    ancestry
  end

  # Find all nodes accessible in a given direction
  def ancestry(hash={}, path=[''])
    return if hash[self]
    hash[self] = path
    self.occurences.each do |occurence|
      parent_path = [occurence.name, *path]
      occurence.parent.ancestry(hash, parent_path)
    end
    hash
  end
  def descendants(hash={}, path=[])
    return if hash[self]
    hash[self] = path
    self.entries.each do |entry|
      child_path = [*path, entry.name]
      entry.child.descendants(hash, child_path)
    end
    hash
  end

  def serialize_short() = {
    id: id,
    type: self.class.name,
    version: self.version,
    action_types: action_types.to_a.map(&:serialize),
    targeted_by: targeted_by.to_a.map(&:serialize),
    entries: entries.to_h { |entry| [entry.name, entry.child.id] }
  }

  def serialize(known = Set.new)
    return self.id if known === self
    known << self
    return {
      id: id,
      type: self.class.name,
      version: self.version,
      action_types: action_types.to_a.map(&:serialize),
      targeted_by: targeted_by.to_a.map(&:serialize),
      entries: entries.to_h { |entry| [entry.name, entry.child.serialize(known)]}
    }
  end
  
  # Delegates
  def self.dispatchable(name)
    handlers_key = "#{name}_handlers".to_sym
    self.define_method(name) do |*args|
      result = nil
      self.class.send(handlers_key).each do |fn|
        result = self.instance_exec(*args, &fn)
        break
      end if self.class.respond_to? handlers_key
      next result
    end
    self.class.define_method(name) { |&fn|
      unless self.respond_to? handlers_key
        self.instance_variable_set("@#{handlers_key}", [])
        self.define_singleton_method(handlers_key) do
          self.instance_variable_get("@#{handlers_key}")
        end
      end
      self.send(handlers_key).push(fn)
    }
  end
  dispatchable :intercept # action, object_path=nil, target_path=nil
  dispatchable :execute # action
  dispatchable :interact # action, execute_result
  dispatchable :react # action, execute_result, interact_result, object_path=nil, target_path=nil
  dispatchable :handle_event # event, audience
  dispatchable :perceive_change # object, property, value
end