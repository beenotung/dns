import { o } from '../jsx/jsx.js'
import { prerender } from '../jsx/html.js'
import SourceCode from '../components/source-code.js'
import { Routes } from '../routes.js'
import { title } from '../../config.js'
import Style from '../components/style.js'
import { Locale, isPreferZh } from '../components/locale.js'
import { Link } from '../components/router.js'

// Calling <Component/> will transform the JSX into AST for each rendering.
// You can reuse a pre-compute AST like `let component = <Component/>`.

// If the expression is static (not depending on the render Context),
// you don't have to wrap it by a function at all.

let style = Style(/* css */ `
`)

let content = (
  <div id="home">
    <h1>
      <Locale en="Home Page" zh="首頁" />
    </h1>

    <p>
      <Locale
        en="A DNS proxy server that logs and filters domain names before forwarding them to an upstream DNS server."
        zh="一個 DNS 代理伺服器，會記錄和過濾請求的網域名稱，然後再轉發給上游 DNS 伺服器。"
      />
    </p>

    <p>
      <Locale en="Check recent logs: " zh="檢查最近請求的紀錄: " />
      <Link href="/dns-query-type">
        <Locale en="Query Types" zh="查詢類型" />
      </Link>
      {', '}
      <Link href="/dns-query-domain">
        <Locale en="Domains" zh="網域" />
      </Link>
    </p>

    <SourceCode page="home.tsx" />
  </div>
)

let home = (
  <>
    {style}
    {content}
  </>
)

// And it can be pre-rendered into html as well
let content_en = prerender(home, { language: 'en' })
let content_zh = prerender(home, { language: 'zh' })

let routes = {
  '/': {
    menuText: <Locale en="Home" zh="主頁" />,
    resolve(context) {
      let zh = isPreferZh(context)
      return {
        title: title(zh ? '首頁' : 'Home'),
        description: zh
          ? '開始使用 ts-liveview - 一個具有漸進增強功能的伺服器端渲染即時網頁應用框架'
          : 'Getting Started with ts-liveview - a server-side rendering realtime webapp framework with progressive enhancement',
        node: zh ? content_zh : content_en,
      }
    },
  },
} satisfies Routes

export default { routes }
