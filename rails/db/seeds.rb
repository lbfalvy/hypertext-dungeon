# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

root = User.create(username: 'root', password: '0000')

lounge = Game::Room.create
wardrobe = Game::Box.create
box = Game::Box.create
wardrobe.set('weapons', box)
box.set('..', wardrobe)
lounge.set('wardrobe', wardrobe)
wardrobe.set('..', lounge)
root_role = Game::Role.for_player(root, lounge)