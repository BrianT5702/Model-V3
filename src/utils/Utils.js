export function validateInputs(...inputs) {
    return inputs.every((input) => parseFloat(input) > 0 && !isNaN(parseFloat(input)));
  }
  
  export function generateUniqueId() {
    return `id_${Date.now()}`;
  }
  