import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@ahorroya:price-favorites';

export async function loadFavorites() {
  const stored = await AsyncStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function saveFavorites(favorites) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export async function toggleFavorite(favorites, product) {
  const exists = favorites.includes(product);
  const nextFavorites = exists
    ? favorites.filter((item) => item !== product)
    : [product, ...favorites].slice(0, 8);

  await saveFavorites(nextFavorites);
  return nextFavorites;
}
