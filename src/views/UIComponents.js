export function createButton(id, label, onClick) {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }
  
  export function createInput(id, label, type = 'text', value = '') {
    const container = document.createElement('div');
  
    const inputLabel = document.createElement('label');
    inputLabel.setAttribute('for', id);
    inputLabel.textContent = label;
  
    const input = document.createElement('input');
    input.id = id;
    input.type = type;
    input.value = value;
  
    container.appendChild(inputLabel);
    container.appendChild(input);
  
    return container;
  }
  