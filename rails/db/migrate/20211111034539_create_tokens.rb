class CreateTokens < ActiveRecord::Migration[6.1]
  def change
    create_table :tokens do |t|
      t.string :user
      t.string :token

      t.timestamps
    end
  end
end
