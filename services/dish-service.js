const dishRepository = require('../repositories/cloud/dish-repository')
const favoriteRepository = require('../utils/favorite')

function createDishService({ dishes, favorites }) {
  async function loadFavoriteIds() {
    try {
      return { favoriteIds: await favorites.getFavoriteIds(), syncError: null }
    } catch (error) {
      return { favoriteIds: favorites.getFavoriteIdsSync(), syncError: error }
    }
  }

  async function loadCatalog() {
    const [dishList, favoriteState] = await Promise.all([
      dishes.listDishes(),
      loadFavoriteIds()
    ])
    return {
      ...favoriteState,
      dishes: applyFavoriteState(dishList, favoriteState.favoriteIds)
    }
  }

  async function loadDetail(id) {
    const [dish, favoriteState] = await Promise.all([
      dishes.getDishDetail(id),
      loadFavoriteIds()
    ])
    return {
      ...favoriteState,
      dish: dish ? applyFavoriteState([dish], favoriteState.favoriteIds)[0] : null
    }
  }

  async function setFavorite(dishId, isFavorite) {
    const favoriteIds = await favorites.setFavorite(dishId, isFavorite)
    return {
      favoriteIds,
      isFavorite: favoriteIds.includes(Number(dishId))
    }
  }

  return { loadCatalog, loadDetail, loadFavoriteIds, setFavorite }
}

function applyFavoriteState(dishList, favoriteIds) {
  const favoriteSet = new Set(favoriteIds)
  return dishList.map(dish => ({ ...dish, isFavorite: favoriteSet.has(Number(dish.id)) }))
}

module.exports = {
  ...createDishService({ dishes: dishRepository, favorites: favoriteRepository }),
  createDishService,
  applyFavoriteState
}
