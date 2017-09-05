import advanced from 'elm-factory/guides/advanced.md'
import buildingForProduction from 'elm-factory/guides/building-for-production.md'
import cliUsage from 'elm-factory/guides/cli-usage.md'
import configuration from 'elm-factory/guides/configuration.md'
import gettingStarted from 'elm-factory/guides/getting-started.md'
import templating from 'elm-factory/guides/templating.md'
import theDevServer from 'elm-factory/guides/the-dev-server.md'

export default [
  {
    file: 'getting-started.md',
    slug: 'getting-started',
    title: 'Getting Started',
    text: gettingStarted,
  },
  {
    file: 'the-dev-server.md',
    slug: 'the-dev-server',
    title: 'The Dev Server',
    text: theDevServer,
  },
  {
    file: 'building-for-production.md',
    slug: 'building-for-production',
    title: 'Building For Production',
    text: buildingForProduction,
  },
  {
    file: 'templating.md',
    slug: 'templating',
    title: 'Templating',
    text: templating,
  },
  {
    file: 'cli-usage.md',
    slug: 'cli-usage',
    title: 'CLI Usage',
    text: cliUsage,
  },
  {
    file: 'configuration.md',
    slug: 'configuration',
    title: 'Configuration',
    text: configuration,
  },
  {
    file: 'advanced.md',
    slug: 'advanced',
    title: 'Advanced',
    text: advanced,
  },
]
