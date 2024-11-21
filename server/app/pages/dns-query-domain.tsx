import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import { find, seedRow } from 'better-sqlite3-proxy'
import {
  Context,
  DynamicContext,
  getContextFormBody,
  throwIfInAPI,
} from '../context.js'
import { mapArray } from '../components/fragment.js'
import { object, string } from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import { Domain, proxy } from '../../../db/proxy.js'
import DateTimeText from '../components/datetime.js'
import { db } from '../../../db/db.js'
import { default_state, filterByPattern } from '../../proxy/filter.js'
import { Button } from '../components/button.js'
import { DAY, HOUR } from '@beenotung/tslib/time.js'
import { LastSeen } from '../components/last-seen.js'
import { nodeToVNode } from '../jsx/vnode.js'
import { MessageException } from '../../exception.js'

let pageTitle = 'DNS Query Domain'
let addPageTitle = 'Add DNS Query Domain'

let cutoff_interval = 1 * DAY

let style = Style(/* css */ `
#DnsQueryDomain table {
  border-collapse: collapse;
}
#DnsQueryDomain table th,
#DnsQueryDomain table td {
  border: 1px solid black;
  padding: 0.5rem;
  vertical-align: top;
}
#DnsQueryDomain table tr[data-state="block"] {
  background-color: #ffdddd55;
}
#DnsQueryDomain table tr[data-state="forward"] {
  background-color: #ddffdd88;
}
#DnsQueryDomain table tr[data-state="default"] {
  background-color: #ffffdd88;
}
#DnsQueryDomain table tr td .controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
#DnsQueryDomain table ul {
  margin: 0.5rem 0;
  padding-inline-start: 1.5rem;
}
#DnsQueryDomain a.selected {
  font-weight: bold;
}
`)

let page = (
  <>
    {style}
    <div id="DnsQueryDomain">
      <h1>{pageTitle}</h1>
      <Main />
    </div>
  </>
)

type DomainRow = {
  id: number
  domain: string
  state: null | 'forward' | 'block'
  last_seen: number
  count: number
}
let select_domain = db.prepare<
  {
    state: 'all' | 'default' | 'block' | 'forward'
    last_seen_cutoff: number
  },
  DomainRow
>(/* sql */ `
select
  id
, domain
, state
, last_seen
, count
from domain
where last_seen >= :last_seen_cutoff
  and ( state = @state
     or @state = 'all'
     or (@state = 'default' and state is null)
  )
order by last_seen desc
`)

function DomainItem(row: DomainRow, now: number) {
  let state: 'default' | 'block' | 'forward' | null = row.state
  let label: string
  if (state) {
    label = state
  } else {
    state = filterByPattern(row.domain)
    if (state) {
      label = state + ' (pattern)'
    } else {
      state = 'default'
      label = 'default'
    }
  }
  return (
    <tr data-id={row.id} data-state={state}>
      <td>
        <div class="controls">
          {row.state !== 'forward' ? (
            <Button url={`/unblock/${row.domain}`}>unblock</Button>
          ) : null}
          {row.state !== 'block' ? (
            <Button url={`/block/${row.domain}`}>block</Button>
          ) : null}
        </div>
      </td>
      <td data-field="state">{label}</td>
      <td>{row.domain}</td>
      <td>{row.count}</td>
      <td>
        <LastSeen time={row.last_seen} now={now} />
      </td>
    </tr>
  )
}

function PatternItem(row: PatternItem, now: number) {
  let state = row.state
  return (
    <tr data-id={row.id} data-state={state || 'default'}>
      <td>
        <div class="controls">
          {state !== 'forward' ? (
            <Button url={`/unblock/${row.pattern}`}>unblock</Button>
          ) : null}
          {state !== 'block' ? (
            <Button url={`/block/${row.pattern}`}>block</Button>
          ) : null}
        </div>
      </td>
      <td data-field="state">{state || 'default'}</td>
      <td>
        <details>
          <summary>
            {row.pattern} ({row.domains.length})
          </summary>
          <ul>
            {mapArray(row.domains, row => (
              <li>
                {row.domain}
                <br />
                {row.count} | <LastSeen time={row.last_seen} now={now} />
              </li>
            ))}
          </ul>
        </details>
      </td>
      <td>{row.count}</td>
      <td>
        <LastSeen time={row.last_seen} now={now} />
      </td>
    </tr>
  )
}

let select_stats = db.prepare<
  void[],
  { state: NonNullable<Domain['state']>; count: number }
