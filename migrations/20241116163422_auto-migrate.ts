import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('setting'))) {
    await knex.schema.createTable('setting', table => {
      table.increments('id')
      table.enum('default_state', ['forward', 'block']).nullable()
      table.timestamps(false, true)
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('setting')
}
