class MessageBus {
  constructor() {
    this.subscribers = {};
  }
  send (type, data) {
    if (this.subscribers[type] !== null && this.subscribers[type] !== undefined) {
      for (var i = 0; i < this.subscribers[type].length; ++i) {
        this.subscribers[type][i]['object'][this.subscribers[type][i]['func']](data);
      }
    }
  }
  subscribe (type, object, func) {
    if (this.subscribers[type] === null || this.subscribers[type] === undefined) {
      this.subscribers[type] = [];
    }
    this.subscribers[type].push({
      object: object,
      func: func
    });
  }
  unsubscribe (type, object, func) {
    if (this.subscribers[type] === null || this.subscribers[type] === undefined) return
    for (var i = 0; i < this.subscribers[type].length; ++i) {
      if (this.subscribers[type][i].object === object && this.subscribers[type][i].func === func) {
        this.subscribers[type].slice(i, 1);
        break;
      }
    }
  }
  unsubsribeType (type) {
    delete this.subscribers[type];
  }
  destroy() {
    for (type in this.subscribers) {
      this.unsubsribeType(type);
    }
    this.subscribers = null;
  }
}
class Timer {
  constructor (interval) {
    this.setInterval(interval)
    this.inc = 0
    this.ticks = []
    this.isPause = false
  }
  getInterval() {
    return this.interval
  }
  getFPS() {
    return 1000 / this.interval
  }
  setInterval (interval) {
    this.interval = interval
  }
  pause() {
    this.timeout && clearTimeout(this.timeout)
    this.isPause = true
  }
  play() {
    this.isPause = false
    this.timeout = setTimeout(() => this.tick(), this.interval)
  }
  add (tick) {
    if (this.isPause) return
    this.inc++
    this.ticks.push({id: this.inc, tick: tick})
    if (! this.timeout) {
      this.timeout = setTimeout(() => this.tick(), this.interval)
    }
    return this.inc
  }
  remove (id) {
    this.ticks = this.ticks.filter(i => i.id !== id)
  }
  tick() {
    if (this.ticks.length === 0) return
    const length = this.ticks.length
    for (let i = 0; i < length; ++i) {
      if (this.ticks.length > 0) {
        const tick = this.ticks.shift().tick
        tick()
      }
    }
    this.timeout = setTimeout(() => this.tick(), this.interval)
  }
  destroy() {
    this.timeout && clearTimeout(this.timeout)
    this.timeout = null
    this.inc = null
  }
}
class CarView {
  constructor (speed) {
    this.element = document.querySelector('#main_car')
    const rect = this.element.querySelector('svg path').getBoundingClientRect()
    this.roadRect = document.querySelector('.road_sides').getBoundingClientRect()
    this.carRect = {
      height: rect.height + rect.top,
      width: rect.width + rect.left,
      left: this.roadRect.left,
      top: window.innerHeight - rect.height * 1.5 - rect.top
    }
    this.speed = this.roadRect.width / (speed || asafonov.timer.getFPS())
    asafonov.player = this.carRect
    this.display()
    this.addEventListeners()
  }
  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.CAR_MOVE_RIGHT, this, 'onMoveRight')
    asafonov.messageBus.subscribe(asafonov.events.CAR_MOVE_LEFT, this, 'onMoveLeft')
  }
  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.CAR_MOVE_RIGHT, this, 'onMoveRight')
    asafonov.messageBus.unsubscribe(asafonov.events.CAR_MOVE_LEFT, this, 'onMoveLeft')
  }
  display() {
    this.element.style.left = `${this.carRect.left}px`
    this.element.style.top = `${this.carRect.top}px`
  }
  onMoveRight() {
    this.stop()
    this.moveRight()
  }
  onMoveLeft() {
    this.stop()
    this.moveLeft()
  }
  move(top, left) {
    let movedHorizontally = left !== undefined && left !== null && left !== 0
    let movedVertically = top !== undefined && top !== null && top !== 0
    if (movedHorizontally) {
      const before = this.carRect.left
      this.carRect.left = this.carRect.left + left
      const middle = this.roadRect.left + this.roadRect.width / 2 - this.carRect.width / 2
      if ((before < middle && this.carRect.left >= middle) || (before > middle && this.carRect.left <=middle)) {
        this.carRect.left = middle
        movedHorizontally = false
      }
      if (this.carRect.left <= this.roadRect.left) {
        this.carRect.left = this.roadRect.left
        movedHorizontally = false
      }
      if (this.carRect.left >= this.roadRect.right - this.carRect.width) {
        this.carRect.left = this.roadRect.right - this.carRect.width
        movedHorizontally = false
      }
    }
    this.display()
    return movedHorizontally || movedVertically
  }
  moveLeft() {
    const moved = this.move(0, -this.speed)
    moved && (this.timeout = asafonov.timer.add(() => this.moveLeft()))
  }
  moveRight() {
    const moved = this.move(0, this.speed)
    moved && (this.timeout = asafonov.timer.add(() => this.moveRight()))
  }
  stop() {
    this.timeout && asafonov.timer.remove(this.timeout)
    this.timeout = null
  }
  destroy() {
    this.removeEventListeners()
    this.stop()
    this.timeout = null
    this.element = null
    this.carSize = null
    this.roadSize = null
  }
}
class EnemyView {
  constructor (speed, id) {
    this.speed = speed || 1
    this.id = id
    this.element = document.querySelector(`#car_${id}`)
    this.element.style.display = 'flex'
    const rect = this.element.querySelector('img').getBoundingClientRect()
    this.roadRect = document.querySelector('.road_sides').getBoundingClientRect()
    const left = this.roadRect.left + Math.random() * (this.roadRect.right - rect.width - this.roadRect.left)
    this.carRect = {
      height: rect.height,
      width: rect.width,
      left: left,
      top: -rect.height
    }
    this.display()
    this.moveVertical()
  }
  display() {
    this.element.style.left = `${this.carRect.left}px`
    this.element.style.top = `${this.carRect.top}px`
  }
  move(top, left) {
    let movedHorizontally = left !== undefined && left !== null && left !== 0
    let movedVertically = top !== undefined && top !== null && top !== 0
    if (movedVertically) {
      this.carRect.top += top
      if (this.carRect.top >= window.innerHeight) {
        movedVertically = false
      }
    }
    this.display()
    return movedHorizontally || movedVertically
  }
  moveVertical() {
    const top = this.carRect.top
    const moved = this.move(this.speed, 0)
    const isGameOver = this.isGameOver()
    if (isGameOver) {
      asafonov.messageBus.send(asafonov.events.GAME_OVER)
      return
    }
    if (moved) {
      this.timeout = asafonov.timer.add(() => this.moveVertical())
      if (top < window.innerHeight / 2 && this.carRect.top >= window.innerHeight / 2) {
        asafonov.messageBus.send(asafonov.events.ENEMY_HALFWAY, {id: this.id})
      }
    } else {
      asafonov.messageBus.send(asafonov.events.ENEMY_DESTROYED, {id: this.id})
      this.destroy()
    }
  }
  stop() {
    this.timeout && asafonov.timer.remove(this.timeout)
    this.timeout = null
  }
  isGameOver() {
    const isVerticalCollision = (this.carRect.top >= asafonov.player.top && this.carRect.top <= asafonov.player.top + asafonov.player.height) || (this.carRect.top + this.carRect.height >= asafonov.player.top && this.carRect.top + this.carRect.height <= asafonov.player.top + asafonov.player.height)
    const isHorizontalCollision = (this.carRect.left >= asafonov.player.left && this.carRect.left <= asafonov.player.left + asafonov.player.width) || (this.carRect.left + this.carRect.width >= asafonov.player.left && this.carRect.left + this.carRect.width <= asafonov.player.left + asafonov.player.width)
    return isVerticalCollision && isHorizontalCollision
  }
  destroy() {
    this.stop()
    this.timeout = null
    this.element = null
    this.carSize = null
    this.roadSize = null
  }
}
class EnemyListView {
  constructor (speed) {
    this.enemiesOnScreen = []
    this.speed = speed
    this.doubleEnemy = false
    this.createEnemy()
    this.addEventListeners()
  }
  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.ENEMY_DESTROYED, this, 'onEnemyDestroyed')
  }
  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.ENEMY_DESTROYED, this, 'onEnemyDestroyed')
  }
  createEnemy() {
    if (this.enemiesOnScreen.length === 2) return
    const id = this.enemiesOnScreen.length === 0 ? Math.round(Math.random()) + 1 : 3 - this.enemiesOnScreen[0].id
    const view = new EnemyView(this.speed, id)
    this.enemiesOnScreen.push(view)
  }
  onEnemyDestroyed (data) {
    let enemy = this.enemiesOnScreen.shift()
    enemy = null
    this.createEnemy()
  }
  setSpeed (speed) {
    this.speed = speed
  }
  setDoubleEnemy (doubleEnemy) {
    this.doubleEnemy = doubleEnemy
    asafonov.messageBus[this.doubleEnemy ? 'subscribe' : 'unsubscribe'](asafonov.events.ENEMY_HALFWAY, this, 'createEnemy')
  }
  destroy() {
    this.setDoubleEnemy(false)
    this.doubleEnemy = null
    this.removeEventListeners()
    for (let i = 0; i < this.enemiesOnScreen.length; ++i) {
      this.enemiesOnScreen[i].destroy()
      this.enemiesOnScreen[i] = null
    }
    this.enemiesOnScreen = null
    this.speed = null
  }
}
class GameView {
  constructor (delay) {
    this.speed = window.innerHeight / asafonov.timer.getFPS() / 3 // 3 secs for screen ride
    this.score = 0
    this.scoreContainer = document.querySelector('#score')
    this.roadView = new RoadView(asafonov.timer.getFPS(), 2, {roadLines: true, lights: true, trees: true, houses: true})
    this.carView = new CarView(asafonov.timer.getFPS() / 2)
    this.playButton = document.querySelector('.game_play')
    this.pauseButton = document.querySelector('.game_pause')
    this.onPlayClickProxy = this.onPlayClick.bind(this)
    this.onPauseClickProxy = this.onPauseClick.bind(this)
    this.onTouchProxy = this.onTouch.bind(this)
    this.addEventListeners()
    setTimeout(() => this.initEnemy(), delay)
    setTimeout(() => {
      document.querySelector('.countdown').style.display = 'none'
      this.pauseButton.style.display = 'flex'
    }, delay + 1500)
  }
  initEnemy() {
    this.enemyListView = new EnemyListView(this.speed)
  }
  onPlayClick (event) {
    event.stopPropagation()
    this.pauseButton.style.display = 'flex'
    this.playButton.style.display = 'none'
    asafonov.timer.play()
  }
  onPauseClick (event) {
    event.stopPropagation()
    this.pauseButton.style.display = 'none'
    this.playButton.style.display = 'flex'
    asafonov.timer.pause()
  }
  onTouch(event) {
    if (event.clientX > window.innerWidth / 2) {
      asafonov.messageBus.send(asafonov.events.CAR_MOVE_RIGHT)
    } else {
      asafonov.messageBus.send(asafonov.events.CAR_MOVE_LEFT)
    }
  }
  addEventListeners() {
    this.playButton.addEventListener('click', this.onPlayClickProxy)
    this.pauseButton.addEventListener('click', this.onPauseClickProxy)
    document.body.addEventListener('click', this.onTouchProxy)
    asafonov.messageBus.subscribe(asafonov.events.ENEMY_DESTROYED, this, 'onEnemyDestroyed')
    asafonov.messageBus.subscribe(asafonov.events.GAME_OVER, this, 'onGameOver')
  }
  removeEventListeners() {
    this.playButton.removeEventListener('click', this.onPlayClickProxy)
    this.pauseButton.removeEventListener('click', this.onPauseClickProxy)
    document.body.removeEventListener('click', this.onTouchProxy)
    asafonov.messageBus.unsubscribe(asafonov.events.ENEMY_DESTROYED, this, 'onEnemyDestroyed')
    asafonov.messageBus.unsubscribe(asafonov.events.GAME_OVER, this, 'onGameOver')
  }
  onEnemyDestroyed() {
    this.score++
    this.scoreContainer.innerHTML = this.score
    if (this.score % 5 === 0) {
      this.speed *= 1.1
      this.enemyListView.setSpeed(this.speed)
    }
    if (this.score === 10) this.enemyListView.setDoubleEnemy(true)
  }
  onGameOver() {
    this.roadView.stop()
    this.carView.stop()
    this.destroy()
    if (confirm('Game over. Start again?')) {
      location.reload()
    }
  }
  destroy() {
    this.removeEventListeners()
    this.enemyListView.destroy()
    this.enemyListView = null
    this.roadView.destroy()
    this.roadView = null
    this.carView.destroy()
    this.carView = null
    this.speed = null
    this.score = null
    this.scoreContainer = null
  }
}
class RoadView {
  constructor (speed, lightsPerLine, options) {
    this.options = options || {roadLines: true, lights: true, trees: true, houses: true}
    this.parallaxRatio = 2 / 3
    this.updateSpeed(speed)
    this.options.roadLines && this.initRoadLines()
    this.options.lights && this.initLights(lightsPerLine)
    this.options.trees && this.initTrees()
    this.options.houses && this.initHouses()
    this.draw()
  }
  initRoadLines() {
    this.roadLine = document.querySelectorAll('.road_lines')
    this.roadLineOffset = -1 * window.screen.height
    this.roadLine[0].style.height = `${window.screen.height}px`
    this.roadLine[1].style.height = `${window.screen.height}px`
  }
  initLights (lightsPerLine) {
    this.lightsPerLine = lightsPerLine || 1
    this.lightLine = document.querySelectorAll('.lights_section')
    this.lightLine[0].style.height = `${window.screen.height}px`
    this.lightLine[1].style.height = `${window.screen.height}px`
    this.createLights()
    this.lightOffset = -this.lightHeight
  }
  initTrees() {
    this.treeLineHeight = 0
    this.treeLine = document.querySelectorAll('.tree_line')
    this.treeLine[0].style.height = `${window.screen.height}px`
    this.treeLine[1].style.height = `${window.screen.height}px`
    this.createTreeLines()
    this.treeOffset = -this.treeLineHeight
  }
  initHouses() {
    this.houseLeftLineHeight = 0
    this.houseRightLineHeight = 0
    this.houseLine = document.querySelectorAll('.house_line')
    this.houseLine[0].style.height = `${window.screen.height}px`
    this.houseLine[1].style.height = `${window.screen.height}px`
    this.createHouseLines()
    this.houseLeftOffset = -this.houseLeftLineHeight
    this.houseRightOffset = -this.houseRightLineHeight
    this.updatePosition()
  }
  createLights() {
    this.lights = []
    for (let i = 0; i < this.lightsPerLine * 2; ++i) {
      const light = this.getLight()
      this.lights.push(light)
      this.lightLine[i % 2].appendChild(light)
      if (i === 0) {
        const rect = light.getBoundingClientRect()
        this.lightHeight = rect.height + rect.top
      }
    }
  }
  createTreeLines() {
    for (let i = 0; i < this.treeLine.length; ++i) {
      for (let j = 0; j < 6; ++j) {
        const treeLine = this.getTreeLine()
        this.treeLine[i].appendChild(treeLine)
        if (i === 0 && j === 0) {
          const rect = treeLine.getBoundingClientRect()
          const height = rect.height + rect.top
          this.treeLineHeight = (parseInt(height / this.step) + 1) * this.step
        }
      }
    }
  }
  createHouseLines() {
    for (let j = 0; j < 4; ++j) {
      const leftLine = this.getLeftHouseLine()
      const rightLine = this.getRightHouseLine()
      this.houseLine[0].appendChild(leftLine)
      this.houseLine[1].appendChild(rightLine)
      if (j === 0) {
        const lrect = leftLine.getBoundingClientRect()
        const rrect = rightLine.getBoundingClientRect()
        const leftLineHeight = lrect.height + lrect.top
        const rightLineHeight = rrect.height + rrect.top
        const step = this.step * this.parallaxRatio
        this.houseLeftLineHeight = (parseInt(leftLineHeight / step) + 1) * step
        this.houseRightLineHeight = (parseInt(rightLineHeight / step) + 1) * step
      }
    }
  }
  getLeftHouseLine() {
    const div = document.createElement('div')
    div.className = 'house_line_element'
    div.innerHTML = this.getHouse() + this.getPalmTree() + this.getSmallHouse()
    return div
  }
  getTreeLine() {
    const div = document.createElement('div')
    div.className = 'tree_line_element'
    div.innerHTML = this.getTree() + this.getTree()
    return div
  }
  getRightHouseLine() {
    const div = document.createElement('div')
    div.className = 'house_line_element'
    div.classList.add('type_2')
    div.innerHTML = this.getSmallHouse() + this.getSmallHouse() + this.getSmallHouse() + this.getSmallHouse() + this.getPalmTree() + this.getPalmTree() + this.getPalmTree()
    return div
  }
  getLight() {
    const div = document.createElement('div')
    div.classList.add('svg_pic')
    div.classList.add('light')
    return div
  }
  getHouse() {
    return '<div class="svg_pic decor house"><img src="./images/house.png"></div>'
  }
  getSmallHouse() {
    return '<div class="svg_pic decor small_house"><img src="./images/small_house.png"></div>'
  }
  getPalmTree() {
    return '<div class="svg_pic decor palm_tree"><img src="./images/palm_tree.png"></div>'
  }
  getTree() {
    return '<div class="svg_pic decor tree"><img src="./images/tree.png"></div>'
  }
  updatePosition() {
    this.options.roadLines && this.updateRoadLines()
    this.options.trees && this.updateTrees()
    this.options.houses && this.updateHouses()
    this.options.lights && this.updateLights()
  }
  updateRoadLines() {
    this.roadLineOffset += this.step
    this.roadLineOffset >= 0 && (this.roadLineOffset = -1 * window.screen.height)
    this.roadLine[0].style.top = `${this.roadLineOffset}px`
    this.roadLine[1].style.top = `${this.roadLineOffset + window.screen.height}px`
  }
  updateLights() {
    this.lightOffset += this.step / this.parallaxRatio
    this.lightOffset >= window.screen.height / this.lightsPerLine && (this.lightOffset = -this.lightHeight)
    const pixelsBetween2Lights = window.screen.height / this.lightsPerLine
    for (let i = 0; i < this.lightsPerLine; ++i) {
      const top = i * pixelsBetween2Lights + this.lightOffset
      this.lights[2 * i].style.top = top + 'px'
      this.lights[2 * i + 1].style.top = top + 'px'
    }
  }
  updateTrees() {
    this.treeOffset += this.step
    this.treeOffset >= 0 && (this.treeOffset = -this.treeLineHeight)
    for (let i = 0; i < this.treeLine.length; ++i) {
      this.treeLine[i].style.top = this.treeOffset + 'px'
    }
  }
  updateHouses() {
    this.houseLeftOffset += this.step * this.parallaxRatio
    this.houseLeftOffset >= 0 && (this.houseLeftOffset = -this.houseLeftLineHeight)
    this.houseRightOffset += this.step * this.parallaxRatio
    this.houseRightOffset >= 0 && (this.houseRightOffset = -this.houseRightLineHeight)
    this.houseLine[0].style.top = this.houseLeftOffset + 'px'
    this.houseLine[1].style.top = this.houseRightOffset + 'px'
  }
  updateSpeed (speed) {
    this.step = window.screen.height / speed
  }
  draw() {
    this.updatePosition()
    this.timeout = asafonov.timer.add(() => this.draw())
  }
  stop() {
    this.timeout && asafonov.timer.remove(this.timeout)
    this.timeout = null
  }
  destroy() {
    this.lightsPerLine = null
    this.speed = null
    this.treeOffset = null
    this.houseLeftOffset = null
    this.houseRightOffset = null
    this.stop()
  }
}
window.asafonov = {}
window.asafonov.version = '0.5'
window.asafonov.messageBus = new MessageBus()
window.asafonov.timer = new Timer(40)
window.asafonov.events = {
  GAME_OVER: 'GAME_OVER',
  ENEMY_DESTROYED: 'ENEMY_DESTROYED',
  ENEMY_HALFWAY: 'ENEMY_HALFWAY',
  CAR_MOVE_RIGHT: 'CAR_MOVE_RIGHT',
  CAR_MOVE_LEFT: 'CAR_MOVE_LEFT'
}
window.asafonov.settings = {
}
window.asafonov.player = null
window.onerror = (msg, url, line) => {
  alert(`${msg} on line ${line}`)
}
document.addEventListener("DOMContentLoaded", function (event) {
  asafonov.timer.setInterval(80)
  const gameView = new GameView(5500)
})
