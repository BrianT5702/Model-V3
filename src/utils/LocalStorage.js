export function saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      console.log(`${key} saved to localStorage.`);
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }
  
  export function loadFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return null;
    }
  }  
  