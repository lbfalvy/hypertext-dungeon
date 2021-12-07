module Game
  class Role < GameObject
    has_and_belongs_to_many :users, join_table: :roles_users, inverse_of: :roles, autosave: true

    after_initialize do
      @say = ActionType.get :say, false
    end

    after_create do
      self.action_types << @say
    end

    def self.for_player(user, position)
      role = self.create
      role.users << user
      position.set(user.username, role)
      role.set('..', position)
      role.save
      role
    end

    execute do |action|
      if action.type == @say
        raise Exception.new 'Only subject can say' unless action.subject == self
        Events::SayEvent.emit(self, [self], action.data)
      end
    end

    perceive_change do |change, property, value, path, version|
      self.users.each do |user|
        ActionCable.server.broadcast "user:#{user.username}", {
          type: :change,
          path: path,
          version: version,
          property: property.to_s.camelize(:lower),
          change: change,
          value: value.serialize_short
        }
      end
    end

    handle_event do |event, audience|
      # We're the source
      source = '.' if audience[self] == 0
      # Source is object in inventory or the room itself
      unless source
        children = self.list
        source_object = children.select{ |entry|
          audience[entry.child] == 0 
        }.first
        source = source_object.name if source_object
      end
      # Source is an object in the room or within an item in inventory
      unless source
        nearby = self.list.flat_map{ |entry| [
          [nil, entry],
          *entry.child.list.map { |child_entry|
            [entry.name, child_entry]
          }
        ]}
        parent_name, source_entry = nearby.min_by do |parent_entry, entry|
          logger.debug "Fuck knows what's going on here #{parent_entry} #{entry}"
          audience[entry.child]
        end
        source = parent_name ? "#{parent_name}/#{source_entry.name}" : "#{source_entry.name}/???"
      end
      message = event.format(self)
      users.each do |user|
        logger.info "Transmitting #{event} to #{user}"
        ActionCable.server.broadcast "user:#{user.username}", {
          type: :event,
          message: message,
          source: source,
          role: id
        }
      end
    end
  end
end