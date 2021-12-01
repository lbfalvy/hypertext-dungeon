class CreateActionTypes < ActiveRecord::Migration[6.1]
  def change
    create_table :action_types do |t|
      t.string :name, index: true
      t.boolean :can_target
      t.timestamps
    end
    create_table :targets_actions do |t|
      t.references :game_object, null: false, index: true, foreign_key: {to_table: :game_objects, on_delete: :cascade}
      t.references :action_type, null: false, index: true, foreign_key: {to_table: :game_objects, on_delete: :cascade}
    end
    create_join_table :game_objects, :action_types do |t|
      t.index :game_object_id
      t.index :action_type_id
    end
  end
end
