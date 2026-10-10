(function(){
var SB_URL='https://eifjsmlvvlarqwuuhaxt.supabase.co';
var SB_KEY='sb_publishable_Pf6tTcvMceb6agyh_b8weg_X-sj-BbX';
var $=function(id){return document.getElementById(id)};
function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n}
var sb=null;try{sb=supabase.createClient(SB_URL,SB_KEY)}catch(e){}
window.EL_SB=sb;

/* menu mobile */
var bg=$('burger'),lk=$('links');
if(bg&&lk)bg.addEventListener('click',function(){var o=lk.classList.toggle('open');bg.setAttribute('aria-expanded',o?'true':'false')});
if(bg&&lk){
  var closeMenu=function(){lk.classList.remove('open');bg.setAttribute('aria-expanded','false')};
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&lk.classList.contains('open')){closeMenu();bg.focus()}});
  lk.addEventListener('click',function(e){if(e.target.tagName==='A')closeMenu()});
}

/* application installable */
if('serviceWorker' in navigator)window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})});
var dp=null,inst=$('inst');
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();dp=e;if(inst)inst.hidden=false});
if(inst)inst.addEventListener('click',function(e){e.preventDefault();if(dp){dp.prompt();dp=null;inst.hidden=true}});
var ios=/iphone|ipad|ipod/i.test(navigator.userAgent),stand=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||navigator.standalone;
var note=$('iosnote');if(note&&ios&&!stand)note.hidden=false;

/* formulaire de contact */
var form=$('f');
var t0=Date.now();
if(form){
  var qs=new URLSearchParams(location.search),o=qs.get('offre'),v=qs.get('vehicule');
  if(o&&$('svc'))$('svc').value=o;
  if(v&&$('fmsg'))$('fmsg').value='Véhicule souhaité : '+v+'\n';
  var w=qs.get('souhait');
  if(w&&$('fmsg')&&!v)$('fmsg').value='Sélection souhaitée : '+w.slice(0,180)+'\n';
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    if($('hp').value||Date.now()-t0<2000){form.style.display='none';$('ok').style.display='block';return}
    var btn=$('fbtn'),er=$('err');
    er.style.display='none';btn.disabled=true;btn.textContent='Envoi en cours…';
    var ok=false;
    try{
      var r=await sb.from('requests').insert({
        full_name:$('fname').value.trim(),
        email:$('femail').value.trim(),
        offer:$('svc').value||null,
        message:$('fmsg').value.trim()||null,
        urgent:$('furg').checked
      });
      ok=!r.error;
    }catch(x){ok=false}
    if(!ok){
      er.textContent="Votre demande n'a pas pu être envoyée. Écrivez-nous à contact@elsignature.com.";
      er.style.display='block';btn.disabled=false;btn.textContent='Envoyer ma demande';return;
    }
    form.style.display='none';$('ok').style.display='block';
  });
}

/* véhicules */
var SYM={EUR:'€',USD:'$',MGA:'Ar'};
async function loadVehicles(){
  var box=$('vlist'),data=[];
  try{
    var r=await sb.from('vehicles').select('*').order('sort_order').order('created_at');
    if(!r.error)data=r.data||[];
  }catch(e){}
  box.textContent='';
  if(!data.length){
    box.style.display='block';
    box.appendChild(el('p','note',"Notre sélection de véhicules arrive bientôt. Décrivez-nous votre besoin de transport et nous vous proposons la bonne solution."));
    var b=el('a','btn','Faire une demande de transport');b.href='/contact.html?offre=Transport';box.appendChild(b);return;
  }
  data.forEach(function(v){
    var card=el('div','veh'),ph=el('div','vph'),photos=(v.photos||[]).filter(function(u){return /^https:\/\//.test(u)});
    if(photos.length){
      var main=el('img','main');main.src=photos[0];main.alt=v.name;main.loading='lazy';ph.appendChild(main);
      if(photos.length>1){
        var th=el('div','vth');
        photos.forEach(function(u,i){
          var t=el('img',i===0?'on':'');t.src=u;t.alt='';t.loading='lazy';
          t.addEventListener('click',function(){main.src=u;th.querySelectorAll('img').forEach(function(x){x.className=''});t.className='on'});
          th.appendChild(t);
        });
        ph.appendChild(th);
      }
    }else{ph.appendChild(el('div','nophoto','Photo à venir'))}
    card.appendChild(ph);
    var body=el('div','vbody');
    body.appendChild(el('h3',null,v.name));
    var meta=[];
    if(v.category)meta.push(v.category);
    if(v.seats)meta.push(v.seats+' places');
    if(v.luggage)meta.push(v.luggage+' bagages');
    meta.push(v.with_driver?'Avec chauffeur':'Sans chauffeur');
    body.appendChild(el('p','vmeta',meta.join(' · ')));
    if(v.description)body.appendChild(el('p','vd',v.description));
    if(v.features&&v.features.length){var ul=el('ul','chips');v.features.forEach(function(f){ul.appendChild(el('li',null,f))});body.appendChild(ul)}
    var price=(v.price_on_request||v.price==null)?'Prix sur demande':Number(v.price).toLocaleString('fr-FR')+' '+(SYM[v.currency]||v.currency)+' '+v.price_unit;
    body.appendChild(el('div','vprice',price));
    var btn=el('a','btn','Demander ce véhicule');
    btn.href='/contact.html?offre=Transport&vehicule='+encodeURIComponent(v.name);
    body.appendChild(btn);card.appendChild(body);box.appendChild(card);
  });
}
if($('vlist')){if(sb)loadVehicles();else{$('vlist').textContent='';$('vlist').appendChild(el('p','note','Les véhicules ne peuvent pas être affichés pour le moment.'))}}
})();
