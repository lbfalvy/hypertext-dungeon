class ActionType < ApplicationRecord
  has_and_belongs_to_many :game_objects, autosave: true
  has_and_belongs_to_many(:targets, class_name: 'GameObject', autosave: true,
    join_table: :targets_actions, foreign_key: :action_type_id, association_foreign_key: :game_object_id)
  
  def name() = super.to_sym
  def name=(value)
    super(value.to_s)
  end
  
  def self.get(name, can_target)
    instance = self.find_by(name: name.to_s, can_target: can_target)
    return instance || self.create(name: name.to_s, can_target: can_target)
  end

  def serialize() = { name: name, canTarget: can_target }
  def serialize_short() = serialize
end
