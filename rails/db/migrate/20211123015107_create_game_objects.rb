class CreateGameObjects < ActiveRecord::Migration[6.1]
  def change
    create_table :game_objects do |t|
      t.string :type
      t.numeric :version
      t.timestamps
    end
    create_table :entries do |t|
      t.references :parent, null: false, index: true, foreign_key: {to_table: :game_objects, on_delete: :cascade}
      t.string :name
      t.boolean :hidden
      t.references :child, null: false, index: true, foreign_key: {to_table: :game_objects, on_delete: :cascade}
    end
  end
end
