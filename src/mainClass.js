const { readdirSync } = require('fs')
const { join } = require('path')
const { get } = require('snekfetch')
const { Base } = require('eris-sharder')

const msgHandler = require('./handlers/msgHandler.js')
const MessageCollector = require('./utils/MessageCollector.js')
const botPackage = require('../package.json')

class Memer extends Base {
  constructor (bot) {
    super(bot)

    this.log = require('./utils/logger.js')
    this.config = require('./config.json')
    this.r = require('rethinkdbdash')()
    this.db = require('./utils/dbFunctions.js')(this)
    this.cmds = []
    this.tags = {}
    this.indexes = {
      'meme': {},
      'joke': {},
      'shitpost': {},
      'greentext': {}
    }
    Object.assign(this, require('./utils/misc.js'))
  }

  launch () {
    this.loadCommands()
    this.MessageCollector = new MessageCollector(this.bot)

    this.bot
      .on('ready', this.ready.bind(this))
      .on('guildCreate', this.guildCreate.bind(this))
      .on('guildDelete', this.guildDelete.bind(this))
      .on('messageCreate', msgHandler.handleMeDaddy.bind(this))
      .on('error', (error) => {
        this.log(error.stack, 'error')
      })

    this.ready()
  }

  async ready () {
    this.bot.editStatus(null, {
      name: 'with my dad',
      type: 1,
      url: 'https://www.twitch.tv/m3lmsie'
    })

    this.mentionRX = new RegExp(`^<@!*${this.bot.user.id}>`)
    this.mockIMG = await get('https://pbs.twimg.com/media/DAU-ZPHUIAATuNy.jpg').then(r => r.body)
  }

  loadCommands () {
    const path = './commands'
    const files = readdirSync(path)

    for (const file of files) {
      try {
        const command = require(join(__dirname, path, file))
        this.cmds.push(command)
      } catch (error) {
        this.log(`Failed to load command ${file}:\n${error.stack}`, 'error')
      }
    }
  }

  guildCreate (guild) {
    const embed = {
      color: this.colors.lightblue,
      title: 'Hello!',
      description: this.intro
    }
    guild.channels.get(guild.channels.filter(c => c.type === 0).map(c => c.id)[0]).createMessage({ embed })
      .catch(() => {})
  }

  guildDelete (guild) {
    this.db.deleteGuild(guild.id)
  }

  get package () {
    return botPackage
  }
}

module.exports = Memer
