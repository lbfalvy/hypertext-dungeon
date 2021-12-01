module Api
  class V1::SessionController < ApiController
    before_action :authorized, except: [:refresh]

    # Produce a new valid token pair
    def generate_tokens(username)
      refresh_token = Tokens::encode({ type: :refresh, username: username })
      Token.create(user: username, token: refresh_token)
      api_key = create_auth_token(username, 5)
      return { token: api_key, refresh: refresh_token }
    end

    # Endpoint for token renewal
    def refresh
      token = auth_token
      unless token
        render json: { error: 'no valid token' }, status: :unauthorized and return
      end
      unless token['type'] == 'refresh'
        render json: { error: 'not a refresh token' }, status: :unauthorized and return
      end
      token_record = Token.find_by(token: bearer)
      # If a record with this token is not found, it must have been stolen.
      unless token_record
        Token.where(user: token['username']).destroy_all
        render json: { error: 'token reuse' }, status: :unauthorized and return
      end
      # Replace token in the database with a new pair
      token_record.destroy
      new_pair = generate_tokens(token['username'])
      render json: new_pair
    end
  end
end