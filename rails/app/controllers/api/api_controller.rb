class Api::ApiController < ActionController::API
  before_action :authorized

  # Produce a valid auth token
  def create_auth_token(username, timeout = 5)
    return Tokens::encode({ username: username, type: :auth }, timeout)
  end

  # Obtain the token used with Bearer authentication
  def bearer
    auth = request.headers['Authorization']
    if auth
      parts = auth.split(' ')
      if parts[0] == 'Bearer'
        parts[1]
      else nil end
    end
  end

  # Is Bearer auth used?
  def bearer?
    !!bearer
  end

  # The JWT used with Bearer auth
  def auth_token
    Tokens::decode(bearer) if bearer?
  end
  
  # Does the request contain a valid auth token?
  def logged_in?
    token = auth_token
    if token
      token['type'] == 'auth'
    else nil end
  end

  # Short-circuit the request unless the token is valid
  def authorized
    render json: { error: 'unauthorized' }, status: :unauthorized unless logged_in?
  end

  # The user referenced by the token
  def logged_in_user
    if logged_in?
      token = auth_token
      name = token['username']
      @user = User.find_by(username: name)
    end
  end
end