>(/* sql */ `
select
  state
, count(id) as count
from domain
where state is not null
group by state
`)

let select_default_domain = db
  .prepare<void[], string>(
    /* sql */ `
select domain
from domain
where state is null
`,
  )
  .pluck()

type ViewState = 'all' | 'default' | 'block' | 'forward'

function Stats(attrs: { params: URLSearchParams; state: ViewState }) {
  let { params } = attrs
  let rows = select_stats.all()

  let default_count = 0
  let pattern_block_count = 0
  let pattern_forward_count = 0
  for (let domain of select_default_domain.all()) {
    let state = filterByPattern(domain)
    if (state === 'block') pattern_block_count++
    else if (state === 'forward') pattern_forward_count++
    else default_count++
  }

  let all_count =
    rows.reduce((a, b) => a + b.count, 0) +
    pattern_block_count +
    pattern_forward_count

  type Items = {
    label: string
    state: ViewState
    count: number
  }
  let items: Items[] = [
    {
      label: 'all',
      state: 'all',
      count: all_count,
    },
    {
      label: 'default',
      state: 'default',
      count: default_count,
    },
    {
      label: 'block (pattern)',
      state: 'default',
      count: pattern_block_count,
    },
    {
      label: 'forward (pattern)',
      state: 'default',
      count: pattern_forward_count,
    },
    ...rows.map(row => ({
      label: row.state,
      state: row.state,
      count: row.count,
    })),
  ]
  items.sort((a, b) => b.count - a.count)

  return (
    <table>
      <thead>
        <tr>
          <th>State</th>
          <th>Domain Count</th>
        </tr>
      </thead>
      <tbody>
        {mapArray(items, row => {
          let state = row.state
          params.set('state', state)
          let state_link = `/dns-query-domain?${params}`
          return (
            <tr>
              <td>
                <Link
                  href={state_link}
                  class={state == attrs.state ? 'selected' : undefined}
                >
                  {row.label}
                </Link>
              </td>
              <td>{row.count}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

type PatternRow = {
  id: number
  pattern: string
  state: Domain['state']
}
let select_pattern = db.prepare<void[], PatternRow>(/* sql */ `
select
  id
, pattern
, state
from pattern
`)

type PatternItem = {
  id: number
  pattern: string
  domains: DomainRow[]
  state: null | 'forward' | 'block'
  last_seen: number
  count: number
}

function Patterns(attrs: { rows: DomainRow[] }) {
  // pattern -> PatternItem
  let patternItems: Record<string, PatternItem> = {}

  // pattern -> PatternRow
  let patternRows = Object.fromEntries(
    select_pattern.all().map(row => [row.pattern, row]),
  )

  function addPattern(pattern: string, domain: DomainRow) {
    let item = patternItems[pattern]
    if (!item) {
      let row = patternRows[pattern]
      if (!row) {
        let id =
          find(proxy.pattern, { pattern })?.id ||
          proxy.pattern.push({ pattern, state: null })
        row = { id, pattern, state: null }
        patternRows[pattern] = row
      }
      item = {
        id: row.id,
        pattern,
        domains: [domain],
        state: row.state,
        last_seen: domain.last_seen,
        count: domain.count,
      }
      patternItems[pattern] = item
    } else {
      item.domains.push(domain)
      item.last_seen = Math.max(item.last_seen, domain.last_seen)
      item.count += domain.count
    }
  }

  for (let row of attrs.rows) {
    let domain = row.domain
    let parts = domain.split('.')
    addPattern(parts[0] + '.*', row)
    for (let i = 1; i < parts.length - 1; i++) {
      addPattern('*.' + parts.slice(i).join('.'), row)
    }
  }

  let items = Object.values(patternItems).sort((a, b) => {
    let res = b.last_seen - a.last_seen
    if (res == 0) res = b.count - a.count
    return res
  })
  let now = Date.now()

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Control</th>
            <th>State</th>
            <th>Pattern</th>
            <th>Count</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>{mapArray(items, row => PatternItem(row, now))}</tbody>
      </table>
    </>
  )
}

function Domains(attrs: { rows: DomainRow[] }) {
  let now = Date.now()
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Control</th>
            <th>State</th>
            <th>Domain</th>
            <th>Count</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        {mapArray(attrs.rows, row => DomainItem(row, now))}
      </table>
    </>
  )
}

function Main(attrs: {}, context: DynamicContext) {
  let user = getAuthUser(context)
  if (!user) {
    return (
      <p>
        You can view domain logs after <Link href="/login">login</Link>.
      </p>
    )
  }
  if (!user.is_admin) {
    return <p>Only admin is allowed to view this page.</p>
  }
  let params = new URLSearchParams(context.routerMatch?.search)

  let state = (params.get('state') as ViewState) || 'all'

  let view = (params.get('view') as 'domain' | 'pattern') || 'domain'

  params.set('view', 'domain')
  let view_domain_link = `/dns-query-domain?${params}`

  params.set('view', 'pattern')
  let view_pattern_link = `/dns-query-domain?${params}`

  params.set('view', view)

  let now = Date.now()
  let last_seen_cutoff = now - cutoff_interval
  let rows = select_domain.all({ state, last_seen_cutoff })
  return (
    <>
      <Stats params={params} state={state} />
      <p>Remark: default state is "{default_state}".</p>
      <p>
        <Link
          href={view_domain_link}
          class={view == 'domain' ? 'selected' : undefined}
        >
          domains
        </Link>
        {' | '}
        <Link
          href={view_pattern_link}
          class={view == 'pattern' ? 'selected' : undefined}
        >
          patterns
        </Link>
      </p>
      {view === 'domain' ? <Domains rows={rows} /> : <Patterns rows={rows} />}
    </>
  )
}

let addPage = (
  <div id="AddDnsQueryDomain">
    {Style(/* css */ `
#AddDnsQueryDomain .field {
  margin-block-end: 1rem;
}
#AddDnsQueryDomain .field label input {
  display: block;
  margin-block-start: 0.25rem;
}
#AddDnsQueryDomain .field label .hint {
  display: block;
  margin-block-start: 0.25rem;
}
`)}
    <h1>{addPageTitle}</h1>
    <form
      method="POST"
      action="/dns-query-domain/add/submit"
      onsubmit="emitForm(event)"
    >
      <div class="field">
        <label>
          Title*:
          <input name="title" required minlength="3" maxlength="50" />
          <p class="hint">(3-50 characters)</p>
        </label>
      </div>
      <div class="field">
        <label>
          Slug*:
          <input
            name="slug"
            required
            placeholder="should be unique"
            pattern="(\w|-|\.){1,32}"
          />
          <p class="hint">
            (1-32 characters of: <code>a-z A-Z 0-9 - _ .</code>)
          </p>
        </label>
      </div>
      <input type="submit" value="Submit" />
      <p>
        Remark:
        <br />
        *: mandatory fields
      </p>
      <p id="add-message"></p>
    </form>
  </div>
)

function Block(attrs: {}, context: DynamicContext) {
  return updateDomainState(context, 'block')
}

function Unblock(attrs: {}, context: DynamicContext) {
  return updateDomainState(context, 'forward')
}

function updateDomainState(
  context: DynamicContext,
  state: 'forward' | 'block',
): never {
  let user = getAuthUser(context)
  if (!user) throw 'You must be logged in to block a domain'
  if (!user.is_admin) throw 'Only admin is allowed to block a domain'
  let domain = context.routerMatch?.params.domain
  if (!domain) throw 'no domain specified'
  let row = getRow()
  function getRow() {
    if (!domain.includes('*')) {
      let id = seedRow(proxy.domain, { domain })
      return proxy.domain[id]
    } else {
      let id = seedRow(proxy.pattern, { pattern: domain })
      return proxy.pattern[id]
    }
  }
  row.state = state
  throw new MessageException([
    'batch',
    [
      ['update-attrs', `[data-id="${row.id}"]`, { 'data-state': state }],
      ['update-text', `[data-id="${row.id}"] [data-field="state"]`, state],
      [
        'update-in',
        `[data-id="${row.id}"] .controls`,
        nodeToVNode(
          <>
            {state !== 'forward' ? (
              <Button url={`/unblock/${domain}`}>unblock</Button>
            ) : null}
            {state !== 'block' ? (
              <Button url={`/block/${domain}`}>block</Button>
            ) : null}
          </>,
          context,
        ),
      ],
    ],
  ])
}

let routes = {
  '/dns-query-domain': {
    title: title(pageTitle),
    description: 'TODO',
    menuText: pageTitle,
    node: page,
  },
  '/block/:domain': {
    title: apiEndpointTitle,
    description: 'block a domain',
    node: <Block />,
  },
  '/unblock/:domain': {
    title: apiEndpointTitle,
    description: 'unblock a domain',
    node: <Unblock />,
  },
} satisfies Routes

export default { routes }
