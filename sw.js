var V='els-v16';
var SHELL=['/','/index.html','/admin.html','/style.css','/site.js','/configurateur.js','/catalogue.js','/destinations.html','/offre.html','/signature.html','/logo-mark.png','/icon-192.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==V}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  var r=e.request;
  if(r.method!=='GET')return;
  var u=new URL(r.url);
  if(u.origin!==location.origin)return; // jamais la base de données
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(function(res){if(res&&res.ok){var c=res.clone();caches.open(V).then(function(ch){ch.put(r,c)})}return res})
      .catch(function(){return caches.match(r).then(function(m){return m||caches.match('/index.html')})}));
    return;
  }
  // fichiers du site : on sert la copie en cache et on la met à jour en arrière-plan
  e.respondWith(caches.match(r).then(function(m){
    var net=fetch(r).then(function(res){if(res&&res.ok){var c=res.clone();caches.open(V).then(function(ch){ch.put(r,c)})}return res}).catch(function(){return m});
    return m||net;
  }));
});
