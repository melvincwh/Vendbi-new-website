(() => {
  // Collect only on the public marketing domains, never previews or the portal.
  if (!['vendbi.com', 'www.vendbi.com'].includes(location.hostname)) return;
  const id = 'G-LF9P2WJGEB';
  const key = 'vendbi-analytics-consent';
  const banner = document.getElementById('analytics-consent');
  const settings = document.getElementById('analytics-settings');
  let choice;
  try { choice = localStorage.getItem(key); } catch { /* Storage can be unavailable. */ }
  let started = false;
  function start() {
    if (started || choice !== 'accepted') return;
    started = true;
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', id, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname,
      page_referrer: document.referrer ? new URL(document.referrer).origin : '',
      cookie_domain: location.hostname
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(tag);
  }
  function track(name, params) {
    if (choice === 'accepted' && started) window.gtag('event', name, params);
  }
  function choose(value) {
    choice = value;
    try { localStorage.setItem(key, value); } catch { /* Keep this page usable. */ }
    banner.hidden = true;
    if (value === 'accepted') start();
    else {
      window['ga-disable-' + id] = true;
      // Remove this site's GA cookies, then unload the already-loaded tag.
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) continue;
        for (const domain of ['', location.hostname, '.vendbi.com']) {
          document.cookie = name + '=; Max-Age=0; Path=/' + (domain ? '; Domain=' + domain : '');
        }
      }
      if (started) location.reload();
    }
    settings.focus();
  }
  settings.hidden = false;
  settings.addEventListener('click', () => {
    banner.hidden = false;
    banner.querySelector('button').focus();
  });
  banner.querySelector('[data-analytics-accept]').addEventListener('click', () => choose('accepted'));
  banner.querySelector('[data-analytics-decline]').addEventListener('click', () => choose('declined'));
  banner.hidden = choice === 'accepted' || choice === 'declined';
  start();
  document.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;
    const url = new URL(link.href, location.origin);
    if (url.hostname === 'app.vendbi.com' && url.pathname.startsWith('/ops')) {
      track('portal_login_click', {link_location: link.closest('footer') ? 'footer' : link.closest('header') ? 'header' : 'content'});
    } else if (['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(url.hostname)) {
      track('whatsapp_click', {});
    }
  });
  document.addEventListener('vendbi:lead-success', event => {
    const kind = event.detail?.kind;
    if (['demo', 'vbn', 'contact'].includes(kind)) track('generate_lead', {form_type: kind});
  });
})();
