module Game
  class Box < GameObject
    include Mixins::Storage
    include Mixins::Movable
  end
end