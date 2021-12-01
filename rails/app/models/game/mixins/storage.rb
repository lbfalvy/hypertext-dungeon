module Game::Mixins
  module Storage
    def self.included(base)
      
      base.after_initialize do
        @put_action = ActionType.get :put, true
      end

      base.after_create do
        self.targeted_by << @put_action
      end

      # base.interact do |action, object_result|
      #   if action == @put_action and 
      #     self.set(action.object)
      #     return { status: :success }
      #   end
      # end
    end

    def receive_put(name, object)
      p "Receiving put #{object} as #{name}"
      self.set(name, object)
      return { status: :success }
    end
  end
end