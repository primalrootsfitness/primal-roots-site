(function(){
  var amts=document.querySelectorAll('.amt[data-base]');
  function fmt(n){return '$'+Math.round(n)}
  function render(off){
    amts.forEach(function(el){
      var base=+el.dataset.base,price=Math.floor(base*(1-off/100)+1e-9),mo=el.hasAttribute('data-mo');
      var was=el.dataset.orig?+el.dataset.orig:base,saved=was-price;
      el.innerHTML=(saved>0?'<span class="was">'+fmt(was)+'</span>':'')+fmt(price)+(mo?'<small>/ mo</small>':'')+(saved>0?'<span class="save">Save '+fmt(saved)+(mo?' / mo':' / session')+'</span>':'');
    });
  }
  if(amts.length){
    var btns=document.querySelectorAll('.seg button');
    btns.forEach(function(b){b.addEventListener('click',function(){
      btns.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
      render(+b.dataset.off);
    })});
    render(0);
  }
  document.querySelectorAll('[data-copy]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var el=document.getElementById(btn.dataset.copy),txt=el.textContent.trim(),orig=btn.textContent;
      function done(){btn.textContent='Copied';setTimeout(function(){btn.textContent=orig},1600)}
      function fallback(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);btn.textContent='Selected';setTimeout(function(){btn.textContent=orig},1600)}
      try{navigator.clipboard.writeText(txt).then(done,fallback)}catch(e){fallback()}
    });
  });
})();
