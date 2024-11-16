import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('domain'))) {
    await knex.schema.createTable('domain', table => {
      table.increments('id')
      table.text('domain').notNullable().unique()
      table.enum('state', ['forward', 'block']).nullable()
      table.timestamps(false, true)
    })
  }

  if (!(await knex.schema.hasTable('request'))) {
    await knex.schema.createTable('request', table => {
      table.increments('id')
      table.integer('domain_id').unsigned().notNullable().references('domain.id')
      table.integer('timestamp').notNullable()
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('request')
  await knex.schema.dropTableIfExists('domain')
}
