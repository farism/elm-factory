#!/usr/bin/env node

require('yargs').commandDir('../src/cmds').demandCommand().help().argv
