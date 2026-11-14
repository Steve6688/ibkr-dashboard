(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? '待更新' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  const money = value => valid(value) ? (Number(value) < 0 ? '−$' : '$') + Math.abs(Number(value)).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}) : '待更新';
  const signed = value => valid(value) ? (Number(value) > 0 ? '+' : '') + money(value) : '待更新';
  const color = value => value > 0 ? 'green' : value < 0 ? 'red' : '';
  const clamp = value => Math.max(0, Math.min(100, value));
  const bar = (value, cls = '') => `<div class="bar ${cls}"><i style="width:${clamp(value)}%"></i></div>`;
  const ring = value => `<svg class="ring" viewBox="0 0 80 80" aria-label="${value === null ? '待更新' : value.toFixed(1) + '%'}"><circle cx="40" cy="40" r="31" fill="none" stroke="#edf1f3" stroke-width="7"/><circle cx="40" cy="40" r="31" fill="none" stroke="#16a34a" stroke-width="7" stroke-linecap="round" stroke-dasharray="${value === null ? 0 : clamp(value) * 1.948} 195" transform="rotate(-90 40 40)"/><text x="40" y="45" text-anchor="middle">${value === null ? '—' : value.toFixed(0) + '%'}</text></svg>`;
  const fmtDate = value => { if (!value) return '待更新'; const date = new Date(value); return Number.isNaN(date.valueOf()) ? '待更新' : new Intl.DateTimeFormat('zh-CN', {timeZone:'Asia/Shanghai', dateStyle:'short', timeStyle:'short'}).format(date); };
  const dateUS = () => new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
  const svg = (inner, view = '0 0 400 200') => `<svg viewBox="${view}" preserveAspectRatio="none" role="img">${inner}</svg>`;
  const grid = () => [20,65,110,155,190].map(y => `<line x1="36" x2="390" y1="${y}" y2="${y}" stroke="#edf1f3"/>`).join('');

  function lineChart(data) {
    const rows = data.filter(row => valid(row.value));
    if (!rows.length) return '<div class="empty">待更新</div>';
    const values = rows.map(row => +row.value), min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
    const points = rows.map((row, index) => `${36 + index * 354 / Math.max(1, rows.length - 1)},${175 - (+row.value - min) / range * 150}`).join(' ');
    return svg(`${grid()}<text x="0" y="25" font-size="9" fill="#9aa4ae">${Math.round(max)}</text><text x="0" y="179" font-size="9" fill="#9aa4ae">${Math.round(min)}</text><polyline points="${points}" fill="none" stroke="#1a9ed9" stroke-width="2"/><text x="36" y="198" font-size="9" fill="#9aa4ae">${esc(rows[0].time)}</text><text x="390" y="198" text-anchor="end" font-size="9" fill="#9aa4ae">${esc(rows.at(-1).time)}</text>`);
  }
  function drawdown(data) {
    let peak = 0;
    const values = data.filter(row => valid(row.value)).map(row => { peak = Math.max(peak, +row.value); return peak ? (peak - (+row.value)) / peak : 0; });
    if (!values.length) return '';
    const max = Math.max(...values, .01), width = 354 / values.length;
    return svg(`<line x1="36" x2="390" y1="8" y2="8" stroke="#edf1f3"/>${values.map((value, index) => `<rect x="${36 + index * width}" y="8" width="${Math.max(.5, width - .3)}" height="${value / max * 160}" fill="#e26666"/>`).join('')}<text x="0" y="15" font-size="10" fill="#9aa4ae">0%</text><text x="0" y="175" font-size="10" fill="#9aa4ae">${(max * 100).toFixed(1)}%</text>`);
  }
  function dailyChart(days) {
    if (!days.length) return '<div class="empty">待更新</div>';
    const max = Math.max(...days.filter(row => valid(row.value)).map(row => Math.abs(+row.value)), 1), width = 340 / days.length;
    return svg(`${grid()}<line x1="36" x2="390" y1="100" y2="100" stroke="#bfc8cf"/>${days.map((row, index) => { const pos = 43 + index * width; if (!valid(row.value)) return `<text x="${pos + width / 2}" y="95" text-anchor="middle" fill="#a3adb7" font-size="8">待更新</text><text x="${pos + width / 2}" y="198" text-anchor="middle" fill="#9aa4ae" font-size="8">${esc(row.date.slice(5))}</text>`; const height = Math.abs(row.value) / max * 75; return `<rect x="${pos + width * .25}" y="${row.value >= 0 ? 100 - height : 100}" width="${Math.max(3, width * .5)}" height="${height}" rx="2" fill="${row.value >= 0 ? '#16a34a' : '#dc2626'}"><title>${esc(row.date)} ${signed(row.value)} ${esc(row.method || '')}</title></rect><text x="${pos + width / 2}" y="198" text-anchor="middle" fill="#9aa4ae" font-size="8">${esc(row.date.slice(5))}</text>`; }).join('')}<text x="0" y="103" font-size="9" fill="#9aa4ae">$0</text>`);
  }
  function radar(values) {
    const names = ['胜率','盈亏比','Profit Factor','日胜率','风控遵守','执行一致性'], cx = 200, cy = 145, radius = 105;
    const point = (index, value) => { const angle = -Math.PI / 2 + index * Math.PI / 3; return [cx + Math.cos(angle) * radius * value / 100, cy + Math.sin(angle) * radius * value / 100]; };
    let output = '';
    for (const value of [25,50,75,100]) output += `<polygon points="${names.map((_, index) => point(index, value).join(',')).join(' ')}" fill="none" stroke="#e8edef"/>`;
    names.forEach((name, index) => { const label = point(index, 125), axis = point(index, 100); output += `<line x1="${cx}" y1="${cy}" x2="${axis[0]}" y2="${axis[1]}" stroke="#e8edef"/><text x="${label[0]}" y="${label[1]}" text-anchor="middle" font-size="10" fill="#8f9ba5">${name}</text><text x="${label[0]}" y="${label[1] + 12}" text-anchor="middle" font-size="9" fill="#a3adb7">${values[index] === null ? '待更新' : values[index].toFixed(0)}</text>`; });
    values.forEach((value, index) => { if (value !== null) { const pointValue = point(index, value); output += `<line x1="${cx}" y1="${cy}" x2="${pointValue[0]}" y2="${pointValue[1]}" stroke="#16a34a" stroke-width="2"/><circle cx="${pointValue[0]}" cy="${pointValue[1]}" r="3" fill="#16a34a"/>`; } });
    const known = values.filter(value => value !== null);
    return `<div class="radar-score"><span class="muted">已知维度平均</span> <b class="green">${known.length ? (known.reduce((a,b) => a + b, 0) / known.length).toFixed(1) + '/100' : '待更新'}</b></div>${svg(output, '0 0 400 290')}<p class="footnote">胜率、日胜率直接取百分比；盈亏比 ÷ 2、PF ÷ 2，均封顶 100。</p>`;
  }

  let calendarDate = new Date(), calendarRows = [];
  function renderCalendar() {
    const year = calendarDate.getFullYear(), month = calendarDate.getMonth(), first = new Date(year, month, 1).getDay(), count = new Date(year, month + 1, 0).getDate(), weeks = Math.ceil((first + count) / 7);
    $('wb-month-title').textContent = `${year} 年 ${month + 1} 月`;
    let html = '<div class="calendar-grid">' + ['日','一','二','三','四','五','六','周合计'].map(value => `<div class="weekday">${value}</div>`).join('');
    for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
      const week = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const day = weekIndex * 7 + dayIndex - first + 1;
        if (day < 1 || day > count) { html += '<div></div>'; continue; }
        const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`, rows = calendarRows.filter(row => row.session_date === key && valid(row.pnl)), total = rows.reduce((sum, row) => sum + Number(row.pnl), 0); week.push(...rows);
        html += `<div class="day ${rows.length ? (total > 0 ? 'win' : total < 0 ? 'loss' : '') : ''}">${day}${rows.length ? `<b class="${color(total)}">${signed(total)}</b><small>${rows.length} 笔</small>` : ''}</div>`;
      }
      const total = week.reduce((sum, row) => sum + Number(row.pnl), 0); html += `<div class="week-total">${week.length ? `<b class="${color(total)}">${signed(total)}</b><small>${week.length} 笔</small>` : '—'}</div>`;
    }
    $('wb-calendar-content').innerHTML = html + '</div><p class="footnote">按美国交易日统计团队已平仓交易；空白表示无已记录交易。</p>';
  }

  async function run() {
    const files = ['snapshot.json','nav-history.json','daily-pnl.json','trades.json','tonight.json','plan6m.json','risk-config.json'];
    const [snapshot, nav, daily, trades, tonight, plan, risk] = await Promise.all(files.map(async file => { const response = await fetch(`${file}?t=${Date.now()}`, {cache:'no-store'}); if (!response.ok) throw Error(file + ' ' + response.status); return response.json(); }));
    const account = snapshot.account || {}, rows = (trades.team_round_trips || []).filter(row => row.owner === 'team' && valid(row.pnl)), wins = rows.filter(row => row.pnl > 0), losses = rows.filter(row => row.pnl < 0), sum = values => values.reduce((total, row) => total + Number(row.pnl), 0), grossWin = sum(wins), grossLoss = -sum(losses), winRate = rows.length ? wins.length / rows.length * 100 : null, profitFactor = grossLoss ? grossWin / grossLoss : null, averageWin = wins.length ? grossWin / wins.length : null, averageLoss = losses.length ? grossLoss / losses.length : null, ratio = averageWin !== null && averageLoss ? averageWin / averageLoss : null;
    const byDay = {}; rows.forEach(row => { if (row.session_date) byDay[row.session_date] = (byDay[row.session_date] || 0) + Number(row.pnl); }); const dayValues = Object.values(byDay), dayWin = dayValues.length ? dayValues.filter(value => value > 0).length / dayValues.length * 100 : null, progress = valid(account.net_liq) ? (account.net_liq - plan.baseline_net_liq) / plan.gap * 100 : null;
    $('wb-status').textContent = '数据更新时间（上海） ' + fmtDate(snapshot.generated_at);
    $('wb-kpis').innerHTML = `<div class="kpi"><div class="label">净值 / 回本进度</div><strong>${money(account.net_liq)}</strong>${bar(progress || 0)}<small>回本 ${progress === null ? '待更新' : progress.toFixed(2) + '%'} · 目标 ${money(plan.total_deposits)}</small></div><div class="kpi"><div class="label">交易胜率</div><div class="kpi-flex">${ring(winRate)}<small>${wins.length} 胜 / ${rows.length} 笔<br>团队已平仓</small></div></div><div class="kpi"><div class="label">PROFIT FACTOR</div><strong>${profitFactor === null ? '待更新' : profitFactor.toFixed(2)}</strong><small>总盈利 ÷ 总亏损</small></div><div class="kpi"><div class="label">日胜率</div><div class="kpi-flex">${ring(dayWin)}<small>${dayValues.filter(value => value > 0).length} 个盈利日<br>${dayValues.length} 个交易日</small></div></div><div class="kpi"><div class="label">平均盈 / 亏</div><strong>${ratio === null ? '待更新' : ratio.toFixed(2)}</strong><small><span class="green">${money(averageWin)}</span> 平均盈利 · <span class="red">${money(averageLoss)}</span> 平均亏损</small></div>`;
    $('wb-radar').innerHTML = radar([winRate, ratio === null ? null : clamp(ratio / 2 * 100), profitFactor === null ? null : clamp(profitFactor / 2 * 100), dayWin, null, null]); $('wb-navchart').innerHTML = lineChart(nav); $('wb-drawdown').innerHTML = drawdown(nav); $('wb-dailychart').innerHTML = dailyChart(daily.days || []);
    const usDate = dateUS(), date = new Date(usDate + 'T12:00:00Z'), monday = new Date(date); monday.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7)); const start = monday.toISOString().slice(0,10), end = new Date(monday.getTime() + 4 * 86400000).toISOString().slice(0,10), week = sum(rows.filter(row => row.session_date >= start && row.session_date <= end)), today = sum(rows.filter(row => row.session_date === usDate));
    $('wb-recovery-content').innerHTML = `<div class="progress-main"><strong>${progress === null ? '待更新' : progress.toFixed(2) + '%'} <small class="muted">已回本</small></strong><span>起点 ${money(plan.baseline_net_liq)} → ${money(plan.total_deposits)}</span></div>${bar(progress || 0)}<div class="milestones">${(plan.milestones || []).map(item => `<div>${esc(item.date.slice(5).replace('-','/'))}<b>${money(item.target_net_liq)}</b></div>`).join('')}</div><div class="progress-pairs"><span>本周 <b class="${color(week)}">${signed(week)} / ${money(plan.weekly_target)}</b></span><span>今晚 <b class="${color(today)}">${signed(today)} / ${money(plan.daily_target)}</b></span></div><p class="footnote">团队已平仓 · 美国交易日 ${usDate}，本周 ${start} 至 ${end}。</p>`;
    const dailyLoss = Math.max(0, -today), weeklyLoss = Math.max(0, -week), halt = dailyLoss >= risk.daily_stop || weeklyLoss >= risk.weekly_stop; $('wb-risk-badge').innerHTML = `<span class="badge ${halt ? 'bad' : ''}">${halt ? '停手' : '可交易'}</span>`; $('wb-risk-content').innerHTML = `<p class="muted">1R = ${money(risk.risk_unit)}</p><div class="risk-row"><div><span>当日净亏损</span><b>${money(dailyLoss)} / ${money(risk.daily_stop)}</b></div>${bar(dailyLoss / risk.daily_stop * 100, 'redbar')}</div><div class="risk-row"><div><span>本周净亏损</span><b>${money(weeklyLoss)} / ${money(risk.weekly_stop)}</b></div>${bar(weeklyLoss / risk.weekly_stop * 100, 'redbar')}</div><p class="footnote">仅依据已记录的团队已平仓净盈亏，不含未平仓风险；完整已用风险待更新。</p>`;
    calendarRows = rows; renderCalendar(); $('wb-prev').onclick = () => { calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1); renderCalendar(); }; $('wb-next').onclick = () => { calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1); renderCalendar(); };
    const sorted = [...rows].sort((a,b) => (b.exit_time || '').localeCompare(a.exit_time || '')); $('wb-recent').innerHTML = sorted.length ? sorted.map(row => `<div class="recent-row"><span class="pill ${row.pnl < 0 ? 'loss' : ''}">${row.pnl > 0 ? 'WIN' : row.pnl < 0 ? 'LOSS' : '平'}</span><div><b>${esc(row.symbol)}</b><small>${esc(row.side)} · ${esc(row.session_date)} · ${fmtDate(row.exit_time)} 上海</small></div><div class="recent-amount ${color(row.pnl)}">${signed(row.pnl)}<small>${(row.pnl / (valid(row.risk) && row.risk > 0 ? row.risk : risk.risk_unit)).toFixed(2)}R</small></div></div>`).join('') : '<div class="empty">待更新</div>'; $('wb-trade-stats').textContent = `累计 ${rows.length} 笔 · 净 ${(sum(rows) / risk.risk_unit).toFixed(2)}R · ${rows.length} / ${risk.trade_goal} 笔。满 40 笔、净R > 0 且胜率达标可将 1R 提到 ${risk.increase_to}；胜率标准待更新。`;
    $('wb-tonight-content').innerHTML = `<table><thead><tr><th>标的 / 方向</th><th>计划（入场 / 止损 / 目标 / 数量）</th><th>状态</th></tr></thead><tbody>${(tonight.cards || []).map(card => `<tr><td><b>${esc(card.symbol)}</b> · ${esc(card.direction)}</td><td>${esc((card.lines || []).find(line => line.startsWith('计划')) || '待更新')}</td><td>${esc((card.lines || []).find(line => line.startsWith('结果')) || '待更新')}</td></tr>`).join('')}<tr><td>备选候选</td><td colspan="2">${tonight.backup_candidates?.length ? tonight.backup_candidates.map(item => esc(item.symbol || item)).join('、') : '待更新'}</td></tr></tbody></table><p class="footnote">计划日期 ${esc(tonight.date)}；请以数据更新时间为准。</p>`;
    $('wb-holdings-content').innerHTML = `<table><thead><tr><th>标的</th><th>数量</th><th>现价</th><th>市值</th><th>成本</th><th>浮盈亏</th></tr></thead><tbody>${(snapshot.holdings_readonly || []).map(item => `<tr><td>${esc(item.symbol)}</td><td>${esc(item.qty)}</td><td>${money(item.last)}</td><td>${money(item.mv)}</td><td>${money(item.avg)}</td><td class="${color(item.upnl)}">${signed(item.upnl)}</td></tr>`).join('')}</tbody></table><p class="footnote">当日盈亏 ${money(account.today_pnl)}（${esc(account.today_pnl_date)}） · 维持保证金 ${money(account.maint_margin)} · 剩余流动性 ${money(account.excess_liq)}</p>`;
  }
  run().catch(error => { $('wb-status').textContent = '数据加载失败：' + error.message; console.error(error); });
})();
