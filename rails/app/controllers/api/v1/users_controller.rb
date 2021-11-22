module Api::V1
    class UsersController < SessionController
        before_action :authorized, only: [:auto_login]

        def authenticate
            @user = User.find_by(username: params[:username])
            if @user && @user.authenticate(params[:password])
                render json: generate_tokens(params[:username])
            else
                render json: { error: 'Invalid credentials' }
            end
        end

        def create
            @user = User.create(user_params)
            if @user.valid?
                @user.save
                render json: generate_tokens(@user.username)
            else
                render json: { error: 'Invalid username or password' }
            end
        end

        def read
        end

        def auto_login
            logged_in_user
            render json: { username: @user.username }
        end
    end
end