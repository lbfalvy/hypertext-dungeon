module Tokens
  # Encodes and signs a JWT with the specified +payload+ and +timeout+
  # +timeout+ is measured in minutes
  def self.encode(payload, timeout = -1)
    exp = Time.now.to_i + timeout * 60
    data = timeout < 0 ? payload : { exp: exp }.merge(payload)
    JWT.encode(data, Rails.configuration.jwt_secret)
  end

  # Decode a signed JWT or return nil
  def self.decode(token)
    begin
      JWT.decode(token, Rails.configuration.jwt_secret, true, algorythm: 'HS256')[0]
    rescue JWT::DecodeError => error
      nil
    end
  end
end