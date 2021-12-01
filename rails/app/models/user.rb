class User < ApplicationRecord
  has_secure_password
  has_and_belongs_to_many :roles, class_name: 'Game::Role', join_table: :roles_users, inverse_of: :users, autosave: true
  
end
