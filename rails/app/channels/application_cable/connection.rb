module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :username

    # Quickly check the token, this will be the starting value for the channel
    def connect
      token = request.headers[:HTTP_SEC_WEBSOCKET_PROTOCOL].split(' ').last
      self.token = helpers.decode_token(token)
      self.username = self.token["username"]
      unless self.username = obtain_username
        reject_unauthorized_connection
      end
    end
  end
end
