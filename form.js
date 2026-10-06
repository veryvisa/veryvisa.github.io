/* 微出国服务站 · 咨询表单（FormSubmit AJAX）。无依赖；失败时露出 mailto 兜底。 */
(function () {
  function qs(name) {
    try { return new URLSearchParams(location.search).get(name) || ''; } catch (e) { return ''; }
  }
  var forms = document.querySelectorAll('form[data-vv-form]');
  Array.prototype.forEach.call(forms, function (f) {
    var msg = f.querySelector('.form-msg');
    var btn = f.querySelector('button[type=submit]');
    function set(name, v) { var el = f.querySelector('[name="' + name + '"]'); if (el) el.value = v; }
    set('page', location.href.split('#')[0]);
    set('referrer', document.referrer || '');
    set('utm_source', qs('utm_source'));
    set('utm_medium', qs('utm_medium'));
    set('utm_campaign', qs('utm_campaign'));
    // 从页面里的「咨询这项」按钮带过来的服务选项
    var pre = qs('service');
    if (pre) { var sel = f.querySelector('select[name=service]'); if (sel) sel.value = pre; }
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!f.reportValidity()) return;
      if ((f.querySelector('[name=_honey]') || {}).value) return; // 机器人
      set('submitted_at', new Date().toISOString());
      var data = {};
      Array.prototype.forEach.call(f.elements, function (el) {
        if (el.name && el.type !== 'submit') data[el.name] = el.value;
      });
      btn.disabled = true; var old = btn.textContent; btn.textContent = '正在发送…';
      msg.className = 'form-msg'; msg.textContent = '';
      fetch(f.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          var good = res.ok && (res.j.success === true || res.j.success === 'true');
          if (!good) throw new Error((res.j && res.j.message) || 'send failed');
          msg.className = 'form-msg ok';
          msg.textContent = '收到了。我们会在 1–2 个工作日内用你留的邮箱回复；如果没看到，请看一下垃圾邮件箱。';
          f.reset();
          if (window.gtag) { try { gtag('event', 'generate_lead'); } catch (e) {} }
        })
        .catch(function () {
          msg.className = 'form-msg err';
          var mail = f.getAttribute('data-mailto');
          msg.innerHTML = '这次没发出去（可能是网络或拦截插件）。可以直接 <a href="' + mail + '">发邮件给我们</a>，把刚才写的内容贴进去就行。';
        })
        .then(function () { btn.disabled = false; btn.textContent = old; });
    });
  });
})();
