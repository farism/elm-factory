import React from 'react'
import { Link } from 'react-router-dom'

module.exports = [
  {
    name: 'publish_targets',
    example: {
      win32: ['github', 's3'],
      darwin: ['github'],
      linux: ['github'],
    },
    description: [
      'The "publish_targets" property is used to configure where Electron Forge will attempt to publish each platforms distributables to.  This object consists of three keys "win32", "darwin" and "linux" each set to an array of publish targets for the given platform.',
      'The default is ["github"] for all three platforms.',
      <p>
        You can find a{' '}
        <Link to="/config/extra/possible-publish-targets">
          list of publish targets
        </Link>{' '}
        in our documentation.
      </p>,
    ],
  },
  {
    name: 'github_repository',
    example: {
      owner: 'MarshallOfSound',
      name: 'my-awesome-repository',
      draft: true,
    },
    description: [
      'This config object is normally used to provide options to the "github" publish target although it can be used by other targets as well.',
      'In order to provide a GitHub authentication token you must set the "GITHUB_TOKEN" environment variable.',
    ],
    properties: [
      {
        name: 'owner',
        type: 'String',
        description: 'The owner of the GitHub repository.',
      },
      {
        name: 'name',
        type: 'String',
        description: 'The name of the GitHub repository.',
      },
      {
        name: 'draft',
        type: 'Boolean',
        description: 'Create the releases as a draft, defaults to "true".',
      },
      {
        name: 'prerelease',
        type: 'Boolean',
        description:
          'Identify the release as a prerelease, defaults to "false".',
      },
    ],
  },
  {
    name: 's3',
    example: {
      accessKey: 'MY_RANDOM_KEY',
      bucket: 'myBucket',
      public: true,
    },
    description: [
      'This config object is user to provide options to the "s3" publish target.',
      'In order to provide your AWS secret access key you must set the "ELECTRON_FORGE_S3_SECRET_ACCESS_KEY" environment variable.  We also check the standard "AWS_SECRET_ACCESS_KEY" variable as well.',
    ],
    properties: [
      {
        name: 'accessKey',
        type: 'String',
        description:
          'Your access key for your AWS account (falls back to the standard AWS_ACCESS_KEY_ID environment variable).',
      },
      {
        name: 'bucket',
        type: 'String',
        description: 'The name of the S3 bucket to upload the assets to.',
      },
      {
        name: 'folder',
        type: 'String',
        description:
          'The folder path to upload to inside your bucket, defaults to your application version.',
      },
      {
        name: 'public',
        type: 'Boolean',
        description:
          'Whether to make the S3 upload public, defaults to "false".',
      },
    ],
  },
]
