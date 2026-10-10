/* EL SIGNATURE : affichage public du catalogue (destinations, Signatures, offres).
   Lecture seule via la clé publique ; la base ne renvoie que les éléments actifs.
   Aucun prix calculé : seul le prix indicatif saisi dans l'administration est affiché. */
(function(){
var sb=window.EL_SB;
var $=function(id){return document.getElementById(id)};
function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n}
function okUrl(u){return typeof u==='string'&&/^(https:\/\/|\/[^\/])[^\s]*$/.test(u)}
var SYM={EUR:'€',USD:'$',MGA:'Ar'};
var AVAIL={available:'Disponible',on_request:'Sur demande',unavailable:'Indisponible'};

function priceText(o){
  var t=o.public_price_type;
  if(!t||t==='on_request'||o.public_price==null)return o.public_label||'Prix sur demande';
  var n=Number(o.public_price).toLocaleString('fr-FR')+' '+(SYM[o.public_price_currency]||o.public_price_currency||'');
  var pre={from:'À partir de ',fixed:'',per_night:'',per_person:''}[t]||'';
  var suf={per_night:' par nuit',per_person:' par personne'}[t]||'';
  return pre+n+suf;
}
function photo(url,alt,cls){
  var box=el('div','vph');
  if(okUrl(url)){var i=el('img','main');i.src=url;i.alt=alt||'';i.loading='lazy';box.appendChild(i)}
  else box.appendChild(el('div','nophoto','Photo à venir'));
  return box;
}
function ask(label,text,svc){
  var a=el('a','btn',label);
  a.href='/contact.html?offre='+encodeURIComponent(svc||'Signature Journey')+'&souhait='+encodeURIComponent(String(text).slice(0,180));
  return a;
}
function offerHref(o){return '/offre.html?o='+encodeURIComponent(o.slug||'')}
async function get(table,q){
  try{var r=await q(sb.from(table));return r.error?[]:(r.data||[])}catch(e){return[]}
}

/* ---- bande « à la une » sur la page Voyages (cachée s'il n'y a rien) ---- */
async function strip(){
  var sec=$('dfeat-sec'),box=$('dfeat');
  var data=await get('destinations',function(t){return t.select('*').eq('featured',true).order('sort_order').order('created_at').limit(6)});
  if(!data.length)return;
  data.forEach(function(d){
    var c=el('a','veh dlink');c.href='/destinations.html?d='+encodeURIComponent(d.slug);
    c.appendChild(photo(d.image_url,d.name));
    var b=el('div','vbody');b.appendChild(el('h3',null,d.name));
    var m=[d.region,d.country].filter(Boolean).join(' · ');if(m)b.appendChild(el('p','vmeta',m));
    if(d.short_description)b.appendChild(el('p','vd',d.short_description));
    c.appendChild(b);box.appendChild(c);
  });
  sec.hidden=false;
}

/* ---- page Destinations ---- */
async function page(){
  var dl=$('dlist'),sl=$('slist'),ol=$('olist');
  var res=await Promise.all([
    get('destinations',function(t){return t.select('*').order('sort_order').order('created_at')}),
    get('service_categories',function(t){return t.select('*').order('sort_order').order('created_at')}),
    get('offers',function(t){return t.select('*').order('sort_order').order('created_at')}),
    get('signatures',function(t){return t.select('*').order('sort_order').order('created_at')}),
    get('signature_items',function(t){return t.select('*').order('sort_order')})
  ]);
  var dests=res[0],cats=res[1],offers=res[2],sigs=res[3],items=res[4];
  var dById={},cById={},oById={};
  dests.forEach(function(d){dById[d.id]=d});cats.forEach(function(c){cById[c.id]=c});offers.forEach(function(o){oById[o.id]=o});
  var sel=new URLSearchParams(location.search).get('d'),current=null;
  dests.forEach(function(d){if(d.slug===sel)current=d.id});

  if(!dests.length&&!offers.length&&!sigs.length){
    $('cat-empty').hidden=false;
    ['dsec','ssec','osec'].forEach(function(i){$(i).hidden=true});
    return;
  }

  function drawDest(){
    dl.textContent='';
    var all=el('button','dchip'+(current===null?' on':''),'Toutes');all.type='button';
    all.addEventListener('click',function(){current=null;drawDest();drawOffers()});dl.appendChild(all);
    dests.forEach(function(d){
      var b=el('button','dchip'+(current===d.id?' on':''),d.name);b.type='button';
      b.addEventListener('click',function(){current=d.id;drawDest();drawOffers()});dl.appendChild(b);
    });
  }
  function drawBig(){
    var g=$('dgrid');g.textContent='';
    dests.forEach(function(d){
      var c=el('div','veh');c.appendChild(photo(d.image_url,d.name));
      var b=el('div','vbody');b.appendChild(el('h3',null,d.name));
      var m=[d.region,d.country].filter(Boolean).join(' · ');if(m)b.appendChild(el('p','vmeta',m));
      if(d.description||d.short_description)b.appendChild(el('p','vd',d.description||d.short_description));
      var bt=el('button','btn line-dark','Voir les offres');bt.type='button';
      bt.addEventListener('click',function(){current=d.id;drawDest();drawOffers();$('osec').scrollIntoView({behavior:'smooth'})});
      b.appendChild(bt);c.appendChild(b);g.appendChild(c);
    });
    $('dsec').hidden=!dests.length;
  }
  function drawOffers(){
    ol.textContent='';
    var list=offers.filter(function(o){return current===null||o.destination_id===current});
    if(!list.length){ol.appendChild(el('p','note','Aucune offre publiée pour cette destination pour le moment. Décrivez-nous votre projet et nous vous proposons la bonne sélection.'));return}
    list.forEach(function(o){
      var c=el('div','veh');c.appendChild(photo(o.main_image_url,o.title));
      var b=el('div','vbody');var h3=el('h3');var ha=el('a',null,o.title);ha.href=offerHref(o);h3.appendChild(ha);b.appendChild(h3);
      var m=[cById[o.service_category_id]&&cById[o.service_category_id].name,dById[o.destination_id]&&dById[o.destination_id].name,o.location].filter(Boolean);
      if(o.capacity)m.push(o.capacity+' pers.');
      b.appendChild(el('p','vmeta',m.join(' · ')));
      if(o.short_description||o.description)b.appendChild(el('p','vd',o.short_description||o.description));
      if(Array.isArray(o.features)&&o.features.length){var ul=el('ul','chips');o.features.forEach(function(f){ul.appendChild(el('li',null,String(f)))});b.appendChild(ul)}
      b.appendChild(el('div','vprice',priceText(o)));
      b.appendChild(el('p','vmeta',AVAIL[o.availability_status]||''));
      var more=el('a','btn line-dark','Voir le détail');more.href=offerHref(o);b.appendChild(more);
      if(o.availability_status!=='unavailable'){var rq=ask('Demander cette offre',o.title);rq.style.marginLeft='8px';b.appendChild(rq)}
      c.appendChild(b);ol.appendChild(c);
    });
  }
  function drawSigs(){
    sl.textContent='';
    var list=sigs;
    if(!list.length){$('ssec').hidden=true;return}
    list.forEach(function(s){
      var c=el('div','veh');c.appendChild(photo(s.hero_image_url,s.title));
      var b=el('div','vbody');b.appendChild(el('h3',null,s.title));
      if(s.subtitle)b.appendChild(el('p','vd',s.subtitle));
      var m=[dById[s.destination_id]&&dById[s.destination_id].name,s.duration_label,s.style].filter(Boolean);
      if(m.length)b.appendChild(el('p','vmeta',m.join(' · ')));
      if(s.description)b.appendChild(el('p','vd',s.description));
      var its=items.filter(function(i){return i.signature_id===s.id&&i.included&&oById[i.offer_id]});
      if(its.length){var ul=el('ul','chips');its.forEach(function(i){ul.appendChild(el('li',null,(i.section_title?i.section_title+' : ':'')+oById[i.offer_id].title))});b.appendChild(ul)}
      b.appendChild(ask('Demander cette Signature',s.title,'Signature Experience'));
      c.appendChild(b);sl.appendChild(c);
    });
  }
  drawDest();drawBig();drawOffers();drawSigs();
}


/* ---- page détail d'une offre ---- */
async function detail(){
  var slug=new URLSearchParams(location.search).get('o');
  var box=$('odet');
  function none(){box.hidden=true;$('ono').hidden=false}
  if(!slug)return none();
  var rows=await get('offers',function(t){return t.select('*').eq('slug',slug).limit(1)});
  var o=rows[0];if(!o)return none();
  var res=await Promise.all([
    get('destinations',function(t){return t.select('*').eq('id',o.destination_id).limit(1)}),
    get('service_categories',function(t){return t.select('*').eq('id',o.service_category_id).limit(1)}),
    get('offer_images',function(t){return t.select('*').eq('offer_id',o.id).order('sort_order')}),
    get('signature_items',function(t){return t.select('*').eq('offer_id',o.id).eq('included',true)})
  ]);
  var d=res[0][0],cat=res[1][0],imgs=res[2],its=res[3];
  document.title=o.title+' — EL SIGNATURE';
  $('otag').textContent=(cat&&cat.name?cat.name:'OFFRE').toUpperCase();
  $('ohead').textContent=o.title;
  var sub=[d&&d.name,o.location].filter(Boolean).join(' · ');$('osub').textContent=sub;

  var left=el('div','omedia');
  left.appendChild(photo(o.main_image_url,o.title));
  var extra=imgs.filter(function(i){return okUrl(i.image_url)});
  if(extra.length){var g=el('div','ogal');extra.forEach(function(i){var im=el('img');im.src=i.image_url;im.alt=i.alt_text||o.title;im.loading='lazy';g.appendChild(im)});left.appendChild(g)}

  var right=el('div','obody');
  var meta=[];if(cat&&cat.name)meta.push(cat.name);if(d&&d.name)meta.push(d.name);if(o.location)meta.push(o.location);if(o.capacity)meta.push(o.capacity+' pers.');
  if(meta.length)right.appendChild(el('p','vmeta',meta.join(' · ')));
  right.appendChild(el('div','vprice',priceText(o)));
  var av=AVAIL[o.availability_status];if(av)right.appendChild(el('p','vmeta',av));
  var txt=o.description||o.short_description;
  if(txt)String(txt).split(/\n{2,}/).forEach(function(p){right.appendChild(el('p','vd',p))});
  if(Array.isArray(o.features)&&o.features.length){
    right.appendChild(el('h3','osh','Ce que comprend cette offre'));
    var ul=el('ul','chips');o.features.forEach(function(f){ul.appendChild(el('li',null,String(f)))});right.appendChild(ul);
  }
  right.appendChild(el('p','note','Prix indicatif. Chaque demande reçoit une proposition personnalisée.'));
  if(o.availability_status!=='unavailable')right.appendChild(ask('Demander cette offre',o.title));
  if(d){var da=el('a','btn line-dark','Autres offres : '+d.name);da.href='/destinations.html?d='+encodeURIComponent(d.slug);da.style.marginLeft='8px';right.appendChild(da)}
  box.textContent='';box.appendChild(left);box.appendChild(right);

  if(its.length){
    var sigs=await get('signatures',function(t){return t.select('*').in('id',its.map(function(i){return i.signature_id}))});
    if(sigs.length){
      var sl=$('osiglist');
      sigs.forEach(function(s){
        var c=el('div','veh');c.appendChild(photo(s.hero_image_url,s.title));
        var b=el('div','vbody');b.appendChild(el('h3',null,s.title));
        if(s.subtitle)b.appendChild(el('p','vd',s.subtitle));
        b.appendChild(ask('Demander cette Signature',s.title,'Signature Experience'));
        c.appendChild(b);sl.appendChild(c);
      });
      $('osig').hidden=false;
    }
  }
}

if(!sb)return;
if($('dfeat'))strip();
if($('olist'))page();
if($('odet'))detail();
})();
