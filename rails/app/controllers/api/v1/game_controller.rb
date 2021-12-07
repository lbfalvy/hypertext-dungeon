module Api
  class V1::GameController < ApiController
    before_action :get_role, except: [:roles]
    wrap_parameters :game

    def roles
      user = logged_in_user
      render json: {
        roles: user.roles.map do |role|
          position = role.get('..')
          name = position.entries.find_by(child: role).name
          next { position: position, name: name, id: role.id }
        end
      } 
    end

    def act
      type = ActionType.find_by(name: params[:name])
      render json: { error: 'Unknown action' }, status: :bad_request and return unless type
      begin
        Action.make(type, @subject, params[:object_path], params[:target_path], params[:data])
      rescue ArgumentError => e
        render json: { error: e.message }, status: :bad_request
      end
    end

    def tree
      path = params[:path] || ''
      begin
        render json: resolve_path(path.split '/').serialize
      rescue ArgumentError => e
        render json: { error: e.message }, status: :bad_request
      end
    end

    def node
      path = params[:path] || ''
      begin
        render json: resolve_path(path.split '/').serialize_short
      rescue ArgumentError => e
        render json: { error: e.message }, status: :bad_request
      end
    end
    
    private
      def resolve_path(path)
        root_path = @subject.resolve_path(path)
        root_path.unshift @subject
        root_path.last
      end

      def get_role
        user_roles = logged_in_user.roles
        role_id = params[:role]
        @subject = role_id ? user_roles.find_by(id: role_id) : user_roles.first
        render json: { error: 'No roles or invalid role_id' }, status: :bad_request unless @subject
      end
  end
end