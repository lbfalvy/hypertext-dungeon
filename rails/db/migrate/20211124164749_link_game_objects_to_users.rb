class LinkGameObjectsToUsers < ActiveRecord::Migration[6.1]
  def change
    create_table :roles_users do |t|
      t.references :role, null: false, index: true, foreign_key: {to_table: :game_objects, on_delete: :cascade}
      t.references :user, null: false, index: true, foreign_key: {to_table: :users, on_delete: :cascade}
    end
  end
end
