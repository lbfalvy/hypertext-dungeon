Rails.application.routes.draw do
    namespace :api do
        namespace :v1 do
            post 'session/refresh'
            post 'users/authenticate'
            post 'users/create'
            get 'users/auto_login'
        end
    end
    root 'index#index', via: :all
    match '*path', to: 'index#index', via: :all
end
