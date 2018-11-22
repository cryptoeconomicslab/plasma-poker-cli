const mqtt = require('mqtt')
const EventEmitter = require('events')

class MQTTClient extends EventEmitter {

  constructor() {
    super()
    this.client = mqtt.connect('mqtt://localhost:1883')

    this.client.on('connect', function () {
      console.log('mqtt.connect')
    })
    
    this.client.on('message', (topic, message) => {
      // message is Buffer
      this.emit('message', message.toString())
    })

  }

  subscribe(topic) {
    this.client.subscribe(topic, function (err) {
    })
  }

  publish(topic, message) {
    this.client.publish(
      topic,
      JSON.stringify(message),
      {
        retain: true
      }
    )
  }

}


module.exports = MQTTClient
