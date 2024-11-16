import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('request')

  if (!(await knex.schema.hasTable('dns_request'))) {
    await knex.schema.createTable('dns_request', table => {
      table.increments('id')
      table.integer('domain_id').unsigned().notNullable().references('domain.id')
      table.integer('timestamp').notNullable()
    })
  }
  {
    const rows = await knex.select('id', 'default_state').from('setting')
    await knex.raw('alter table `setting` drop column `default_state`')
    await knex.raw("alter table `setting` add column `default_state` text null check(`default_state` in ('forward','block'))")
    for (let row of rows) {
      await knex('setting').update({ default_state: row.default_state }).where({ id: row.id })
    }
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  {
    const rows = await knex.select('id', 'default_state').from('setting')
    await knex.raw('alter table `setting` drop column `default_state`')
    await knex.raw("alter table `setting` add column `default_state` text null default _state")
    for (let row of rows) {
      await knex('setting').update({ default_state: row.default_state }).where({ id: row.id })
    }
  }
  await knex.schema.dropTableIfExists('dns_request')

  if (!(await knex.schema.hasTable('request'))) {
    await knex.schema.createTable('request', table => {
      table.increments('id')
      table.integer('domain_id').unsigned().notNullable().references('domain.id')
      table.integer('timestamp').notNullable()
    })
  }
}
