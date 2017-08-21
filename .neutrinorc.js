module.exports = {
  use: [
    [
      'neutrino-preset-web',
      {
        babel: {
          plugins: [['import', { libraryName: 'antd', style: 'css' }]],
        },
        hot: true,
        html: {
          links: ['https://fonts.googleapis.com/css?family=Roboto'],
        },
        polyfills: {
          async: true,
          babel: true,
        },
      },
    ],
  ],
}
