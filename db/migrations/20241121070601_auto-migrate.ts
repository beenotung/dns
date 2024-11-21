import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `domain` add column `count` integer null')
  await knex.raw(/* sql */`
  update domain
  set count = (
    select count(*)
    from dns_request
    where dns_request.domain_id = domain.id
  )
  `)
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `domain` drop column `count`')
}
