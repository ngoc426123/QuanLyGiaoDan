(function(){
  var btn = document.getElementById('btnThemeToggle');
  if (!btn) return;
  function setTheme(t){
    if (t === 'dark') document.documentElement.classList.add('theme-dark');
    else document.documentElement.classList.remove('theme-dark');
    try { localStorage.setItem('theme', t); } catch(e){}
  }
  btn.addEventListener('click', function(){
    var current = document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
})();
