module ApplicationCable
  class Connection < ActionCable::Connection::Base
    # identified_by :token

    # Quickly check the token, this will be the starting value for the channel
    def connect
      # token = request.headers[:HTTP_SEC_WEBSOCKET_PROTOCOL].split(' ').last
      # self.token = Tokens.decode(token)
      # reject_unauthorized_connection unless self.token && (self.username = self.token["username"])
    end
  end
end
