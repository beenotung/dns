import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `dns_request` add column `type_id` integer null references `dns_request_type`(`id`)')
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `dns_request` drop column `type_id`')
}
