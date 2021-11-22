module ApplicationCable
  class Channel < ActionCable::Channel::Base
    def subscribed
      @token = @connection.token
      @user = User.find_by(username: @connection.username)
      stream_for @user do |message|
        disconnect_if_expired
        transmit message
      end
    end

    def token(data)
      @token = data[:token]
    end

    private
    def token
      @token
    end

    def token=(value)
      @token = helpers.decode_token(value)
      @connection.close('invalid token') and return unless @token
      @connection.close('user switching', true) and return unless @token.username == @username
      @expires = @token.exp
      disconnect_if_expired
    end

    def disconnect_if_expired
      if !@expires || @expires < time.now.to_i
        @connection.close('token expired', false)
      end
    end
  end
end
