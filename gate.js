/* Windows-only check before the visitor reaches the download or checkout page. */
(function () {
  var ar = (document.documentElement.lang || '').indexOf('ar') === 0;
  var T = ar ? {
    title: 'قبل أن تكمل',
    body: 'يعمل البرنامج فقط على كمبيوتر بنظام ويندوز 10 أو 11 (64 بت)، مكتبي أو لابتوب.',
    no: 'لا يعمل على: ماك، لينكس، كروم بوك، آيفون، آيباد، أندرويد.',
    warn: 'يبدو أنك تتصفح الآن من جهاز {os}. البرنامج لن يعمل على هذا الجهاز. أكمل فقط إن كنت ستستخدمه على كمبيوتر بنظام ويندوز.',
    check: 'أؤكد أنني سأستخدم البرنامج على كمبيوتر بنظام ويندوز 10 أو 11.',
    trial: 'متابعة إلى التحميل المجاني',
    buy: 'متابعة إلى صفحة الشراء',
    cancel: 'إلغاء',
    os: { mac: 'ماك', ios: 'آيفون أو آيباد', android: 'أندرويد', linux: 'لينكس', chromeos: 'كروم بوك' }
  } : {
    title: 'Before you continue',
    body: 'PDF BOOK Split runs only on a Windows 10 or 11 computer (64-bit), desktop or laptop.',
    no: 'It does not run on: Mac, Linux, Chromebook, iPhone, iPad, Android.',
    warn: 'You seem to be browsing from {os}. The program will not run on this device. Continue only if you will use it on a Windows computer.',
    check: 'I confirm I will use the program on a Windows 10 or 11 computer.',
    trial: 'Continue to free download',
    buy: 'Continue to checkout',
    cancel: 'Cancel',
    os: { mac: 'a Mac', ios: 'an iPhone or iPad', android: 'an Android device', linux: 'Linux', chromeos: 'a Chromebook' }
  };

  function detectOS() {
    var ua = navigator.userAgent || '';
    var p = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '').toLowerCase();
    if (/iphone|ipad|ipod/i.test(ua) || (p === 'macintel' && navigator.maxTouchPoints > 1)) return 'ios';
    if (/android/i.test(ua)) return 'android';
    if (/cros/i.test(ua) || p.indexOf('chrome os') > -1) return 'chromeos';
    if (/windows/i.test(ua) || p.indexOf('win') === 0) return 'windows';
    if (/mac/i.test(ua) || p.indexOf('mac') === 0) return 'mac';
    if (/linux/i.test(ua) || p.indexOf('linux') > -1) return 'linux';
    return 'unknown';
  }

  var dlg, target = '';
  function build() {
    dlg = document.createElement('div');
    dlg.className = 'gate';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-labelledby', 'gate-title');
    dlg.hidden = true;
    dlg.innerHTML =
      '<div class="gate-box">' +
      '<h2 id="gate-title"></h2>' +
      '<p class="gate-body"></p>' +
      '<p class="gate-no"></p>' +
      '<p class="gate-warn" hidden></p>' +
      '<label class="gate-check"><input type="checkbox"> <span></span></label>' +
      '<div class="gate-actions"><a class="btn gate-go" aria-disabled="true"></a>' +
      '<button type="button" class="btn alt gate-cancel"></button></div></div>';
    document.body.appendChild(dlg);
    dlg.querySelector('#gate-title').textContent = T.title;
    dlg.querySelector('.gate-body').textContent = T.body;
    dlg.querySelector('.gate-no').textContent = T.no;
    dlg.querySelector('.gate-check span').textContent = T.check;
    dlg.querySelector('.gate-cancel').textContent = T.cancel;
    var cb = dlg.querySelector('input'), go = dlg.querySelector('.gate-go');
    cb.addEventListener('change', function () {
      go.setAttribute('aria-disabled', cb.checked ? 'false' : 'true');
    });
    go.addEventListener('click', function (e) {
      if (!cb.checked) { e.preventDefault(); cb.focus(); }
    });
    dlg.querySelector('.gate-cancel').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.hidden) close(); });
  }
  function open(link) {
    if (!dlg) build();
    target = link.getAttribute('href');
    var kind = link.getAttribute('data-gate');
    var go = dlg.querySelector('.gate-go'), cb = dlg.querySelector('input');
    go.textContent = kind === 'trial' ? T.trial : T.buy;
    go.setAttribute('href', target);
    cb.checked = false;
    go.setAttribute('aria-disabled', 'true');
    var os = detectOS(), w = dlg.querySelector('.gate-warn');
    if (T.os[os]) { w.textContent = T.warn.replace('{os}', T.os[os]); w.hidden = false; } else { w.hidden = true; }
    dlg.hidden = false;
    document.body.style.overflow = 'hidden';
    cb.focus();
  }
  function close() { dlg.hidden = true; document.body.style.overflow = ''; }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-gate]');
    if (!a) return;
    e.preventDefault();
    open(a);
  });
})();
