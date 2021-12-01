class Entry < ApplicationRecord
  belongs_to :parent, class_name: 'GameObject', inverse_of: :entries, foreign_key: :parent_id, autosave: true
  belongs_to :child, class_name: 'GameObject', inverse_of: :occurences, foreign_key: :child_id, autosave: true

  def name=(value)
    raise Exception.new('Name cannot contain slashes') if value.include? '/'
    super
  end

  def serialize() = { name: name, child: child.serialize }
  def serialize_short() = { name: name, child: child.id }
end