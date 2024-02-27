import { Header, Page } from '@bacondotbuild/ui'

import Meta from '@/components/meta'

const DEFAULT_TITLE = 'todo'

const Layout = ({
  title = DEFAULT_TITLE,
  children,
}: {
  title?: string
  children: React.ReactNode
}) => {
  return (
    <Page>
      <Meta
        title={title === DEFAULT_TITLE ? title : `${title} - ${DEFAULT_TITLE}`}
      />
      <Header>{title}</Header>
      {children}
    </Page>
  )
}

export default Layout
