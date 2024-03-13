class AbstractList {
  constructor (list) {
    this.list = this.getList() || {}
    if (list) this.list = {...list, ...this.list}
  }
  getList() {
    if (this.list === null || this.list === undefined) {
      this.list = JSON.parse(window.localStorage.getItem(this.constructor.name))
    }
    return this.list
  }
  length() {
    return Object.keys(this.list).length
  }
  getDefault() {
    return Object.keys(this.list)[0]
  }
  getItem (id) {
    if (this.list === null || this.list === undefined) {
      this.getList()
    }
    return this.list[id]
  }
  updateItem (id, item) {
    this.list[id] = item
    this.store()
  }
  updateId (id, newid) {
    this.list[newid] = this.list[id]
    this.deleteItem(id)
  }
  deleteItem (id) {
    delete this.list[id]
    this.store()
  }
  store() {
    window.localStorage.setItem(this.constructor.name, JSON.stringify(this.list))
  }
}
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
class Updater {
  constructor (upstreamVersionUrl) {
    this.upstreamVersionUrl = upstreamVersionUrl
  }
  getCurrentVersion() {
    return window.asafonov.version
  }
  getUpstreamVersion() {
    return fetch(this.upstreamVersionUrl)
      .then(data => data.text())
      .then(data => data.replace(/[^0-9\.]/g, ''))
  }
  compareVersion (v1, v2) {
    const _v1 = v1.split('.')
    const _v2 = v2.split('.')
    return parseInt(_v1[0], 10) > parseInt(_v2[0], 10) || parseInt(_v1[1], 10) > parseInt(_v2[1], 10)
  }
  getUpdateUrl (template) {
    return template.replace('{VERSION}', this.upstreamVersion)
  }
  isUpdateNeeded() {
    return this.getUpstreamVersion().
      then(upstreamVersion => {
        this.upstreamVersion = upstreamVersion
        const currentVersion = this.getCurrentVersion()
        return this.compareVersion(upstreamVersion, currentVersion)
      })
  }
  destroy() {
    this.upstreamVersionUrl = null
  }
}
class Swipe {
  constructor (element, minMovement) {
    this.x = null;
    this.y = null;
    this.xn = null;
    this.yn = null;
    this.minMovement = minMovement || 100;
    this.element = element;
    this.onTouchStartProxy = this.onTouchStart.bind(this);
    this.onTouchMoveProxy = this.onTouchMove.bind(this);
    this.onTouchEndProxy = this.onTouchEnd.bind(this);
    this.addEventListeners();
  }
  isMinimalMovement() {
    const xdiff = this.x - this.xn;
    const ydiff = this.y - this.yn;
    return Math.abs(xdiff) > this.minMovement || Math.abs(ydiff) > this.minMovement;
  }
  onTouchStart (event) {
    this.x = event.touches[0].clientX;
    this.y = event.touches[0].clientY;
    this.xn = this.x;
    this.yn = this.y;
    this.swipeStarted = false;
  }
  onTouchMove (event) {
    this.xn = event.touches[0].clientX;
    this.yn = event.touches[0].clientY;
    if (! this.swipeStarted && this.isMinimalMovement()) {
      this.onSwipeStart();
      this.swipeStarted = true;
    }
    this.swipeStarted && this.onSwipeMove();
  }
  onTouchEnd (event) {
    if (! this.isMinimalMovement()) {
      return ;
    }
    this.onSwipeEnd();
    const xdiff = this.x - this.xn;
    const ydiff = this.y - this.yn;
    if (Math.abs(xdiff) > Math.abs(ydiff)) {
      this[xdiff < 0 ? 'onRight' : 'onLeft']();
    } else {
      this[ydiff < 0 ? 'onDown' : 'onUp']();
    }
  }
  onLeft (f) {
    f && (this.onLeft = f);
    return this;
  }
  onRight (f) {
    f && (this.onRight = f);
    return this;
  }
  onUp (f) {
    f && (this.onUp = f);
    return this;
  }
  onDown (f) {
    f && (this.onDown = f);
    return this;
  }
  onSwipeStart (f) {
    f && (this.onSwipeStart = f);
    return this;
  }
  onSwipeMove (f) {
    f && (this.onSwipeMove = f);
    return this;
  }
  onSwipeEnd (f) {
    f && (this.onSwipeEnd = f);
    return this;
  }
  manageEventListeners (remove) {
    const action = remove ? 'removeEventListener' : 'addEventListener';
    this.element[action]('touchstart', this.onTouchStartProxy);
    this.element[action]('touchmove', this.onTouchMoveProxy);
    this.element[action]('touchend', this.onTouchEndProxy);
  }
  addEventListeners() {
    this.manageEventListeners();
  }
  removeEventListeners() {
    this.manageEventListeners(true);
  }
  destroy() {
    this.x = null;
    this.y = null;
    this.xn = null;
    this.yn = null;
    this.minMovement = null;
    this.removeEventListeners();
    this.element = null;
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
    this.speed = this.roadRect.width / (speed || 25)
    asafonov.player = this.carRect
    this.display()
    this.onTouchProxy = this.onTouch.bind(this)
    this.addEventListeners()
  }
  addEventListeners() {
    document.body.addEventListener('click', this.onTouchProxy)
  }
  removeEventListeners() {
    document.body.removeEventListener('click', this.onTouchProxy)
  }
  onTouch(event) {
    this.stop()
    if (event.clientX > window.innerWidth / 2) {
      this.moveRight()
    } else {
      this.moveLeft()
    }
  }
  display() {
    this.element.style.left = `${this.carRect.left}px`
    this.element.style.top = `${this.carRect.top}px`
  }
  move(top, left) {
    let movedHorizontally = left !== undefined && left !== null && left !== 0
    let movedVertically = top !== undefined && top !== null && top !== 0
    if (movedHorizontally) {
      this.carRect.left = this.carRect.left + left
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
    moved && (this.timeout = setTimeout(() => this.moveLeft(), 40))
  }
  moveRight() {
    const moved = this.move(0, this.speed)
    moved && (this.timeout = setTimeout(() => this.moveRight(), 40))
  }
  stop() {
    this.timeout && clearTimeout(this.timeout)
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
    const rect = this.element.querySelector('svg path').getBoundingClientRect()
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
      this.timeout = setTimeout(() => this.moveVertical(), 40)
      if (top < window.innerHeight / 2 && this.carRect.top >= window.innerHeight / 2) {
        asafonov.messageBus.send(asafonov.events.ENEMY_HALFWAY, {id: this.id})
      }
    } else {
      asafonov.messageBus.send(asafonov.events.ENEMY_DESTROYED, {id: this.id})
      this.destroy()
    }
  }
  stop() {
    this.timeout && clearTimeout(this.timeout)
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
  constructor() {
    this.speed = window.innerHeight / 80
    this.score = 0
    this.roadView = new RoadView(32, 2)
    this.carView = new CarView(16)
    this.enemyListView = new EnemyListView(this.speed)
    this.addEventListeners()
  }
  addEventListeners() {
    asafonov.messageBus.subscribe(asafonov.events.ENEMY_DESTROYED, this, 'onEnemyDestroyed')
    asafonov.messageBus.subscribe(asafonov.events.GAME_OVER, this, 'onGameOver')
  }
  removeEventListeners() {
    asafonov.messageBus.unsubscribe(asafonov.events.ENEMY_DESTROYED, this, 'onEnemyDestroyed')
    asafonov.messageBus.unsubscribe(asafonov.events.GAME_OVER, this, 'onGameOver')
  }
  onEnemyDestroyed() {
    this.score++
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
  }
}
class RoadView {
  constructor (speed, lightsPerLine) {
    this.parallaxRatio = 2 / 3
    this.updateSpeed(speed)
    this.initRoadLines()
    this.initLights(lightsPerLine)
    this.initTrees()
    this.initHouses()
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
    div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><path d="M7.5,0A7.5,7.5,0,1,1,0,7.5,7.5,7.5,0,0,1,7.5,0Z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><path d="M7.5,0A7.5,7.5,0,1,1,0,7.5,7.5,7.5,0,0,1,7.5,0Z"/></svg>'
    return div
  }
  getHouse() {
    return '<div class="svg_pic decor house"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 102"><path d="M54.5 101.5H.5l27-27v-47 47l27 27V.58ZM.5.5v100.92Zm0 0h54l-27 27Z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 102"><path d="M54.5 101.5H.5l27-27v-47 47l27 27V.58ZM.5.5v100.92Zm0 0h54l-27 27Z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 102"><path d="M54.5 101.5H.5l27-27v-47 47l27 27V.58ZM.5.5v100.92Zm0 0h54l-27 27Z"/></svg></div>'
  }
  getSmallHouse() {
    return '<div class="svg_pic decor small_house"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 55"><path d="M.5 54.5V.5l14.44 27h25.13-25.13L.5 54.5h53.95Zm54-54H.55Zm0 0v54l-14.44-27Z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 55"><path d="M.5 54.5V.5l14.44 27h25.13-25.13L.5 54.5h53.95Zm54-54H.55Zm0 0v54l-14.44-27Z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 55"><path d="M.5 54.5V.5l14.44 27h25.13-25.13L.5 54.5h53.95Zm54-54H.55Zm0 0v54l-14.44-27Z"/></svg></div>'
  }
  getPalmTree() {
    return '<div class="svg_pic decor palm_tree"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 55.822"><path d="M28.549.5C27.724.383 24.22 8 24.464 9.131s3.382 3.066 3.382 3.066l-4.057.7v6.358l-5.231-4.333-2.146 4.333-3.79-3.155s1.953-2.945.532-4.245-5.815-3.068-6.216-.93.591 5.2 4.612 9.483 10.852 6.618 11.471 7.641-5.194-2.941-9-3.551a9.253 9.253 0 0 0-6.172 1.079c.069-.05-.032-1.093-.043.029s.375 4.364 0 4.457.326-3.981-1.5-4.086-5.807 1.94-5.807 3.668 5.807 3.246 5.807 3.246a43.353 43.353 0 0 0 6.846 1.052c2.287 0 2.3-1.052 2.3-1.052l-5.6 5.735s-4.185 5.039-3.877 6.719 4.152.742 5.123 0-1.24-2.967-1.24-2.967l3.729-2.223v4.254s11.278-9.276 12.2-9.562-8.52 8.416-8.52 8.416-1.48 2.419-.857 3.336 3.35.331 3.35.331l-4.306 1.806s-.224 4.688.956 5.347 3.762-2.71 3.762-2.71-.793-2.342-.413-2.637 1.934 1.457 1.934 1.457 2.659-1.645 2.768-2.76-2.518-1.275-2.333-1.7 1.753 1.547 3.073 0 2.206-6.189 2.206-6.189v3.719l2.749 4.169 4.053-.833-2.467 3.593 5.187 5.131 1.442-6.587-1.054-6.357-5.029-6.315 9.781 8.346 1.542-2.378v3.313l5.25 1.254-2.873-7.972h-5.221l3.8-2.564-7.243-6.417 6.831 5.2 2.939-.416v-3.075l2.663 2.594 5.748-1.052-7.618-6.473-2.786 2.419.333-3.231-3.937-1.114-2.117 1.108 4.233-4.136-1.541-1.585 2.079-3.318 2.939 1.381s4.59-6.1 2.663-7.022-7.964.961-10.371 3.332 1.355 5.69.743 6.152-3.191-4.3-3.191-4.3l-3.11 2.545-5.305 10.183s5.892-8.542 4.578-15.942S29.374.617 28.549.5Z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 55.822"><path d="M28.549.5C27.724.383 24.22 8 24.464 9.131s3.382 3.066 3.382 3.066l-4.057.7v6.358l-5.231-4.333-2.146 4.333-3.79-3.155s1.953-2.945.532-4.245-5.815-3.068-6.216-.93.591 5.2 4.612 9.483 10.852 6.618 11.471 7.641-5.194-2.941-9-3.551a9.253 9.253 0 0 0-6.172 1.079c.069-.05-.032-1.093-.043.029s.375 4.364 0 4.457.326-3.981-1.5-4.086-5.807 1.94-5.807 3.668 5.807 3.246 5.807 3.246a43.353 43.353 0 0 0 6.846 1.052c2.287 0 2.3-1.052 2.3-1.052l-5.6 5.735s-4.185 5.039-3.877 6.719 4.152.742 5.123 0-1.24-2.967-1.24-2.967l3.729-2.223v4.254s11.278-9.276 12.2-9.562-8.52 8.416-8.52 8.416-1.48 2.419-.857 3.336 3.35.331 3.35.331l-4.306 1.806s-.224 4.688.956 5.347 3.762-2.71 3.762-2.71-.793-2.342-.413-2.637 1.934 1.457 1.934 1.457 2.659-1.645 2.768-2.76-2.518-1.275-2.333-1.7 1.753 1.547 3.073 0 2.206-6.189 2.206-6.189v3.719l2.749 4.169 4.053-.833-2.467 3.593 5.187 5.131 1.442-6.587-1.054-6.357-5.029-6.315 9.781 8.346 1.542-2.378v3.313l5.25 1.254-2.873-7.972h-5.221l3.8-2.564-7.243-6.417 6.831 5.2 2.939-.416v-3.075l2.663 2.594 5.748-1.052-7.618-6.473-2.786 2.419.333-3.231-3.937-1.114-2.117 1.108 4.233-4.136-1.541-1.585 2.079-3.318 2.939 1.381s4.59-6.1 2.663-7.022-7.964.961-10.371 3.332 1.355 5.69.743 6.152-3.191-4.3-3.191-4.3l-3.11 2.545-5.305 10.183s5.892-8.542 4.578-15.942S29.374.617 28.549.5Z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 55.822"><path d="M28.549.5C27.724.383 24.22 8 24.464 9.131s3.382 3.066 3.382 3.066l-4.057.7v6.358l-5.231-4.333-2.146 4.333-3.79-3.155s1.953-2.945.532-4.245-5.815-3.068-6.216-.93.591 5.2 4.612 9.483 10.852 6.618 11.471 7.641-5.194-2.941-9-3.551a9.253 9.253 0 0 0-6.172 1.079c.069-.05-.032-1.093-.043.029s.375 4.364 0 4.457.326-3.981-1.5-4.086-5.807 1.94-5.807 3.668 5.807 3.246 5.807 3.246a43.353 43.353 0 0 0 6.846 1.052c2.287 0 2.3-1.052 2.3-1.052l-5.6 5.735s-4.185 5.039-3.877 6.719 4.152.742 5.123 0-1.24-2.967-1.24-2.967l3.729-2.223v4.254s11.278-9.276 12.2-9.562-8.52 8.416-8.52 8.416-1.48 2.419-.857 3.336 3.35.331 3.35.331l-4.306 1.806s-.224 4.688.956 5.347 3.762-2.71 3.762-2.71-.793-2.342-.413-2.637 1.934 1.457 1.934 1.457 2.659-1.645 2.768-2.76-2.518-1.275-2.333-1.7 1.753 1.547 3.073 0 2.206-6.189 2.206-6.189v3.719l2.749 4.169 4.053-.833-2.467 3.593 5.187 5.131 1.442-6.587-1.054-6.357-5.029-6.315 9.781 8.346 1.542-2.378v3.313l5.25 1.254-2.873-7.972h-5.221l3.8-2.564-7.243-6.417 6.831 5.2 2.939-.416v-3.075l2.663 2.594 5.748-1.052-7.618-6.473-2.786 2.419.333-3.231-3.937-1.114-2.117 1.108 4.233-4.136-1.541-1.585 2.079-3.318 2.939 1.381s4.59-6.1 2.663-7.022-7.964.961-10.371 3.332 1.355 5.69.743 6.152-3.191-4.3-3.191-4.3l-3.11 2.545-5.305 10.183s5.892-8.542 4.578-15.942S29.374.617 28.549.5Z"/></svg></div>'
  }
  getTree() {
    return '<div class="svg_pic decor tree"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56.108"><path d="M28.024.5a12.577 12.577 0 0 0-3.734 5.386 37.661 37.661 0 0 0-1.637 9.035 27.858 27.858 0 0 0-6.859-4.936 18.257 18.257 0 0 0-7.27-1.476s.207 6.711 4.354 11.278 12.236 6.991 12.236 6.991-8.187-4.173-14.341-3.857S.5 28.043.5 28.043a18.556 18.556 0 0 0 8.964 4.6c5.217.879 11.9-1.088 11.9-1.088s-6.635 1.963-9.846 5.883-3 9.794-3 9.794 6.224.632 10.639-3.016 7.021-11.573 7.021-11.573.553.983-1.494 4.795-1.756 5.545-1.615 7.308c.461 5.74 4.949 10.859 4.949 10.859a19.577 19.577 0 0 0 4.795-9.7c.733-5.473-1.863-12.2-1.863-12.2s2.229 7.124 6.341 10.5 10.105 3.016 10.105 3.016a24.193 24.193 0 0 0-2.022-8.027c-1.862-4.125-8.083-5.492-16.083-10.316 0 0 6.98 4.85 14.712 4.372a16.411 16.411 0 0 0 11.491-5.221 13.737 13.737 0 0 0-8.724-4.687c-5.523-.584-13.371 2.351-13.371 2.351a19.3 19.3 0 0 0 10.6-7.318c4.31-5.989 3.394-9.88 3.394-9.88s-4.449-.861-10.105 3.541-8 12.5-8 12.5 3.841-7.632 3.522-13.646S28.024.5 28.024.5Z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56.108"><path d="M28.024.5a12.577 12.577 0 0 0-3.734 5.386 37.661 37.661 0 0 0-1.637 9.035 27.858 27.858 0 0 0-6.859-4.936 18.257 18.257 0 0 0-7.27-1.476s.207 6.711 4.354 11.278 12.236 6.991 12.236 6.991-8.187-4.173-14.341-3.857S.5 28.043.5 28.043a18.556 18.556 0 0 0 8.964 4.6c5.217.879 11.9-1.088 11.9-1.088s-6.635 1.963-9.846 5.883-3 9.794-3 9.794 6.224.632 10.639-3.016 7.021-11.573 7.021-11.573.553.983-1.494 4.795-1.756 5.545-1.615 7.308c.461 5.74 4.949 10.859 4.949 10.859a19.577 19.577 0 0 0 4.795-9.7c.733-5.473-1.863-12.2-1.863-12.2s2.229 7.124 6.341 10.5 10.105 3.016 10.105 3.016a24.193 24.193 0 0 0-2.022-8.027c-1.862-4.125-8.083-5.492-16.083-10.316 0 0 6.98 4.85 14.712 4.372a16.411 16.411 0 0 0 11.491-5.221 13.737 13.737 0 0 0-8.724-4.687c-5.523-.584-13.371 2.351-13.371 2.351a19.3 19.3 0 0 0 10.6-7.318c4.31-5.989 3.394-9.88 3.394-9.88s-4.449-.861-10.105 3.541-8 12.5-8 12.5 3.841-7.632 3.522-13.646S28.024.5 28.024.5Z"/></svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56.108"><path d="M28.024.5a12.577 12.577 0 0 0-3.734 5.386 37.661 37.661 0 0 0-1.637 9.035 27.858 27.858 0 0 0-6.859-4.936 18.257 18.257 0 0 0-7.27-1.476s.207 6.711 4.354 11.278 12.236 6.991 12.236 6.991-8.187-4.173-14.341-3.857S.5 28.043.5 28.043a18.556 18.556 0 0 0 8.964 4.6c5.217.879 11.9-1.088 11.9-1.088s-6.635 1.963-9.846 5.883-3 9.794-3 9.794 6.224.632 10.639-3.016 7.021-11.573 7.021-11.573.553.983-1.494 4.795-1.756 5.545-1.615 7.308c.461 5.74 4.949 10.859 4.949 10.859a19.577 19.577 0 0 0 4.795-9.7c.733-5.473-1.863-12.2-1.863-12.2s2.229 7.124 6.341 10.5 10.105 3.016 10.105 3.016a24.193 24.193 0 0 0-2.022-8.027c-1.862-4.125-8.083-5.492-16.083-10.316 0 0 6.98 4.85 14.712 4.372a16.411 16.411 0 0 0 11.491-5.221 13.737 13.737 0 0 0-8.724-4.687c-5.523-.584-13.371 2.351-13.371 2.351a19.3 19.3 0 0 0 10.6-7.318c4.31-5.989 3.394-9.88 3.394-9.88s-4.449-.861-10.105 3.541-8 12.5-8 12.5 3.841-7.632 3.522-13.646S28.024.5 28.024.5Z"/></svg></div>'
  }
  updatePosition() {
    this.updateRoadLines()
    this.updateTrees()
    this.updateHouses()
    this.updateLights()
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
    this.timeout = setTimeout(() => this.draw(), 40)
  }
  stop() {
    this.timeout && clearTimeout(this.timeout)
  }
  destroy() {
    this.lightsPerLine = null
    this.speed = null
    this.treeOffset = null
    this.houseLeftOffset = null
    this.houseRightOffset = null
    this.timeout && clearTimeout(this.timeout)
    this.timeout = null
  }
}
class UpdaterView {
  constructor (upstreamVersionUrl, updateUrl) {
    this.model = new Updater(upstreamVersionUrl)
    this.updateUrl = updateUrl
  }
  showUpdateDialogIfNeeded() {
    this.model.isUpdateNeeded()
      .then(isUpdateNeeded => {
        if (isUpdateNeeded) this.showUpdateDialog()
      })
  }
  showUpdateDialog() {
    if (confirm('New version available. Do you want to update the App?')) location.href = this.model.getUpdateUrl(this.updateUrl)
  }
  destroy() {
    this.model.destroy()
    this.updateUrl = null
  }
}
window.asafonov = {}
window.asafonov.version = '0.1'
window.asafonov.messageBus = new MessageBus()
window.asafonov.events = {
  GAME_OVER: 'GAME_OVER',
  ENEMY_DESTROYED: 'ENEMY_DESTROYED',
  ENEMY_HALFWAY: 'ENEMY_HALFWAY'
}
window.asafonov.settings = {
}
window.asafonov.player = null
window.onerror = (msg, url, line) => {
  alert(`${msg} on line ${line}`)
}
document.addEventListener("DOMContentLoaded", function (event) {
  const updaterView = new UpdaterView('https://raw.githubusercontent.com/asafonov/accelerace/master/VERSION.txt', 'https://github.com/asafonov/accelerace.apk/releases/download/{VERSION}/app-release.apk')
  updaterView.showUpdateDialogIfNeeded()
  const gameView = new GameView()
})
