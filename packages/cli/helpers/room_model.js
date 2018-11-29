const {
  Storage
} = require('./storage')

class RoomModel {

  constructor(name, utxo, hash) {
    this.name = name
    this.utxo = utxo
    this.hash = hash
  }

  getId() {
    return this.name
  }

}

class RoomListModel {

  constructor(rooms) {
    this.rooms = rooms || {}
  }

  add(room) {
    this.rooms[room.getId()] = room
  }
  
  remove(id) {
    this.rooms = this.rooms.filter(room => room.getId() != id)
  }

  search() {
    return Object.keys(this.rooms).map(key => this.rooms[key])
  }

  store() {
    Storage.store('rooms', this.rooms)
  }

  static load() {
    return new RoomListModel(Storage.load('rooms'));
  }

}

module.exports = {
  RoomModel,
  RoomListModel
}
