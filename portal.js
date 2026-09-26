(() => {
  const input = document.querySelector('#site-filter');
  const cards = [...document.querySelectorAll('#directory ~ .grid .card')];
  const count = document.querySelector('#site-count');
  if (!input || !count) return;
  document.querySelector('.directory-search').hidden = false;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLocaleLowerCase();
    let n = 0;
    for (const card of cards) {
      card.hidden = !card.textContent.toLocaleLowerCase().includes(q);
      if (!card.hidden) n++;
    }
    count.textContent = q ? `找到 ${n} 个站；清空搜索可显示全部。` : `共 ${cards.length} 个专题站。`;
  });
})();
