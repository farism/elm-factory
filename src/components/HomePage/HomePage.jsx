import React, { PureComponent } from 'react'
import { Link } from 'react-router'
import FileCodeIcon from 'react-octicons-svg/dist/FileCodeIcon'
import GlobeIcon from 'react-octicons-svg/dist/GlobeIcon'
import PackageIcon from 'react-octicons-svg/dist/PackageIcon'

import {
  PrimarySection,
  SecondarySection,
  SectionHeader,
  SubtronSection,
} from '../PageSections'
import BashBlock, { Comment, Gap, Line } from '../BashBlock'
import IconPoint from './IconPoint'

import styles from './HomePage.scss'

export default function HomePage() {
  return (
    <div>
      <SubtronSection title="Elm Factory">
        The command line interface for applications written in the{' '}
        <a href="http://elm-lang.org/" target="_blank">
          Elm language
        </a>
      </SubtronSection>
      <PrimarySection>
        <BashBlock>
          <Line value="npm install -g elm-factory" />
          <Gap />
          <Comment value="Initialize a new project" />
          <Line value="elm-factory init my-elm-app" />
          <Gap />
          <Comment value="Launch your app" />
          <Line value="cd my-elm-all" />
          <Line value="elm-factory dev" />
        </BashBlock>
        <h3 style={{ textAlign: 'center' }}>
          Ready for a closer look?{' '}
          <Link to="/cli">Dive into the CLI documentation</Link>
        </h3>
      </PrimarySection>
      <SecondarySection>
        <SectionHeader title="Opinionated Elm development">
          Elm Factory is an all in one, zero config CLI tool with integrated dev
          and build modes for maximum productivity. Don't worry about tooling
          and just code!
        </SectionHeader>
        <div className={styles.pointContainer}>
          <IconPoint icon={FileCodeIcon} title="Develop">
            The elm-factory dev server is a thin layer on top of popular
            existing libraries such as elm-reactor and elm-css.
          </IconPoint>
          <IconPoint icon={PackageIcon} title="Package">
            Run a single command to extract stylesheet and other assets from
            your Elm program, with automatic cache busting features.
          </IconPoint>
        </div>
      </SecondarySection>
    </div>
  )
}
