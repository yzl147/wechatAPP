function toCurrentDish(dish) {
  if (!dish || typeof dish !== 'object') return null
  const currentDish = { ...dish }
  delete currentDish.price
  return currentDish
}

module.exports = { toCurrentDish }
