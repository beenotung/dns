import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
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
import { proxy } from '../../../db/proxy.js'
import DateTimeText from '../components/datetime.js'
import { db } from '../../../db/db.js'
import { default_state } from '../../proxy/filter.js'

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

let select_domain = db.prepare<
  void[],
  {
    domain: string
    state: null | 'forward' | 'block'
    last_seen: number
  }
>(/* sql */ `
select
  domain.domain
, domain.state
, max(dns_request.timestamp) as last_seen
from dns_request
inner join domain on dns_request.domain_id = domain.id
group by domain.id
order by last_seen desc
`)

function Main(attrs: {}, context: Context) {
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
  let rows = select_domain.all()
  return (
    <>
      <p>Remark: default state is "{default_state}".</p>
      <table>
        <thead>
          <tr>
            <th>Control</th>
            <th>Domain</th>
            <th>State</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        {mapArray(rows, row => {
          return (
            <tr>
              <td>
                <button>block</button>
                <button>forward</button>
              </td>
              <td>{row.domain}</td>
              <td>{row.state || default_state + ' (default)'}</td>
              <td>
                <DateTimeText time={row.last_seen} />
              </td>
            </tr>
          )
        })}
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

let routes = {
  '/dns-query-domain': {
    title: title(pageTitle),
    description: 'TODO',
    menuText: pageTitle,
    node: page,
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
