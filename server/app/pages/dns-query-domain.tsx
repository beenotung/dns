import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import { find } from 'better-sqlite3-proxy'
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
import { default_state } from '../../proxy/filter.js'
import { Button } from '../components/button.js'
import { HOUR } from '@beenotung/tslib/time.js'
import { LastSeen } from '../components/last-seen.js'

let pageTitle = 'DNS Query Domain'
let addPageTitle = 'Add DNS Query Domain'

let style = Style(/* css */ `
#DnsQueryDomain table {
  border-collapse: collapse;
}
#DnsQueryDomain table th,
#DnsQueryDomain table td {
  border: 1px solid black;
  padding: 0.5rem;
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

let items = [
  { title: 'Android', slug: 'md' },
  { title: 'iOS', slug: 'ios' },
]

type Row = {
  domain: string
  state: null | 'forward' | 'block'
  last_seen: number
  count: number
}
let select_domain = db.prepare<
  { state: 'all' | 'default' | 'block' | 'forward' },
  Row
>(/* sql */ `
select
  domain.domain
, domain.state
, max(dns_request.timestamp) as last_seen
, count(dns_request.id) as count
from dns_request
inner join domain on dns_request.domain_id = domain.id
where domain.state = @state
   or @state = 'all'
   or (@state = 'default' and domain.state is null)
group by domain.id
order by last_seen desc
`)

function RowItem(row: Row, now: number) {
  let state = row.state
  return (
    <tr data-id={row.domain} data-state={state || 'default'}>
      <td>
        <div class="controls">
          {state !== 'forward' ? (
            <Button url={`/unblock/${row.domain}`}>unblock</Button>
          ) : null}
          {state !== 'block' ? (
            <Button url={`/block/${row.domain}`}>block</Button>
          ) : null}
        </div>
      </td>
      <td>{state || 'default'}</td>
      <td>{row.domain}</td>
      <td>{row.count}</td>
      <td>
        <LastSeen time={row.last_seen} now={now} />
      </td>
    </tr>
  )
}

let select_stats = db.prepare<
  void[],
  { state: Domain['state']; count: number }
>(/* sql */ `
select
  state
, count(id) as count
from domain
group by state
order by count desc
`)

function Stats() {
  let rows = select_stats.all()
  let all_count = rows.reduce((a, b) => a + b.count, 0)
  return (
    <table>
      <thead>
        <tr>
          <th>State</th>
          <th>Domain Count</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <Link href={`/dns-query-domain?state=all`}>all</Link>
          </td>
          <td>{all_count}</td>
        </tr>
        {mapArray(rows, row => {
          let state = row.state || 'default'
          return (
            <tr>
              <td>
                <Link href={`/dns-query-domain?state=${state}`}>{state}</Link>
              </td>
              <td>{row.count}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
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
  let state =
    (params.get('state') as 'all' | 'default' | 'block' | 'forward') || 'all'
  let now = Date.now()
  let rows = select_domain.all({ state })
  return (
    <>
      <Stats />
      <p>Remark: default state is "{default_state}".</p>
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
        {mapArray(rows, row => RowItem(row, now))}
      </table>
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

function AddPage(attrs: {}, context: DynamicContext) {
  let user = getAuthUser(context)
  if (!user) return <Redirect href="/login" />
  return addPage
}

let submitParser = object({
  title: string({ minLength: 3, maxLength: 50 }),
  slug: string({ match: /^[\w-]{1,32}$/ }),
})

function Submit(attrs: {}, context: DynamicContext) {
  try {
    let user = getAuthUser(context)
    if (!user) throw 'You must be logged in to submit ' + pageTitle
    let body = getContextFormBody(context)
    let input = submitParser.parse(body)
    let id = items.push({
      title: input.title,
      slug: input.slug,
    })
    return <Redirect href={`/dns-query-domain/result?id=${id}`} />
  } catch (error) {
    throwIfInAPI(error, '#add-message', context)
    return (
      <Redirect
        href={
          '/dns-query-domain/result?' +
          new URLSearchParams({ error: String(error) })
        }
      />
    )
  }
}

function SubmitResult(attrs: {}, context: DynamicContext) {
  let params = new URLSearchParams(context.routerMatch?.search)
  let error = params.get('error')
  let id = params.get('id')
  return (
    <div>
      {error ? (
        renderError(error, context)
      ) : (
        <>
          <p>Your submission is received (#{id}).</p>
          <p>
            Back to <Link href="/dns-query-domain">{pageTitle}</Link>
          </p>
        </>
      )}
    </div>
  )
}

function Block(attrs: {}, context: DynamicContext) {
  updateDomainState(context, 'block')
  return page
}

function Unblock(attrs: {}, context: DynamicContext) {
  updateDomainState(context, 'forward')
  return page
}

function updateDomainState(
  context: DynamicContext,
  state: 'forward' | 'block',
) {
  let user = getAuthUser(context)
  if (!user) throw 'You must be logged in to block a domain'
  if (!user.is_admin) throw 'Only admin is allowed to block a domain'
  let domain = context.routerMatch?.params.domain
  let row = find(proxy.domain, { domain })
  if (!row) throw 'Domain not found'
  row.state = state
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
  '/dns-query-domain/add': {
    title: title(addPageTitle),
    description: 'TODO',
    node: <AddPage />,
    streaming: false,
  },
  '/dns-query-domain/add/submit': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <Submit />,
    streaming: false,
  },
  '/dns-query-domain/result': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <SubmitResult />,
    streaming: false,
  },
} satisfies Routes

export default { routes }
