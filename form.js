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
          msg.textContent = '已收到。我们一般在 1–2 个工作日内以邮件回复；如未收到，请查看垃圾邮件箱。';
          f.reset();
          if (window.gtag) { try { gtag('event', 'generate_lead'); } catch (e) {} }
        })
        .catch(function () {
          msg.className = 'form-msg err';
          var mail = f.getAttribute('data-mailto');
          msg.innerHTML = '发送未成功（可能是网络或浏览器插件拦截）。请改用 <a href="' + mail + '">电子邮件</a>，将上述内容粘贴发送。';
        })
        .then(function () { btn.disabled = false; btn.textContent = old; });
    });
  });
})();
