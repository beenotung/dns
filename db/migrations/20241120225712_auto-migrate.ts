import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('pattern'))) {
    await knex.schema.createTable('pattern', table => {
      table.increments('id')
      table.text('pattern').notNullable().unique()
      table.enum('state', ['forward', 'block']).nullable()
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
    await knex.raw("alter table `setting` add column `default_state` text null")
    for (let row of rows) {
      await knex('setting').update({ default_state: row.default_state }).where({ id: row.id })
    }
  }
  await knex.schema.dropTableIfExists('pattern')
}
