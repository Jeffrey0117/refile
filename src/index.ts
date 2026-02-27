#!/usr/bin/env node
import { Command } from 'commander'
import { registerPushCommand } from './commands/push.js'
import { registerPullCommand } from './commands/pull.js'
import { registerStatusCommand } from './commands/status.js'
import { registerInitCommand } from './commands/init.js'

const program = new Command()

program
  .name('refile')
  .description('Virtualize files — upload to cloud, keep tiny local pointers')
  .version('0.1.0')

registerPushCommand(program)
registerPullCommand(program)
registerStatusCommand(program)
registerInitCommand(program)

program.parse()
