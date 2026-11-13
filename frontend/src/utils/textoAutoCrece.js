// Regla de todo el portal (pedida por @human 2026-11-14): todo cuadro de texto crece solo conforme se escribe,
// para ver la información completa sin agrandarlo a mano. Se aplica una vez al iniciar y cubre todos los
// <textarea> presentes y futuros. Navegadores nuevos usan CSS (field-sizing en index.css); esto es el respaldo.
// Para excluir uno: <textarea data-tamano-fijo>.
const MAX_VH = 0.7;

export function ajustarAltura(el) {
  if (!el || el.tagName !== 'TEXTAREA' || el.hasAttribute('data-tamano-fijo')) return;
  el.style.height = 'auto';
  const maximo = window.innerHeight * MAX_VH;
  const alto = el.scrollHeight + 2;
  el.style.height = `${Math.min(alto, maximo)}px`;
  el.style.overflowY = alto > maximo ? 'auto' : 'hidden';
}

export function activarTextoAutoCrece(raiz = document) {
  const todos = (nodo) => (nodo.querySelectorAll ? nodo.querySelectorAll('textarea') : []);
  raiz.addEventListener('input', (e) => ajustarAltura(e.target), true);
  raiz.addEventListener('focusin', (e) => ajustarAltura(e.target), true);
  // Textos que llegan sin escribir (al abrir un registro): se ajustan al aparecer o cambiar.
  const observador = new MutationObserver((cambios) => {
    cambios.forEach((c) => {
      c.addedNodes.forEach((n) => {
        if (n.tagName === 'TEXTAREA') ajustarAltura(n);
        todos(n).forEach(ajustarAltura);
      });
      if (c.type === 'characterData' && c.target.parentElement?.tagName === 'TEXTAREA') ajustarAltura(c.target.parentElement);
    });
  });
  observador.observe(raiz.body || raiz, { childList: true, subtree: true, characterData: true });
  // React cambia el valor sin evento: revisión ligera periódica solo de los visibles.
  setInterval(() => todos(raiz).forEach((el) => {
    if (el.offsetParent && el.dataset.ultimoValor !== el.value) {
      el.dataset.ultimoValor = el.value;
      ajustarAltura(el);
    }
  }), 800);
}
