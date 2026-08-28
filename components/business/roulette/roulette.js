const {
  normalizeDegrees,
  normalizeWheelItems,
  buildSectorLayout,
  getSpinTarget,
  truncateWheelLabel
} = require('./roulette-layout')

Component({
  properties: {
    items: { type: Array, value: [], observer: 'onItemsChange' },
    selectedId: { type: String, value: '', observer: 'onSpinInputChange' },
    spinToken: { type: Number, value: 0, observer: 'onSpinInputChange' },
    duration: { type: Number, value: 2400 },
    centerText: { type: String, value: '准备', observer: 'onCenterTextChange' },
    emptyText: { type: String, value: '暂无候选' }
  },

  data: {
    hasItems: false,
    rotation: 0,
    transitionMs: 0,
    spinning: false,
    displayCenterText: '准备',
    accessibleLabel: '转盘暂无候选'
  },

  lifetimes: {
    ready() {
      this._ready = true
      this._lastSpinToken = 0
      this.prepareItems(this.properties.items)
      this.trySpin()
    },

    detached() {
      this._ready = false
      if (this._finishTimer) clearTimeout(this._finishTimer)
    }
  },

  methods: {
    onItemsChange(items) {
      if (!this._ready) return
      this.prepareItems(items)
      wx.nextTick(() => this.trySpin())
    },

    onSpinInputChange() {
      if (!this._ready) return
      wx.nextTick(() => this.trySpin())
    },

    onCenterTextChange(centerText) {
      if (!this._ready || this.data.spinning) return
      this.setData({ displayCenterText: centerText || '准备' })
    },

    prepareItems(items) {
      this._wheelItems = normalizeWheelItems(items)
      const labels = this._wheelItems.map(item => item.label).join('、')
      this.setData({
        hasItems: this._wheelItems.length > 0,
        displayCenterText: this.properties.centerText,
        accessibleLabel: labels ? `转盘候选：${labels}` : '转盘暂无候选'
      }, () => this.scheduleDraw())
    },

    scheduleDraw() {
      if (!this._ready || !this.data.hasItems || this._drawScheduled) return
      this._drawScheduled = true
      wx.nextTick(() => {
        this._drawScheduled = false
        this.drawWheel()
      })
    },

    drawWheel() {
      this.createSelectorQuery()
        .select('#rouletteCanvas')
        .fields({ node: true, size: true })
        .exec(result => {
          const target = result && result[0]
          if (!target || !target.node || !target.width || !target.height) {
            this.triggerEvent('rendererror', { reason: 'canvas_unavailable' })
            return
          }
          const canvas = target.node
          const context = canvas.getContext('2d')
          const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : { pixelRatio: 1 }
          const pixelRatio = Math.max(1, Number(windowInfo.pixelRatio) || 1)
          canvas.width = target.width * pixelRatio
          canvas.height = target.height * pixelRatio
          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
          paintSectors(context, target.width, target.height, this._wheelItems)
        })
    },

    trySpin() {
      const token = Number(this.properties.spinToken) || 0
      if (!token || token === this._lastSpinToken) return
      const selectedId = String(this.properties.selectedId || '')
      const selectedIndex = (this._wheelItems || []).findIndex(item => item.id === selectedId)
      if (selectedIndex < 0) return
      this._lastSpinToken = token
      if (this.data.spinning) {
        this.triggerEvent('blocked', { reason: 'spinning', spinToken: token })
        return
      }

      const duration = clampDuration(this.properties.duration)
      const targetRotation = getSpinTarget(this.data.rotation, this._wheelItems.length, selectedIndex)
      const selectedItem = this._wheelItems[selectedIndex]
      this.setData({
        spinning: true,
        transitionMs: 0,
        displayCenterText: '转动中',
        accessibleLabel: '转盘转动中'
      }, () => {
        wx.nextTick(() => {
          this.setData({ transitionMs: duration, rotation: targetRotation })
          this._finishTimer = setTimeout(() => {
            this._finishTimer = null
            this.finishSpin(selectedItem, selectedIndex, token, targetRotation)
          }, duration)
        })
      })
    },

    finishSpin(selectedItem, selectedIndex, spinToken, targetRotation) {
      this.setData({
        spinning: false,
        transitionMs: 0,
        rotation: normalizeDegrees(targetRotation),
        displayCenterText: this.properties.centerText,
        accessibleLabel: `转盘结果：${selectedItem.label}`
      }, () => {
        this.triggerEvent('finish', {
          item: selectedItem,
          selectedIndex,
          spinToken
        })
      })
    }
  }
})

function paintSectors(context, width, height, items) {
  const sectors = buildSectorLayout(items)
  if (sectors.length === 0) return
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.max(0, Math.min(width, height) / 2 - 2)
  context.clearRect(0, 0, width, height)

  sectors.forEach(sector => {
    context.beginPath()
    context.moveTo(centerX, centerY)
    context.arc(centerX, centerY, radius, sector.startAngle, sector.endAngle)
    context.closePath()
    context.fillStyle = sector.color
    context.fill()
    context.strokeStyle = 'rgba(255, 255, 255, 0.78)'
    context.lineWidth = sectors.length > 16 ? 1 : 2
    context.stroke()
    paintLabel(context, centerX, centerY, radius, sector, sectors.length)
  })

  context.beginPath()
  context.arc(centerX, centerY, radius - 1, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(40, 40, 50, 0.12)'
  context.lineWidth = 2
  context.stroke()
}

function paintLabel(context, centerX, centerY, radius, sector, itemCount) {
  const label = truncateWheelLabel(sector.label, itemCount)
  const fontSize = itemCount <= 4 ? 15 : itemCount <= 8 ? 13 : itemCount <= 12 ? 11 : 10
  const textRadius = itemCount > 12 ? radius * 0.72 : radius * 0.64
  let textAngle = sector.centerAngle + Math.PI / 2
  const normalizedCenter = ((sector.centerAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  if (normalizedCenter > 0 && normalizedCenter < Math.PI) textAngle += Math.PI

  context.save()
  context.translate(
    centerX + Math.cos(sector.centerAngle) * textRadius,
    centerY + Math.sin(sector.centerAngle) * textRadius
  )
  context.rotate(textAngle)
  context.fillStyle = '#ffffff'
  context.font = `600 ${fontSize}px sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.shadowColor = 'rgba(0, 0, 0, 0.2)'
  context.shadowBlur = 2
  context.fillText(label, 0, 0)
  context.restore()
}

function clampDuration(value) {
  const duration = Number(value)
  if (!Number.isFinite(duration)) return 2400
  return Math.max(0, Math.min(4000, Math.round(duration)))
}
