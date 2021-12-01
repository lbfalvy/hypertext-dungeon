module Game
  class Role < GameObject
    has_and_belongs_to_many :users, join_table: :roles_users, inverse_of: :roles, autosave: true

    def after_initialize
      @say = ActionType.get :say, false
    end

    def after_create
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
      if action == @say
        raise Exception.new 'Only subject can say' unless action.subject == self
        SayEvent.emit(self, [self], action.data)
      end
    end

    perceive_change do |change, property, value, path, version|
      self.users.each do |user|
        ActionCable.server.broadcast "user:#{user.username}", {
          type: :change,
          path: path,
          version: version,
          property: property,
          change: change,
          value: value.serialize_short
        }
      end
    end

    handle_event do |event, audience|
      users.each do |user|
        ActionCable.server.broadcast_to user, {
          type: :event,
          message: event.format(self.collect_children),
          role: id
        }
      end
    end
  end
end