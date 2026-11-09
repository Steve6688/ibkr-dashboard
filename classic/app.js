'use strict';
const $=id=>document.getElementById(id);
const fmt=(n,d=2)=>Number.isFinite(Number(n))?'$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const pct=n=>Number.isFinite(n)?n.toFixed(1)+'%':'—';
const signed=(n,d=2)=>Number.isFinite(Number(n))?(n>0?'+':n<0?'−':'')+fmt(Math.abs(n),d):'—';
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateFmt=s=>s?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s)):'—';
const core=new Set(['VOO','QQQ','QQQM','SPY','IVV','VTI','SPLG']);
const stable=new Set(['SGOV','BIL','SHV','USFR','TFLO','GLD','GLDM','IAU','TLT','IEF','SHY','TIP']);
const hues=['#4f8ad5','#53baa1','#bd9cf3','#dfae68','#e47c8d','#7a9eb8','#b9bc71','#65b39a'];
const state={data:null,summary:null,positions:[],trades:[],history:[],periods:{},rate:.07,range:1000,tradeSide:'ALL',tradeCount:12,coreTarget:65,stableTarget:20,monthly:200,goal:11340};
const names={overview:'资产总览',holdings:'当前持仓',trades:'成交记录',plan:'增值计划',account:'账户与风险'};
let timer;
function toast(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,2700)}
function chooseTab(id){document.querySelectorAll('.page').forEach(s=>s.hidden=s.id!=='page-'+id);document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.page===id)));$('heading').textContent=names[id];scrollTo(0,0)}
function setupNav(){document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>chooseTab(b.dataset.page)));document.querySelectorAll('[data-to]').forEach(b=>b.addEventListener('click',()=>chooseTab(b.dataset.to)))}
function normalize(d){
 if(!d||d.source!=='ibkr-plugin')throw Error('请选择从已连接 IBKR 插件生成的 JSON 文件');
 const x=d.ibkr||d;
 const s=x.summary||x.account_summary||x.get_account_summary||{};
 const b=x.balances||x.account_balances||x.get_account_balances||{};
 const rawPositions=x.positions||x.account_positions||x.get_account_positions||{};
 const ps=Array.isArray(rawPositions)?rawPositions:rawPositions.positions;
 if(!Number.isFinite(Number(s.net_liquidation))||!Array.isArray(ps))throw Error('IBKR 数据不完整：缺少账户汇总或持仓');
 const cashBalances=Array.isArray(b)?b:b.balances||[];
 const base=cashBalances.find(p=>p.currency==='BASE')||cashBalances.find(p=>p.currency==='USD')||{};
 const cash=s.total_cash_value??base.cash_balance??null;
 const positions=ps.map(p=>({
  symbol:String(p.contract_description||p.symbol||'').trim().toUpperCase(),
  qty:Number(p.position??p.qty??0),value:Number(p.market_value??p.mv??0),
  price:Number(p.market_price??p.last??0),avg:Number(p.average_price??p.avg??0),
  upnl:Number(p.unrealized_pnl??p.upnl??0),dpnl:Number(p.daily_pnl??p.dpnl??0)
 })).filter(p=>p.symbol&&p.qty!==0).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value));
 const perf=x.performance||x.get_pa_performance_all_periods||{};
 const allPeriods=perf.accounts?.account?.periods||{};
 const annual=allPeriods.YTD||allPeriods['1Y']||{};
 const dates=annual.dates||[],nav=annual.nav||[],cps=annual.cps||[];
 const history=dates.map((d,i)=>({date:String(d).replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3'),value:Number(nav[i]),twr:cps[i]==null?null:Number(cps[i])})).filter(p=>Number.isFinite(p.value));
 const rawTrades=x.trades||x.get_account_trades||{};
 const ts=(Array.isArray(rawTrades)?rawTrades:rawTrades.trades||[]).map(t=>({
  symbol:String(t.symbol||''),side:String(t.side||''),qty:Number(t.size??0),price:Number(t.price??0),
  currency:String(t.currency||'USD'),asset:String(t.asset||t.sec_type||'STK'),
  commission:t.commission==null?null:Number(t.commission),
  realized:t.realized_pnl==null?null:Number(t.realized_pnl),
  time:String(t.trade_time||'')
 })).sort((a,b)=>b.time.localeCompare(a.time));
 return {fetchedAt:d.fetched_at||d.generated_at||null,summary:s,cash:Number(cash),positions,trades:ts,history,periods:allPeriods,method:perf.portfolio_measure||'unknown'};
}
function load(d){
 const a=normalize(d);state.data=a;state.summary=a.summary;state.positions=a.positions;state.trades=a.trades;state.history=a.history;state.periods=a.periods;
 $('notice').hidden=true;render();
 toast('IBKR 插件数据已加载，仅在本次网页会话内使用');
}
function positionSum(){return state.positions.reduce((a,x)=>a+x.value,0)}
function total(){return Number(state.summary?.net_liquidation)||0}
function cash(){return state.data?.cash??0}
function allocations(){
 const n=total()||1,p=state.positions;
 const coreAmount=p.filter(x=>core.has(x.symbol)).reduce((a,x)=>a+x.value,0);
 const safeETFs=p.filter(x=>stable.has(x.symbol)).reduce((a,x)=>a+x.value,0);
 const st=cash()+safeETFs;
 const tact=positionSum()-coreAmount-safeETFs;
 const semis=p.filter(x=>['MU','MRVL','NVDA','AMD','AVGO','SOXX','SMH'].includes(x.symbol)).reduce((a,x)=>a+x.value,0);
 return {core:coreAmount,stable:st,tactical:tact,corePct:coreAmount/n*100,stablePct:st/n*100,tacticalPct:tact/n*100,semisPct:semis/n*100,investedPct:positionSum()/n*100,cashPct:cash()/n*100,topPct:(p[0]?.value||0)/n*100};
}
function render(){
 if(!state.data)return;
 const a=state.data,s=state.summary,ac=allocations(),n=total();
 $('nav').textContent=fmt(n);$('invested').textContent=fmt(positionSum());$('cash').textContent=fmt(cash());
 $('invested-pct').textContent=pct(ac.investedPct)+' · 占净资产';
 $('cash-pct').textContent=pct(ac.cashPct)+' · 占净资产';
 $('asof').textContent=a.fetchedAt?'插件查询 '+dateFmt(a.fetchedAt):'数据时间未提供';
 $('source').textContent='IBKR 插件 · '+(a.fetchedAt?dateFmt(a.fetchedAt):'时间未知');
 $('snapshot-time').textContent=a.fetchedAt?dateFmt(a.fetchedAt):'时间未知';
 const twr=a.periods.YTD?.cps?.at(-1)??null,tw=Number.isFinite(Number(twr))&&twr!=null?Number(twr)*100:null;
 $('twr').textContent=tw===null?'—':(tw>0?'+':'')+tw.toFixed(2)+'%';
 $('twr').className=tw>0?'buys':tw<0?'losses':'';
 const pday=a.positions.filter(p=>Number.isFinite(p.dpnl)).reduce((sum,p)=>sum+p.dpnl,0);
 $('daily').textContent=signed(pday);$('daily').className=pday>0?'buys':pday<0?'losses':'';
 renderGoal();renderChart();renderAlloc();renderHoldings();renderTrades();renderPlan();renderAccount();
 $('status').textContent='来源：已连接的 IBKR 插件 · 仅读取导入的私人快照 · 未向 GitHub 写入账户数据';
}
function renderGoal(){
 const n=total(),g=state.goal,delta=n-g;
 $('goal-base').textContent='目标 '+fmt(g,0);
 $('goal-text').textContent=delta>=0?'已达成':fmt(g-n,0)+'差额';
 const ratio=Math.max(0,Math.min(1,n/g));
 $('ring-progress').style.strokeDasharray=(ratio*263.894).toFixed(2)+' 263.894';
}
function pathOf(items,w,h,pad=5){
 if(items.length<2)return'';
 const values=items.map(x=>x.value),lo=Math.min(...values),hi=Math.max(...values),space=Math.max(1,hi-lo),min=lo-space*.08,max=hi+space*.08;
 return items.map((o,i)=>(i?'L':'M')+(pad+(w-pad*2)*i/(items.length-1)).toFixed(1)+','+(pad+(max-o.value)/(max-min)*(h-pad*2)).toFixed(1)).join(' ');
}
function renderChart(){
 let h=state.history,segment=state.range===1000?h:h.slice(-state.range),d=pathOf(segment,340,145,9);
 $('nav-chart').innerHTML=d?'<defs><linearGradient id="navFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c88ca" stop-opacity=".20"/><stop offset="1" stop-color="#4c88ca" stop-opacity="0"/></linearGradient></defs><path d="'+d+' L331,140 L9,140 Z" fill="url(#navFade)"/><path d="'+d+'" fill="none" stroke="#397ec8" stroke-width="2.3" stroke-linecap="round"/>':'';
 let spark=pathOf(h.slice(-50),340,95,4);
 $('spark').innerHTML=spark?'<path d="'+spark+'" fill="none" stroke="#4b95d0" stroke-width="3"/>':'';
 $('chart-start').textContent=segment[0]?.date||'—';$('chart-end').textContent=segment.at(-1)?.date||'—';
}
function stack(target,legend,arr){
 const n=total()||1;
 $(target).innerHTML=arr.map((p,i)=>'<span style="width:'+Math.max(0,p.value/n*100).toFixed(3)+'%;background:'+hues[i%hues.length]+'"></span>').join('');
 $(legend).innerHTML=arr.map((p,i)=>'<span><i style="background:'+hues[i%hues.length]+'"></i>'+safe(p.name)+' '+pct(p.value/n*100)+'</span>').join('');
}
function renderAlloc(){
 const ac=allocations();
 stack('overview-stack','overview-legend',[{name:'核心指数',value:ac.core},{name:'战术成长',value:ac.tactical},{name:'稳定防御',value:ac.stable}]);
 $('three-metrics').innerHTML=[['长期核心',ac.corePct],['稳定防御',ac.stablePct],['战术成长',ac.tacticalPct]].map(x=>'<div><small>'+x[0]+'</small><b>'+pct(x[1])+'</b></div>').join('');
 const notices=[];
 if(cash()<0)notices.push('现金为负 '+fmt(cash())+'：可能存在融资余额，优先核实利息与汇率。');
 else if(ac.cashPct<5)notices.push('现金不足5%，市场回撤时流动性缓冲偏弱。');
 if(ac.semisPct>20)notices.push('半导体直接敞口 '+pct(ac.semisPct)+'，未穿透 VOO/QQQ 内部成分。');
 if(ac.tacticalPct>25)notices.push('战术仓 '+pct(ac.tacticalPct)+'，超出原计划15%的目标。');
 notices.push('购买力 '+fmt(state.summary.buying_power)+' 不等于可投资现金。');
 $('warning-card').innerHTML=notices.map(x=>'<div class="warning-item">'+safe(x)+'</div>').join('');
}
function renderHoldings(){
 const a=state.positions,n=total()||1;
 $('position-count').textContent=a.length+'只 · '+(state.data.fetchedAt?dateFmt(state.data.fetchedAt):'时间未知');
 stack('positions-stack','positions-legend',a.map(x=>({name:x.symbol,value:x.value})).concat([{name:'现金',value:Math.max(0,cash())}]));
 $('positions').innerHTML=a.length?a.map((p,i)=>{
 const rate=p.avg?((p.price-p.avg)/p.avg*100):0;
 return '<article class="card position-card"><div class="position-head"><div class="ticker"><div class="symbol">'+safe(p.symbol.slice(0,4))+'</div><div><strong>'+safe(p.symbol)+'</strong><small>'+p.qty.toLocaleString('en-US',{maximumFractionDigits:4})+'股 · 均价'+fmt(p.avg)+'</small></div></div><div class="value"><b>'+fmt(p.value)+'</b><small class="'+(p.upnl>=0?'buys':'losses')+'">'+signed(p.upnl)+' · '+(rate>0?'+':'')+rate.toFixed(2)+'%</small></div></div><div class="position-bottom"><span>占账户 '+pct(p.value/n*100)+'</span><span>最新价 '+fmt(p.price)+'</span></div></article>';
 }).join(''):'<div class="card empty">未获取持仓</div>';
}
function renderTrades(){
 const a=state.trades.filter(t=>state.tradeSide==='ALL'||t.side===state.tradeSide),items=a.slice(0,state.tradeCount);
 $('trade-count').textContent=state.trades.length+'笔 · 插件最近7日';
 $('trades').innerHTML=items.length?items.map(x=>{
 const fx=x.asset==='CASH',amount=Math.abs(x.qty*x.price),type=fx?'换汇':x.side==='BUY'?'买入':'卖出';
 return '<article class="card trade-card"><div class="trade-head"><div><span class="trade-tag '+(x.side==='SELL'?'sell':'')+'">'+type+'</span><strong>'+safe(x.symbol)+'</strong></div><strong>'+fmt(amount)+'</strong></div><p>'+Number(x.qty).toLocaleString('en-US',{maximumFractionDigits:4})+' '+(fx?'单位':'股')+' × '+fmt(x.price)+' · '+dateFmt(x.time)+' · '+safe(x.currency)+'</p></article>';
 }).join(''):'<div class="card empty">暂无符合条件的成交记录</div>';
 $('more-trades').hidden=a.length<=state.tradeCount;
}
function renderPlan(){
 const ac=allocations(),n=total();const t=100-state.coreTarget-state.stableTarget;
 $('goal-core').textContent=state.coreTarget+'%';$('goal-stable').textContent=state.stableTarget+'%';$('goal-tactical').textContent=t+'%';
 $('compare').innerHTML=[['核心指数',ac.corePct,state.coreTarget],['稳定防御',ac.stablePct,state.stableTarget],['战术成长',ac.tacticalPct,t]].map(x=>'<div class="compare-item"><span>'+x[0]+'：当前 '+pct(x[1])+' / 目标 '+x[2]+'%</span><b>'+((x[1]-x[2])>0?'+':'')+(x[1]-x[2]).toFixed(1)+'pp</b></div>').join('');
 let amount=n,items=[{value:n}],r=Math.pow(1+state.rate,1/12)-1;
 for(let i=1;i<=120;i++){amount=amount*(1+r)+state.monthly;if(i%12===0)items.push({value:amount})}
 $('forecast').textContent=fmt(amount,0);$('forecast-note').textContent='月投入'+fmt(state.monthly,0)+' · 年化假设 '+(state.rate*100).toFixed(0)+'% · 非收益承诺';
 let path=pathOf(items,340,95,5);$('forecast-curve').innerHTML=path?'<path d="'+path+'" stroke="#438bc5" fill="none" stroke-width="2.6"/>':'';
}
function metric(name,value){return '<div class="metric-line"><span>'+safe(name)+'</span><strong>'+safe(value)+'</strong></div>'}
function renderAccount(){
 const s=state.summary,a=allocations(),p=state.positions;
 $('account-metrics').innerHTML=[
 ['净资产',fmt(s.net_liquidation)],['股票/ETF市值',fmt(s.gross_position_value)],['现金余额',fmt(cash())],
 ['持仓浮盈亏',signed(p.reduce((sum,x)=>sum+x.upnl,0))],['IBKR可用资金',fmt(s.available_funds)],
 ['购买力（非现金）',fmt(s.buying_power)],['初始保证金',fmt(s.initial_margin)],['维持保证金',fmt(s.maintenance_margin)],
 ['超额流动性',fmt(s.excess_liquidity)],['最近交易日TWR',state.periods['1D']?.cps?.length?(Number(state.periods['1D'].cps.at(-1))*100).toFixed(2)+'%':'—'],
 ['近一月TWR',state.periods['1M']?.cps?.length?(Number(state.periods['1M'].cps.at(-1))*100).toFixed(2)+'%':'—']
 ].map(x=>metric(x[0],x[1])).join('');
 $('risk-metrics').innerHTML=[
 metric('现金净资产占比',pct(a.cashPct)),metric('第一大持仓占比',pct(a.topPct)),metric('半导体直接仓位',pct(a.semisPct)),
 metric('成长/战术仓位',pct(a.tacticalPct)),metric('券商杠杆指标',String(s.leverage??'—')),
 '<p class="footnote">风险指标基于当前 IBKR 持仓估算，指数 ETF 的行业成分未穿透；已实现损益请以券商报表为准。</p>'
 ].join('');
}
function boot(){
 setupNav();
 try{
   const saved=JSON.parse(localStorage.getItem('ibkr-classic-settings')||'{}');
   if(Number.isFinite(saved.goal)&&saved.goal>0)state.goal=saved.goal;
   if(Number.isFinite(saved.coreTarget))state.coreTarget=saved.coreTarget;
   if(Number.isFinite(saved.stableTarget))state.stableTarget=saved.stableTarget;
   if(Number.isFinite(saved.monthly))state.monthly=saved.monthly;
 }catch{}
 $('core-slider').value=state.coreTarget;$('stable-slider').value=state.stableTarget;$('monthly').value=state.monthly;
 const save=()=>{try{localStorage.setItem('ibkr-classic-settings',JSON.stringify({goal:state.goal,coreTarget:state.coreTarget,stableTarget:state.stableTarget,monthly:state.monthly}))}catch{}};
 const accept=async file=>{if(!file)return;try{if(file.size>12*1024*1024)throw Error('文件过大');const d=JSON.parse(await file.text());load(d)}catch(e){toast('导入失败：'+e.message)}};
 $('import-file').addEventListener('change',e=>accept(e.target.files[0]));
 document.querySelectorAll('.import-alias').forEach(e=>e.addEventListener('change',v=>accept(v.target.files[0])));
 $('refresh').addEventListener('click',()=>toast('要获取新数据，请在 ChatGPT 里重新读取 IBKR 插件并导入私人快照'));
 $('clear').addEventListener('click',()=>location.reload());
 $('edit-goal').addEventListener('click',()=>{const s=prompt('回本参考线（累计投入美元）',String(state.goal));if(s===null)return;const n=Number(s);if(!Number.isFinite(n)||n<=0){toast('请输入有效金额');return}state.goal=n;save();if(state.data)renderGoal()});
 document.querySelectorAll('#ranges button').forEach(b=>b.addEventListener('click',()=>{state.range=Number(b.dataset.range);document.querySelectorAll('#ranges button').forEach(x=>x.classList.toggle('chosen',x===b));renderChart()}));
 document.querySelectorAll('#trade-filters button').forEach(b=>b.addEventListener('click',()=>{state.tradeSide=b.dataset.side;state.tradeCount=12;document.querySelectorAll('#trade-filters button').forEach(x=>x.classList.toggle('chosen',x===b));renderTrades()}));
 $('more-trades').addEventListener('click',()=>{state.tradeCount+=25;renderTrades()});
 const syncTargets=changed=>{
  let c=Number($('core-slider').value),s=Number($('stable-slider').value);
  if(c+s>95){if(changed==='core')s=95-c;else c=95-s}
  state.coreTarget=c;state.stableTarget=s;$('core-slider').value=c;$('stable-slider').value=s;
  save();if(state.data)renderPlan();
 };
 $('core-slider').addEventListener('input',()=>syncTargets('core'));
 $('stable-slider').addEventListener('input',()=>syncTargets('stable'));
 $('monthly').addEventListener('input',()=>{state.monthly=Math.max(0,Math.min(100000,Number($('monthly').value)||0));save();if(state.data)renderPlan()});
 document.querySelectorAll('#rates button').forEach(b=>b.addEventListener('click',()=>{state.rate=Number(b.dataset.rate);document.querySelectorAll('#rates button').forEach(x=>x.classList.toggle('chosen',x===b));if(state.data)renderPlan()}));
 const preloaded=$('private-data').textContent.trim();
 if(preloaded&&preloaded!=='null'){try{load(JSON.parse(preloaded))}catch(e){console.error('IBKR export invalid',e);toast('内嵌插件数据无效')}}
}
document.addEventListener('DOMContentLoaded',boot);
