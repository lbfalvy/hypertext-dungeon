# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2021_11_24_164749) do

  create_table "action_types", force: :cascade do |t|
    t.string "name"
    t.boolean "can_target"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["name"], name: "index_action_types_on_name"
  end

  create_table "action_types_game_objects", id: false, force: :cascade do |t|
    t.integer "game_object_id", null: false
    t.integer "action_type_id", null: false
    t.index ["action_type_id"], name: "index_action_types_game_objects_on_action_type_id"
    t.index ["game_object_id"], name: "index_action_types_game_objects_on_game_object_id"
  end

  create_table "entries", force: :cascade do |t|
    t.integer "parent_id", null: false
    t.string "name"
    t.boolean "hidden"
    t.integer "child_id", null: false
    t.index ["child_id"], name: "index_entries_on_child_id"
    t.index ["parent_id"], name: "index_entries_on_parent_id"
  end

  create_table "game_objects", force: :cascade do |t|
    t.string "type"
    t.integer "version"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "roles_users", force: :cascade do |t|
    t.integer "role_id", null: false
    t.integer "user_id", null: false
    t.index ["role_id"], name: "index_roles_users_on_role_id"
    t.index ["user_id"], name: "index_roles_users_on_user_id"
  end

  create_table "targets_actions", force: :cascade do |t|
    t.integer "game_object_id", null: false
    t.integer "action_type_id", null: false
    t.index ["action_type_id"], name: "index_targets_actions_on_action_type_id"
    t.index ["game_object_id"], name: "index_targets_actions_on_game_object_id"
  end

  create_table "tokens", force: :cascade do |t|
    t.string "user"
    t.string "token"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "users", force: :cascade do |t|
    t.string "username"
    t.string "password_digest"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  add_foreign_key "entries", "game_objects", column: "child_id", on_delete: :cascade
  add_foreign_key "entries", "game_objects", column: "parent_id", on_delete: :cascade
  add_foreign_key "roles_users", "game_objects", column: "role_id", on_delete: :cascade
  add_foreign_key "roles_users", "users", on_delete: :cascade
  add_foreign_key "targets_actions", "game_objects", column: "action_type_id", on_delete: :cascade
  add_foreign_key "targets_actions", "game_objects", on_delete: :cascade
end
