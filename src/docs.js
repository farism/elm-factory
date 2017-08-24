const cmds = require('elm-factory/src/cmds')

export default Object.keys(cmds).map(function(key) {
  const cmd = cmds[key]

  const options = Object.keys(cmd.options).map(function(optKey) {
    const opt = cmd.options[optKey]

    return {
      name: `${optKey}${opt.alias ? ', --' + opt.alias : ''}`,
      description: opt.description,
      default: opt.default,
    }
  })

  return {
    command: cmd.name,
    usage: [{ line: cmd.command }],
    description: [cmd.description],
    options,
  }
})
