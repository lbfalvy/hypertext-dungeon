class MainChannel < ActionCable::Channel::Base
  def subscribed
    token = Tokens.decode(params[:token])
    # @token = @connection.token
    expires = token['exp']
    # @user = User.find_by(username: @token['username'])
    stream_name = "user:#{token['username']}"
    logger.debug "Streaming from #{stream_name}"
    stream_from stream_name do |message|
      if expires < Time.now.to_i
        stop_all_streams
        transmit({ expired: params["token"] })
        return
      end
      logger.debug "Stream #{stream_name} relaying message #{message}"
      transmit message
    end
  end
end