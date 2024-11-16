import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('dns_request_type'))) {
    await knex.schema.createTable('dns_request_type', table => {
      table.increments('id')
      table.text('type').notNullable().unique()
      table.integer('count').notNullable()
      table.integer('last_seen').notNullable()
      table.timestamps(false, true)
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
  await knex.schema.dropTableIfExists('dns_request_type')
}
