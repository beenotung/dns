import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `domain` add column `last_seen` integer null')
  await knex.raw(/* sql */`
  update domain
  set last_seen = (
    select max(dns_request.timestamp)
    from dns_request
    where dns_request.domain_id = domain.id
  )
  `)
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `domain` drop column `last_seen`')
}
