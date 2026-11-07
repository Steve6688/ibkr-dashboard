'use strict';
// Northstar V2 - static read-only dashboard.
// NEVER send brokerage tokens, account credentials, or raw private data to this public repository.
const $ = id => document.getElementById(id);
const pct = n => Number.isFinite(n) ? n.toFixed(1) + '%' : '—';
const money = (n,dec=2) => Number.isFinite(Number(n)) ? '$' + Number(n).toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec}) : '—';
const signed = (n,dec=2) => !Number.isFinite(Number(n)) ? '—' : (Number(n)>0?'+':Number(n)<0?'−':'') + money(Math.abs(Number(n)),dec);
const signedPct = n => !Number.isFinite(n) ? '—' : (n>0?'+':n<0?'−':'') + Math.abs(n).toFixed(2) + '%';
const val = n => Number(n) || 0;
const safe = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const color = n => n>0?'positive':n<0?'negative':'neutral';
const escapeAttr=safe;
const coreSet = new Set(['VOO','QQQ','QQQM','SPY','VTI','IVV']);
const hues=['#75bfff','#5ddac6','#ac96ff','#f1b87b','#f17b9e','#96b0c5','#f1d772','#6fdfb0'];
const st={snapshot:null,history:[],tradeData:null,range:365,holdingFilter:'all',side:'all',shown:16,core:65,stable:20,rate:.07,monthly:200,localKinds:new Set(),loadTime:null};
let toastTimer;
function toast(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2800)}
function dateOnly(v){if(!v)return'—';let d=new Date(v);if(!Number.isFinite(d.getTime()))return String(v).slice(0,10);return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Singapore',month:'short',day:'numeric'}).format(d)}
function stamp(v){if(!v)return'—';const d=new Date(v);if(!Number.isFinite(d.getTime()))return String(v);return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)}
function tradingTime(v){if(!v)return'—';const d=new Date(v);if(!Number.isFinite(d.getTime()))return String(v).slice(0,16);return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Singapore',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)}
function pos(){return (st.snapshot?.holdings_readonly||[]).filter(x=>val(x.qty)>0&&val(x.mv)>0).sort((a,b)=>val(b.mv)-val(a.mv))}
function nav(){return val(st.snapshot?.account?.net_liq)}
function account(){return st.snapshot?.account||{}}
function dataAgeHours(){const t=new Date(st.snapshot?.generated_at).getTime();return Number.isFinite(t)?(Date.now()-t)/3600000:Infinity}
function structure(){
 const n=nav(),p=pos(),cash=val(account().cash),mv=p.reduce((a,x)=>a+val(x.mv),0),core=p.filter(x=>coreSet.has(x.symbol)).reduce((a,x)=>a+val(x.mv),0),semis=p.filter(x=>['MU','MRVL','NVDA','AMD','AVGO','SMH','SOXX'].includes(x.symbol)).reduce((a,x)=>a+val(x.mv),0),top=p[0]?val(p[0].mv):0;
 const tactical=Math.max(0,mv-core),stable=Math.max(0,cash);
 const v=n||1;
 return {n,p,cash,mv,core,stable,tactical,semis,top,corePct:core/v*100,stablePct:stable/v*100,tacticalPct:tactical/v*100,investedPct:mv/v*100,semisPct:semis/v*100,topPct:top/v*100,cashPct:cash/v*100,risky:cash/v<.05||semis/v>.20||tactical/v>.35};
}
function setText(id,txt){$(id).textContent=txt}
function setClass(id,cls){$(id).classList.remove('positive','negative','neutral');$(id).classList.add(cls)}
function navigate(k){
 document.querySelectorAll('.screen').forEach(x=>{const shown=x.id==='screen-'+k;x.hidden=!shown;x.classList.toggle('active',shown)});
 document.querySelectorAll('.bottom-nav button').forEach(x=>{const is=x.dataset.screen===k;x.classList.toggle('selected',is);x.setAttribute('aria-current',is?'page':'false')});
 window.scrollTo({top:0,behavior:'instant'});
 location.hash=k==='home'?'':'#'+k;
}
function initNavigation(){
 document.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.screen)));
 document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route)));
 const h=location.hash.slice(1);if(['home','holdings','plan','trades','insights'].includes(h))navigate(h);
}
function linePath(arr,w,h,pad){
 if(!arr.length)return'';
 const ys=arr.map(o=>Number(o.value)),mn=Math.min(...ys),mx=Math.max(...ys),range=mx-mn||Math.max(1,mx*.1),top=mx+range*.08,bot=mn-range*.08;
 return arr.map((o,i)=>(i===0?'M':'L')+(pad+(w-2*pad)*i/Math.max(1,arr.length-1)).toFixed(2)+' '+(pad+(h-2*pad)*(top-o.value)/(top-bot)).toFixed(2)).join(' ');
}
function renderHero(){
 const a=account();if(!st.snapshot)return;
 const s=structure(),dy=Number(a.today_pnl);
 setText('net-asset',money(a.net_liq));setText('hero-pnl','最近交易日 '+signed(dy));setClass('hero-pnl',color(dy));
 setText('hero-date',a.today_pnl_date?dateOnly(a.today_pnl_date):'盈亏日期未提供');
 setText('hero-source','IBKR 快照 · '+stamp(st.snapshot.generated_at));
 setText('stat-invested',money(s.mv,0));setText('stat-invested-note',pct(s.investedPct)+' 净资产');
 setText('stat-cash',money(s.cash,0));setText('stat-cash-note',pct(s.cashPct)+' 净资产');
 let yr=st.history.filter(x=>String(x.time).slice(0,4)===String(new Date().getFullYear()));
 let last=yr.at(-1)||st.history.at(-1);let twr=last&&Number.isFinite(Number(last.return_fraction))?Number(last.return_fraction)*100:NaN;
 setText('stat-ytd',Number.isFinite(twr)?signedPct(twr):'—');if(Number.isFinite(twr))setClass('stat-ytd',color(twr));
 setText('stat-risk',s.risky?'需降风险':'可控');setText('stat-risk-note',s.cashPct<5?'现金偏低，回撤缓冲弱':'持续关注集中度');
 const heroData=st.history.slice(-60);
 const svg=$('hero-line');
 if(heroData.length>1){const path=linePath(heroData,800,136,2);svg.innerHTML='<defs><linearGradient id="hfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#65c9ff" stop-opacity=".28"/><stop offset="100%" stop-color="#65c9ff" stop-opacity="0"/></linearGradient></defs><path d="'+path+' L798 136 L2 136 Z" fill="url(#hfade)"/><path d="'+path+'" fill="none" stroke="#82dcff" stroke-width="3"/>'}else svg.textContent='';
}
function renderChart(){
 const raw=st.history.slice().sort((a,b)=>String(a.time).localeCompare(String(b.time)));const arr=st.range>=365?raw:raw.slice(-st.range);
 if(!arr.length){$('nav-chart').innerHTML='';setText('chart-change','—');return}
 const first=val(arr[0].value),last=val(arr.at(-1).value),diff=last-first;
 setText('chart-change',signed(diff)+'  (净值差，含出入金)');setClass('chart-change',color(diff));
 setText('chart-from',dateOnly(arr[0].time+'T12:00:00+08:00'));setText('chart-to',dateOnly(arr.at(-1).time+'T12:00:00+08:00'));
 const w=620,h=240,p=16,path=linePath(arr,w,h,p);
 const hi=Math.max(...arr.map(x=>val(x.value))),lo=Math.min(...arr.map(x=>val(x.value)));
 const change=hi-lo||1;
 let g='<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#70b7fa" stop-opacity=".28"/><stop offset="1" stop-color="#70b7fa" stop-opacity="0"/></linearGradient></defs>';
 for(let i=0;i<=3;i++){const y=(p+(h-2*p)*i/3).toFixed(1);g+='<line x1="'+p+'" x2="'+(w-p)+'" y1="'+y+'" y2="'+y+'" stroke="#496079" stroke-opacity=".35" stroke-dasharray="4 7"/>'}
 g+='<path d="'+path+' L'+(w-p)+' '+(h-p)+' L'+p+' '+(h-p)+' Z" fill="url(#fade)"/><path d="'+path+'" fill="none" stroke="#84c9ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
 const lastY=p+(h-2*p)*(hi-val(arr.at(-1).value))/(change||1);
 g+='<circle cx="'+(w-p)+'" cy="'+lastY.toFixed(1)+'" r="5" fill="#a1e7ff" stroke="#2a6898" stroke-width="4"/>';
 $('nav-chart').innerHTML=g;
 const wrap=$('nav-chart');wrap.onpointermove=e=>{
  const rect=wrap.getBoundingClientRect(),ratio=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),idx=Math.round(ratio*(arr.length-1)),pt=arr[idx],tip=$('chart-tooltip');
  tip.hidden=false;tip.textContent=String(pt.time).slice(0,10)+' · '+money(pt.value);
  tip.style.left=Math.min(rect.width-122,Math.max(4,ratio*rect.width-56))+'px';
  tip.style.top='11px';
 };
 wrap.onpointerleave=()=>$('chart-tooltip').hidden=true;
}
function renderPulse(){
 if(!st.snapshot)return;const s=structure();
 const labels=[['核心',s.corePct,'#75bfff'],['成长 / 战术',s.tacticalPct,'#e5b77f'],['现金',s.cashPct,'#50d5c0']];
 $('pulse-bars').innerHTML=labels.map(x=>'<span title="'+safe(x[0]+' '+pct(x[1]))+'" style="width:'+Math.max(0,x[1]).toFixed(3)+'%;background:'+x[2]+'"></span>').join('');
 $('pulse-orb').textContent=s.risky?'!':'✓';$('pulse-orb').classList.toggle('ok',!s.risky);
 setText('pulse-title',s.risky?'风险集中，需要留意':'当前集中度相对可控');
 setText('pulse-subtitle',s.risky?'优先检查现金比例、半导体以及个股重叠':'仍需监测市场波动和资产相关性');
 $('pulse-list').innerHTML=[['核心指数',s.corePct],['成长 / 战术',s.tacticalPct],['现金缓冲',s.cashPct]].map(x=>'<div class="pulse-item"><small>'+x[0]+'</small><b>'+pct(x[1])+'</b></div>').join('');
}
function buildDigest(){
 if(!st.snapshot)return'尚未获取账户快照。';
 const s=structure(),a=account(),lines=[
  ['01','最近 IBKR 快照显示净资产 '+money(s.n)+'，现金 '+money(s.cash)+'（'+pct(s.cashPct)+'）。'],
  ['02','核心指数仓约 '+pct(s.corePct)+'，成长/战术仓约 '+pct(s.tacticalPct)+'，'+(s.cashPct<5?'防御现金不足 5%，优先评估风险缓冲。':'现金缓冲相对充足。')],
  ['03','当前半导体相关仓约 '+pct(s.semisPct)+'，第一大持仓约 '+pct(s.topPct)+'。注意指数与个股之间的相关性。'],
  ['04','下一步先评估仓位偏离与风险预算；不要把购买力 '+money(a.buying_power,0)+' 当成可用现金。']
 ];
 return lines.map(x=>x[0]+' '+x[1]).join('\n');
}
function renderDigest(){
 if(!st.snapshot)return;
 setText('digest-dt',dateOnly(st.snapshot.generated_at));
 $('digest-body').innerHTML=buildDigest().split('\n').map(x=>'<div class="digest-line"><em>'+safe(x.slice(0,2))+'</em><span>'+safe(x.slice(3))+'</span></div>').join('');
}
function renderHoldings(){
 if(!st.snapshot)return;const s=structure();setText('holdings-stamp',dateOnly(st.snapshot.generated_at));setText('position-total',money(s.mv));
 setText('holding-description',s.p.length+' 只持仓 · '+pct(s.investedPct)+' 净资产 · 不含现金与融资购买力');
 $('holding-allocation').innerHTML=s.p.map((x,i)=>'<span style="width:'+(val(x.mv)/Math.max(1,s.n)*100).toFixed(3)+'%;background:'+hues[i%hues.length]+'" title="'+safe(x.symbol)+'"></span>').join('')+'<span style="width:'+s.cashPct.toFixed(3)+'%;background:#677f95"></span>';
 $('allocation-legend').innerHTML=s.p.map((x,i)=>'<span><i class="legend-dot" style="background:'+hues[i%hues.length]+'"></i>'+safe(x.symbol)+' '+pct(val(x.mv)/Math.max(1,s.n)*100)+'</span>').join('')+'<span><i class="legend-dot" style="background:#677f95"></i>现金 '+pct(s.cashPct)+'</span>';
 let filtered=s.p.filter(x=>st.holdingFilter==='all'||(st.holdingFilter==='core')===coreSet.has(x.symbol));
 $('position-list').innerHTML=filtered.length?filtered.map(x=>{
  const pnl=val(x.upnl),cost=val(x.avg),v=val(x.mv),qty=val(x.qty),gain=cost>0?((val(x.last)-cost)/cost*100):0,type=coreSet.has(x.symbol)?'长期核心':'成长 / 战术';
  return '<article class="position-card"><div class="position-top"><div class="symbol-info"><div class="symbol-badge">'+safe(x.symbol.slice(0,4))+'</div><div><strong>'+safe(x.symbol)+'</strong><small>'+type+' · '+qty.toLocaleString('en-US',{maximumFractionDigits:4})+' 股</small></div></div><div class="position-value"><strong>'+money(v)+'</strong><small class="'+color(pnl)+'">'+signed(pnl)+' · '+signedPct(gain)+'</small></div></div><div class="position-foot"><span>占总资产 '+pct(v/Math.max(1,s.n)*100)+'</span><button class="position-expand" type="button" aria-expanded="false">详情 ▾</button></div><div class="position-details" hidden><div><small>平均成本</small><b>'+money(cost)+'</b></div><div><small>最近价格</small><b>'+money(x.last)+'</b></div><div><small>持仓数量</small><b>'+qty+'</b></div></div></article>';
 }).join(''):'<p class="empty">此分类暂无持仓。</p>';
}
function renderPlan(){
 if(!st.snapshot)return;const s=structure(),c=st.core,b=st.stable,t=100-c-b;
 setText('target-core-value',c+'%');setText('target-stable-value',b+'%');setText('target-tactical-value',t+'%');
 const arr=[['核心',s.corePct,c,'#75bfff'],['稳定',s.stablePct,b,'#50d5c0'],['战术',s.tacticalPct,t,'#e5b77f']];
 $('target-comparison').innerHTML='<div class="compare-grid">'+arr.map(x=>'<div class="compare-block"><small>'+x[0]+' 当前 / 目标</small><b>'+pct(x[1])+' / '+x[2]+'%</b><em>'+((x[2]-x[1])>=0?'目标增配 ':'目标减配 ')+money(Math.abs((x[2]-x[1])/100*s.n),0)+'</em></div>').join('')+'</div>';
 const months=120,monthly=st.monthly,monthlyRate=Math.pow(1+st.rate,1/12)-1;let balance=s.n,items=[{value:balance}];
 for(let i=1;i<=months;i++){balance=balance*(1+monthlyRate)+monthly;if(i%12===0)items.push({value:balance})}
 setText('sim-result',money(balance,0));setText('sim-contributed','本金及追加总额 '+money(s.n+months*monthly,0)+' · 假设年化 '+(st.rate*100).toFixed(0)+'%');
 const p=linePath(items,600,140,8);
 $('sim-chart').innerHTML='<defs><linearGradient id="simfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4cd8c7" stop-opacity=".25"/><stop offset="1" stop-color="#4cd8c7" stop-opacity="0"/></linearGradient></defs><path d="'+p+' L592 132 L8 132 Z" fill="url(#simfill)"/><path d="'+p+'" fill="none" stroke="#4cd8c7" stroke-width="3"/>';
 const messages=[
  ['长期核心仓', '目前 '+pct(s.corePct)+'，目标 '+c+'%。优先使用低成本宽基，注意 QQQ 与 VOO 的重叠。',(c-s.corePct)],
  ['稳定防御仓','目前现金 '+pct(s.stablePct)+'，目标 '+b+'%。可评估现金、短期美债以及风险承受能力。',(b-s.stablePct)],
  ['战术成长仓','目前 '+pct(s.tacticalPct)+'，目标 '+t+'%。避免把同一行业的多只股票误当成分散投资。',(t-s.tacticalPct)]
 ];
 $('allocation-actions').innerHTML=messages.map(x=>'<div class="action-item"><div><strong>'+safe(x[0])+'</strong><p>'+safe(x[1])+'</p></div><b class="'+(x[2]>=0?'neutral':'negative')+'">'+(x[2]>=0?'+':'')+x[2].toFixed(1)+'pp</b></div>').join('');
}
function allTrades(){const o=st.tradeData||{};let arr=(Array.isArray(o.history)&&o.history.length?o.history:Array.isArray(o.recent)?o.recent:[]).slice();return arr.sort((a,b)=>String(b.trade_time).localeCompare(String(a.trade_time)))}
function renderTrades(){
 const arr=allTrades(),filtered=arr.filter(x=>st.side==='all'||x.side===st.side),latest=arr[0];
 setText('trade-count',arr.length?arr.length.toLocaleString('en-US'):'—');setText('last-trade-time',latest?tradingTime(latest.trade_time):'—');
 const show=filtered.slice(0,st.shown);
 $('trade-list').innerHTML=show.length?show.map(x=>{
  const buy=x.side==='BUY',qty=Math.abs(val(x.size)),turn=qty*val(x.price);
  return '<article class="trade-card"><div class="trade-top"><div><span class="side-tag '+(buy?'buy':'sell')+'">'+(buy?'买入':'卖出')+'</span> <strong>'+safe(x.symbol||'—')+'</strong></div><strong class="trade-amount">'+money(turn)+'</strong></div><p>'+qty+' 股 × '+money(x.price)+' · '+tradingTime(x.trade_time)+'（新加坡时间）</p></article>';
 }).join(''):'<p class="empty">当前筛选没有交易数据。</p>';
 $('show-more-trades').hidden=filtered.length<=st.shown;
}
const checklist=['交易前是否写清入场逻辑、止损和最大亏损？','这笔仓位是否符合核心 / 稳定 / 战术目标？','是否避免追涨、补亏和冲动使用融资？','是否核对成交、费用和真实已实现盈亏？','是否记录今天值得改进的一件事？'];
function renderChecks(){
 const d=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'}),key='northstar-checks-'+d;
 let saved;try{saved=JSON.parse(localStorage.getItem(key)||'[]')}catch{saved=[]}
 $('review-checklist').innerHTML=checklist.map((x,i)=>'<label class="check-line"><input type="checkbox" data-check="'+i+'" '+(saved.includes(i)?'checked':'')+'><span>'+safe(x)+'</span></label>').join('');
 $('review-checklist').onchange=()=>{
  const v=[...$('review-checklist').querySelectorAll('[data-check]:checked')].map(x=>Number(x.dataset.check));try{localStorage.setItem(key,JSON.stringify(v))}catch{}};
 $('reset-checks').onclick=()=>{try{localStorage.removeItem(key)}catch{}renderChecks();toast('今日清单已重置')};
}
function renderRisk(){
 if(!st.snapshot)return;const s=structure(),a=account();
 setText('risk-hero-title',s.risky?'风险偏高 · 优先防守':'风险监测中 · 保持纪律');
 setText('risk-hero-desc',s.risky?'股票仓位和个股集中度值得关注，新的投入应优先审视风险预算。':'当前基础集中度没有触发主要预警，但市场波动可能随时变化。');
 const arr=[
  ['股票资产比重',pct(s.investedPct),s.investedPct>90?'股票接近满仓，市场回撤影响较大。':'股票占比仍需按风险承受力设定。'],
  ['现金缓冲',pct(s.cashPct),s.cashPct<5?'现金低于 5%，缺少流动性缓冲。':'留有现金但不保证抵御全部损失。'],
  ['第一大持仓',pct(s.topPct),'单一仓位占净值比重，尚未穿透 ETF 成分股。'],
  ['半导体相关',pct(s.semisPct),'仅识别直接持仓，不含 QQQ、VOO 内嵌敞口。']
 ];
 $('risk-cards').innerHTML=arr.map(x=>'<article class="risk-card"><small>'+x[0]+'</small><b>'+x[1]+'</b><p>'+safe(x[2])+'</p></article>').join('');
 setText('snapshot-time',stamp(st.snapshot.generated_at)+'（时区：新加坡）');
 setText('source-status',st.localKinds.size?'本地临时导入':'公开 JSON');
}
function renderDataState(){
 const age=dataAgeHours(),fresh=age<=72&&age>=-6;
 $('data-status').textContent=!st.snapshot?'不可用':st.localKinds.size?'本地导入':fresh?'已同步快照':'数据可能过期';
 $('data-status').classList.toggle('warning',!fresh);$('data-status').classList.toggle('success',fresh);
 setText('global-status','Northstar · IBKR 只读数据 · 最后检查：'+stamp(new Date().toISOString())+' · 投资有风险');
}
function renderAll(){renderDataState();renderHero();renderChart();renderPulse();renderDigest();renderHoldings();renderPlan();renderTrades();renderChecks();renderRisk()}
async function fetchJson(path){const response=await fetch(path+'?t='+Date.now(),{cache:'no-store'});if(!response.ok)throw new Error(path+' HTTP '+response.status);return response.json()}
let fetching=false;
async function reload(silent=false,force=false){
 if(fetching)return;fetching=true;$('refresh-btn').classList.add('working');
 const paths=[['snapshot','../snapshot.json'],['history','../nav-history.json'],['tradeData','../trades.json']];
 const results=await Promise.allSettled(paths.map(async x=>{
  if(!force&&st.localKinds.has(x[0]))return {type:x[0],data:st[x[0]]};
  return {type:x[0],data:await fetchJson(x[1])};
 }));
 let good=0,errors=[];results.forEach((r,i)=>{
  if(r.status==='fulfilled'){const item=r.value;if(item.type==='snapshot'&&item.data?.account?.net_liq!=null){st.snapshot=item.data;good++}else if(item.type==='history'&&Array.isArray(item.data)){st.history=item.data.filter(x=>x&&Number.isFinite(Number(x.value)));good++}else if(item.type==='tradeData'&&item.data&&(Array.isArray(item.data.history)||Array.isArray(item.data.recent))){st.tradeData=item.data;good++}else errors.push(paths[i][0]+' 格式不符')}
  else errors.push(paths[i][0]+' 获取失败');
 });
 st.loadTime=Date.now();fetching=false;$('refresh-btn').classList.remove('working');renderAll();
 if(!silent)toast(good===3?'已检查最新仓库数据':'已获取 '+good+'/3 份数据');
 if(errors.length)console.warn('Northstar data source',errors.join('、'));
}
function initControls(){
 $('refresh-btn').onclick=()=>reload();$('refresh-secondary').onclick=()=>reload();
 document.querySelectorAll('#range-control [data-range]').forEach(b=>b.onclick=()=>{
  st.range=Number(b.dataset.range);document.querySelectorAll('#range-control button').forEach(x=>x.classList.toggle('chosen',x===b));renderChart();
 });
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{
  st.holdingFilter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));renderHoldings();
 });
 $('position-list').onclick=e=>{
  const b=e.target.closest('.position-expand');if(!b)return;const area=b.closest('.position-card').querySelector('.position-details');area.hidden=!area.hidden;b.setAttribute('aria-expanded',String(!area.hidden));b.textContent=area.hidden?'详情 ▾':'收起 ▴';
 };
 const loadTargets=()=>{try{const o=JSON.parse(localStorage.getItem('northstar-targets-v2')||'{}');if(Number.isFinite(o.core)&&Number.isFinite(o.stable)&&o.core+o.stable<=95){st.core=o.core;st.stable=o.stable}if(Number.isFinite(o.monthly)&&o.monthly>=0)st.monthly=o.monthly}catch{}};
 loadTargets();$('target-core').value=st.core;$('target-stable').value=st.stable;$('monthly-input').value=st.monthly;
 const updateTargets=e=>{
  let c=Number($('target-core').value),b=Number($('target-stable').value);
  if(c+b>95){if(e.target.id==='target-core')b=95-c;else c=95-b}
  st.core=c;st.stable=b;$('target-core').value=c;$('target-stable').value=b;
  try{localStorage.setItem('northstar-targets-v2',JSON.stringify({core:c,stable:b,monthly:st.monthly}))}catch{}
  renderPlan();
 };
 $('target-core').oninput=updateTargets;$('target-stable').oninput=updateTargets;
 $('monthly-input').oninput=()=>{
  st.monthly=Math.min(100000,Math.max(0,val($('monthly-input').value)));
  try{localStorage.setItem('northstar-targets-v2',JSON.stringify({core:st.core,stable:st.stable,monthly:st.monthly}))}catch{}
  renderPlan();
 };
 document.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{
  st.rate=Number(b.dataset.rate);document.querySelectorAll('[data-rate]').forEach(x=>x.classList.toggle('selected',x===b));renderPlan();
 });
 document.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>{
  st.side=b.dataset.side;st.shown=16;document.querySelectorAll('[data-side]').forEach(x=>x.classList.toggle('selected',x===b));renderTrades();
 });
 $('show-more-trades').onclick=()=>{st.shown+=30;renderTrades()};
 $('copy-digest').onclick=async()=>{
  if(!st.snapshot){toast('尚未读取数据');return}
  const t='Northstar 每日持仓摘要 · '+stamp(st.snapshot.generated_at)+'\n'+buildDigest()+'\n数据为 IBKR 快照，不是实时交易建议。';
  try{await navigator.clipboard.writeText(t);toast('账户摘要已复制')}catch{toast('浏览器未授权复制，请手动复制')}
 };
 $('file-input').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
   if(file.size>15*1024*1024)throw new Error('文件超过 15MB');
   const data=JSON.parse(await file.text());
   let kind;
   if(data&&data.account&&Array.isArray(data.holdings_readonly)){kind='snapshot';st.snapshot=data}
   else if(Array.isArray(data)&&data[0]?.time&&data[0]?.value!==undefined){kind='history';st.history=data}
   else if(data&&(Array.isArray(data.history)||Array.isArray(data.recent))){kind='tradeData';st.tradeData=data}
   else throw new Error('仅支持 snapshot.json、nav-history.json 或 trades.json 格式');
   st.localKinds.add(kind);renderAll();toast('已在本次页面会话导入 '+file.name+'（未上传）');
  }catch(err){toast('导入失败：'+err.message)}finally{e.target.value=''}
 };
 $('clear-local').onclick=()=>{st.localKinds.clear();reload(false,true)};
}
function boot(){
 const now=new Date();
 setText('today-label',new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Singapore',year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(now)+' · WEALTH OVERVIEW');
 initNavigation();initControls();renderChecks();reload();
 setInterval(()=>{if(!document.hidden)reload(true)},5*60*1000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-val(st.loadTime)>5*60*1000)reload(true)});
}
document.addEventListener('DOMContentLoaded',boot);
