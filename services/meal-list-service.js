const mealListRepository = require('../repositories/cloud/meal-list-repository')

function createMealListService(repository) {
  async function loadMealList() {
    const items = await repository.listItems()
    return {
      items,
      count: items.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
    }
  }

  function getSummary() {
    return repository.getSummary()
  }

  async function addDish(dish, quantity = 1) {
    await repository.addDish(getDishId(dish), quantity)
    return getSummary()
  }

  async function increaseDishQuantity(dishId) {
    await repository.increaseDish(dishId)
    return getSummary()
  }

  async function decreaseDishQuantity(dishId) {
    await repository.decreaseDish(dishId)
    return getSummary()
  }

  async function removeDish(dishId) {
    await repository.removeDish(dishId)
    return getSummary()
  }

  async function clearMealList() {
    await repository.clear()
    return { count: 0 }
  }

  return { loadMealList, getSummary, addDish, increaseDishQuantity, decreaseDishQuantity, removeDish, clearMealList }
}

function getDishId(dish) {
  return Number(dish && (dish.dishId || dish.foodId || dish.id))
}

module.exports = {
  ...createMealListService(mealListRepository),
  createMealListService,
  getDishId
}
