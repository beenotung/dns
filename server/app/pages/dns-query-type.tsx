import { o } from '../jsx/jsx.js'
import { unProxy } from 'better-sqlite3-proxy'
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

let pageTitle = 'DNS Query Type'

let style = Style(/* css */ `
#DnsQueryType table {
  border-collapse: collapse;
}
#DnsQueryType table th,
#DnsQueryType table td {
  border: 1px solid black;
  padding: 0.5rem 1rem;
}
`)

let page = (
  <>
    {style}
    <div id="DnsQueryType">
      <h1>{pageTitle}</h1>
      <Main />
    </div>
  </>
)

function Main(attrs: {}, context: Context) {
  let user = getAuthUser(context)
  let items = unProxy(proxy.dns_request_type)
  items.sort((a, b) => b.last_seen - a.last_seen)
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Forward</th>
            <th>Count</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        {mapArray(items, item => (
          <tr>
            <td>{item.type}</td>
            <td>{item.forward ? 'Yes' : 'No'}</td>
            <td>{item.count}</td>
            <td>
              <DateTimeText time={item.last_seen} />
            </td>
          </tr>
        ))}
      </table>
      {user ? null : (
        <p>
          You can add dns query type after{' '}
          <Link href="/register">register</Link>.
        </p>
      )}
    </>
  )
}

let routes = {
  '/dns-query-type': {
    title: title(pageTitle),
    description: 'TODO',
    menuText: pageTitle,
    node: page,
  },
} satisfies Routes

export default { routes }
