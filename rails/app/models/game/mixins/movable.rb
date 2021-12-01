module Game::Mixins
  module Movable
    def self.included(base)

      base.after_initialize do
        @put_action = ActionType.get :put, true
      end

      base.after_create do
        self.action_types << @put_action
      end

      base.execute do |action|
        p "Executing action #{action}", action.type, @put_action, action.target
        if action.type == @put_action and action.target.respond_to? :receive_put
          parent = self.get('..')
          name = action.object_path.last || parent.namesfor(self).first
          parent.unlink(name)
          action.target.receive_put(name, self)
          self.unlink('..')
          self.set('..', action.target)
          next { status: :success, name: name }
        end
      end
    end
  end
end