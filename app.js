(() => {
  const $ = (s, root = document) => root.querySelector(s), $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const today = new Date(), isoDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  let dailyDate=isoDate(today);
  const money = n => `₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
  const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key='vaultiqflow-data-v2';
  const visibleItems=$$('[data-view-panel="items"] article').map(card=>{const name=card.querySelector('h4')?.textContent?.trim();const values=[...(card.querySelector('small')?.textContent||'').matchAll(/[\d,]+/g)];const amount=values.length?Number(values[values.length-1][0].replaceAll(',','')):0;return name?[name,amount]:null;}).filter(Boolean);
  const initialItems=visibleItems.length?visibleItems:[['Food & Dining',15000],['Fuel / Transport',8000],['Bills & Utilities',9000],['Groceries & Supplies',10000],['Shopping & Personal',7000],['Health & Medical',5000],['Entertainment',4000],['Home & Maintenance',6000]];
  let state;
  try { state=JSON.parse(localStorage.getItem(key)); } catch {}
  if (!state || !Array.isArray(state.items)) state={version:2,expenses:[],items:initialItems.map(([name,target])=>({id:crypto.randomUUID(),name,targets:{[`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`]:target}})),reminders:[{id:crypto.randomUUID(),title:'Daily Evening Log',time:'20:00',frequency:'Daily',enabled:true}],notifications:[],settings:{preferences:true,browser:false,sound:true,note:'',soundUrl:''}};
  state.expenses = state.expenses || []; state.reminders = state.reminders || []; state.notifications = state.notifications || []; state.settings = state.settings || {preferences:true,browser:false,sound:true,note:'',soundUrl:''};
  const notificationBadge=$('[data-notification-badge]');
  const persist=()=>{localStorage.setItem(key,JSON.stringify(state));if(notificationBadge)notificationBadge.hidden=state.notifications.length===0;};
  const itemByName=n=>state.items.find(x=>x.name.toLowerCase()===String(n).toLowerCase());
  const monthKey=(y,m)=>`${y}-${String(m+1).padStart(2,'0')}`;
  const dateOf=e=>isoDate(new Date(e.timestamp));
  const periodExpenses=(y,m)=>state.expenses.filter(e=>{const d=new Date(e.timestamp);return d.getFullYear()===y&&d.getMonth()===m;});
  const periodTargets=(y,m)=>state.items.reduce((a,i)=>a+Number(i.targets[monthKey(y,m)]||0),0);
  const catFor=(title)=>{const t=title.toLowerCase();const found=state.items.find(i=>t.includes(i.name.toLowerCase())||i.name.toLowerCase().split(/[ /&]+/).some(w=>w.length>3&&t.includes(w)));return found?.name||'Food & Dining';};
  const mealFor=h=>h>=5&&h<11?'Breakfast':h>=11&&h<16?'Afternoon':h>=16&&h<20?'Evening':'Night';
  const fmtTime=ts=>new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(ts));
  const fmtDate=d=>new Intl.DateTimeFormat(undefined,{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(d);
  const close=(d)=>{d?.close();if(!$('dialog[open]'))document.body.classList.remove('overflow-hidden');};
  const open=d=>{d?.showModal();document.body.classList.add('overflow-hidden');};
  const makeDialog=(id,title,body)=>{let d=$(`#${id}`);if(d)return d;d=document.createElement('dialog');d.id=id;d.className='box-border h-auto max-h-[calc(100dvh-16px)] w-[min(620px,calc(100vw-28px))] max-w-[calc(100vw-28px)] overflow-y-auto rounded-[26px] border border-[#2c2e36] bg-[#1b1c1f] p-0 text-[#f7f8fa] shadow-[0_20px_70px_#000] backdrop:bg-black/75 backdrop:backdrop-blur max-[700px]:fixed max-[700px]:bottom-0 max-[700px]:left-1/2 max-[700px]:right-auto max-[700px]:top-auto max-[700px]:m-0 max-[700px]:max-h-[calc(100dvh-16px)] max-[700px]:w-screen max-[700px]:max-w-none max-[700px]:-translate-x-1/2 max-[700px]:rounded-t-[28px] max-[700px]:rounded-b-none';d.innerHTML=`<div class="p-5 sm:p-7"><header class="sticky top-0 z-10 mb-5 flex items-center justify-between border-b border-[#303136] bg-[#1b1c1f] pb-4"><h2 class="m-0 text-[16px]">${title}</h2><button class="text-2xl text-[#92959c]" data-x aria-label="Close">×</button></header>${body}</div>`;document.body.append(d);d.addEventListener('click',e=>{if(e.target===d)close(d);if(e.target.closest('[data-x]'))close(d);});return d;};
  const styleToggle=input=>{if(!input||input.dataset.toggleStyled)return;input.dataset.toggleStyled='true';input.classList.add('peer','sr-only');const track=document.createElement('span');track.setAttribute('aria-hidden','true');track.className='relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full bg-[#44464b] transition-colors after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-[#00df83] peer-checked:after:translate-x-5';input.after(track);};

  // Common view navigation
  const panels=$$('[data-view-panel]'), controls=$$('[data-view-target]');
  controls.filter(c=>c.dataset.scrollTarget==='reports').forEach(c=>{c.dataset.viewTarget='reports';delete c.dataset.scrollTarget;});
  $$('dialog').forEach(d=>{d.addEventListener('cancel',()=>{if(!$('dialog[open]'))document.body.classList.remove('overflow-hidden');});d.addEventListener('close',()=>{if(!$('dialog[open]'))document.body.classList.remove('overflow-hidden');});});
  $$('[data-close-expense]').forEach(b=>b.addEventListener('click',()=>close($('#expense-dialog'))));
  const expenseCancel=$('#expense-form button[value="cancel"]');if(expenseCancel){expenseCancel.type='button';expenseCancel.addEventListener('click',()=>close($('#expense-dialog')));}
  $$('[data-close-notifications]').forEach(b=>b.addEventListener('click',()=>close($('#notifications-dialog'))));
  $$('[data-close-reminder]').forEach(b=>b.addEventListener('click',()=>close($('#reminder-dialog'))));
  $$('[data-period-close]').forEach(b=>b.addEventListener('click',()=>close($('#period-dialog'))));
  const valid=new Set([...panels.map(p=>p.dataset.viewPanel),'reports']);
  const showView=v=>{if(!valid.has(v))v='home';panels.forEach(p=>p.hidden=p.dataset.viewPanel!==v);const rp=$('[data-view-panel="reports"]');if(rp)rp.hidden=v!=='reports';document.title='VaultiqFlow';controls.forEach(c=>{const active=c.dataset.viewTarget===v;const isNav=c.dataset.navKind==='nav-link'||c.dataset.navKind==='view-tab';if(active&&isNav)c.setAttribute('aria-current','page');else c.removeAttribute('aria-current');if(isNav){c.classList.toggle('text-[#00df83]',active);c.classList.toggle('text-[#81848b]',!active&&c.dataset.navKind==='nav-link');c.classList.toggle('text-[#92959c]',!active&&c.dataset.navKind==='view-tab');}});if(location.hash!==`#${v}`)history.replaceState(null,'',`#${v}`);if(v==='daily')renderDaily();if(v==='reports')renderReport();};
  controls.forEach(c=>c.addEventListener('click',e=>{e.preventDefault();showView(c.dataset.viewTarget);const to=c.dataset.scrollTarget;if(to)setTimeout(()=>document.getElementById(to)?.scrollIntoView({behavior:'smooth'}),0);}));
  window.addEventListener('hashchange',()=>showView(location.hash.slice(1)));
  const siteHeader=$('#site-header');const syncHeaderScroll=()=>{const scrolled=window.scrollY>8;siteHeader?.classList.toggle('border-white/10',scrolled);siteHeader?.classList.toggle('bg-[rgba(16,17,18,.72)]',scrolled);siteHeader?.classList.toggle('backdrop-blur-lg',scrolled);};syncHeaderScroll();window.addEventListener('scroll',syncHeaderScroll,{passive:true});
  // Complete report view, generated with utility classes.
  const report=document.createElement('main');report.dataset.viewPanel='reports';report.hidden=true;report.className='mx-auto w-full max-w-[1180px] p-6 max-[700px]:px-[15px]';report.innerHTML=`<div class="mb-7 flex h-[72px] items-center justify-between rounded-full bg-[#191a1c] px-[25px] max-[700px]:mb-5 max-[700px]:h-[60px] max-[700px]:px-[15px] max-[390px]:px-[9px]"><button data-report-shift="-1" aria-label="Previous month" class="grid h-9 w-7 cursor-pointer place-items-center border-0 bg-transparent p-0 text-[#898c92] max-[700px]:w-6"><svg class="h-3 w-3 fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 16 16" aria-hidden="true"><path d="m10 3-5 5 5 5"/></svg></button><button id="report-period" class="sm:text-[16px] text-md"></button><button data-report-shift="1" aria-label="Next month" class="grid h-9 w-7 cursor-pointer place-items-center border-0 bg-transparent p-0 text-[#898c92] max-[700px]:w-6"><svg class="h-3 w-3 fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg></button></div><section class="mb-6 flex min-h-[350px] flex-col rounded-3xl border border-[#2b2d30] bg-[#131416] p-4 sm:p-5"><h2 class="m-0 text-lg">Monthly Spending Trend</h2><p class="mb-0 mt-1 text-sm text-[#92959c]">Spending And Budget Across The Selected Year</p><p class="mt-4 flex items-center gap-4 text-xs text-[#92959c]"><span class="inline-flex items-center gap-2"><i class="h-2 w-2 rounded-full bg-[#92959c]"></i>Budget</span><span class="inline-flex items-center gap-2"><i class="h-2 w-2 rounded-full bg-[#00df83]"></i>Spent</span></p><div id="report-chart" class="grid flex-1 grid-cols-12 items-end gap-x-1 gap-y-3"></div><div class="mt-3 grid grid-cols-2 gap-2"><article class="rounded-2xl border border-[#2b2d30] bg-[#191a1c] p-3"><h3 class="m-0 text-xs font-normal text-[#92959c]">Highest Spending Month</h3><p id="report-top-month" class="mb-0 mt-2 truncate text-sm text-[#f7f8fa]">No spending yet</p></article><article class="rounded-2xl border border-[#2b2d30] bg-[#191a1c] p-3"><h3 class="m-0 text-xs font-normal text-[#92959c]">Top Expense Category</h3><p id="report-top-category" class="mb-0 mt-2 truncate text-sm text-[#f7f8fa]">No spending yet</p></article></div></section><section class="mb-6 flex min-h-[250px] flex-col rounded-3xl border border-[#2b2d30] bg-[#131416] p-5 max-[700px]:min-h-[230px] max-[700px]:p-4"><h2 class="m-0 text-lg">This Month at A Glance</h2><p id="glance-month" class="mb-4 mt-1 text-sm text-[#92959c]"></p><div id="daily-chart" class="mb-3 mt-auto grid grid-flow-col items-end gap-[2px] pt-5"></div><div class="grid grid-cols-2 gap-2"><article class="rounded-2xl border border-[#2b2d30] bg-[#191a1c] p-3"><h3 class="m-0 text-xs font-normal text-[#92959c]">Highest Spending Category</h3><p id="glance-category" class="mb-0 mt-2 truncate text-sm text-[#f7f8fa]">No spending yet</p></article><article class="rounded-2xl border border-[#2b2d30] bg-[#191a1c] p-3"><h3 class="m-0 text-xs font-normal text-[#92959c]">Highest Spending Day</h3><p id="glance-day" class="mb-0 mt-2 truncate text-sm text-[#f7f8fa]">No spending yet</p></article></div></section><section class="rounded-3xl border border-[#2b2d30] bg-[#131416] p-6"><h2 class="text-lg">Expense Item Report</h2><div class="overflow-x-auto mt-2"><table class="w-full min-w-[640px] table-fixed text-left"><colgroup><col class="w-[30%]"><col class="w-[24%]"><col class="w-[23%]"><col class="w-[23%]"></colgroup><thead class="font-normal text-[#92959c]"><tr><th class="p-3 font-normal">Category Name</th><th class="font-normal">Yearly Target</th><th class="font-normal">Yearly Spent</th><th class="font-normal">Extra Spent</th></tr></thead><tbody id="report-table"></tbody></table></div></section>`;document.body.append(report);
  let reportDate=new Date(today.getFullYear(),today.getMonth(),1);
  ['#report-top-category','#glance-category'].forEach(selector=>{
    const summary=$(selector);
    summary.classList.remove('truncate');
    summary.classList.add('min-w-0','whitespace-normal','break-words');
    summary.parentElement.classList.add('min-w-0');
  });
  function renderReport(){const y=reportDate.getFullYear(),m=reportDate.getMonth(),monthExpenses=periodExpenses(y,m);$('#report-period').textContent=new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(reportDate);const chart=$('#report-chart');chart.innerHTML='';const monthTargets=Array.from({length:12},(_,i)=>periodTargets(y,i)),monthSpends=Array.from({length:12},(_,i)=>periodExpenses(y,i).reduce((a,e)=>a+e.amount,0)),monthMax=Math.max(1,...monthTargets,...monthSpends);for(let i=0;i<12;i++){const t=monthTargets[i],s=monthSpends[i];chart.insertAdjacentHTML('beforeend',`<div class="flex min-w-0 flex-col items-center justify-end gap-1"><div class="flex h-24 w-full items-end justify-center gap-0.5 sm:gap-1 sm:h-28"><i title="Budget: ${money(t)}" class="w-1.5 rounded-t bg-[#92959c] sm:w-3" style="height:${t?Math.max(2,t/monthMax*100):0}%"></i><i title="Spent: ${money(s)}" class="w-1.5 rounded-t bg-[#00df83] sm:w-3" style="height:${s?Math.max(2,s/monthMax*100):0}%"></i></div><small class="text-[11px] text-[#92959c]">${new Intl.DateTimeFormat(undefined,{month:'narrow'}).format(new Date(y,i,1))}</small></div>`);}const topMonthIndex=monthSpends.reduce((best,value,index)=>value>monthSpends[best]?index:best,0);$('#report-top-month').textContent=monthSpends[topMonthIndex]?`${new Intl.DateTimeFormat(undefined,{month:'long'}).format(new Date(y,topMonthIndex,1))}  /  ${money(monthSpends[topMonthIndex])}`:'No spending yet';const yearCategoryTotals=new Map();state.expenses.filter(e=>new Date(e.timestamp).getFullYear()===y).forEach(e=>yearCategoryTotals.set(e.category,(yearCategoryTotals.get(e.category)||0)+e.amount));const reportTopCategory=[...yearCategoryTotals.entries()].sort((a,b)=>b[1]-a[1])[0];$('#report-top-category').textContent=reportTopCategory?`${reportTopCategory[0]}  /  ${money(reportTopCategory[1])}`:'No spending yet';const days=new Date(y,m+1,0).getDate(),dchart=$('#daily-chart'),dayValues=Array.from({length:days},(_,i)=>monthExpenses.filter(e=>new Date(e.timestamp).getDate()===i+1).reduce((a,e)=>a+e.amount,0)),maxDaily=Math.max(1,...dayValues);$('#glance-month').textContent=new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(reportDate);const categoryTotals=new Map();monthExpenses.forEach(e=>categoryTotals.set(e.category,(categoryTotals.get(e.category)||0)+e.amount));const topCategory=[...categoryTotals.entries()].sort((a,b)=>b[1]-a[1])[0],topDay=dayValues.reduce((best,value,i)=>value>best.value?{value,day:i+1}:best,{value:0,day:0});$('#glance-category').textContent=topCategory?`${topCategory[0]}  /  ${money(topCategory[1])}`:'No spending yet';$('#glance-day').textContent=topDay.day?`${topDay.day} ${new Intl.DateTimeFormat(undefined,{month:'short'}).format(reportDate)}  /  ${money(topDay.value)}`:'No spending yet';dchart.style.gridTemplateColumns=`repeat(${days},minmax(0,1fr))`;dchart.innerHTML=dayValues.map((value,i)=>`<div title="${i+1}: ${money(value)}" class="flex min-w-0 flex-col items-center justify-end gap-1"><i class="w-full max-w-[10px] rounded-t ${value?'bg-[#00df83]':'bg-[#55585e]'}" style="height:${value?Math.max(3,value/maxDaily*12):2}px"></i><small class="text-[7px] leading-none text-[#92959c] max-[390px]:text-[6px]">${i+1}</small></div>`).join('');const tbody=$('#report-table');tbody.innerHTML='';state.items.forEach(item=>{const target=Array.from({length:12},(_,i)=>Number(item.targets[monthKey(y,i)]||0)).reduce((a,n)=>a+n,0),spent=state.expenses.filter(e=>e.category===item.name&&new Date(e.timestamp).getFullYear()===y).reduce((a,e)=>a+e.amount,0);tbody.insertAdjacentHTML('beforeend',`<tr class="border-t border-[#292b2e] text-sm"><td class="p-3">${esc(item.name)}</td><td>${money(target)}</td><td>${money(spent)}</td><td>${money(Math.max(0,spent-target))}</td></tr>`);});}
  $$('[data-report-shift]').forEach(b=>b.onclick=()=>{reportDate.setMonth(reportDate.getMonth()+Number(b.dataset.reportShift));renderReport();});
  $('#report-period').onclick=()=>{const d=$('#period-dialog');if(!d)return;d.dataset.targetView='reports';d.dataset.draftYear=String(reportDate.getFullYear());d.dataset.draftMonth=String(reportDate.getMonth());$('#period-dialog-year').textContent=String(reportDate.getFullYear());$$('[data-period-month]',d).forEach(x=>x.dataset.selected=String(Number(x.dataset.periodMonth)===reportDate.getMonth()));open(d);};

  // Home: data driven recent activity and item budget; retain initial item labels and targets.
  $$('#budget-list article').forEach(card=>{const n=card.querySelector('h4')?.textContent?.trim();if(n&&!itemByName(n)){state.items.push({id:crypto.randomUUID(),name:n,targets:{[monthKey(today.getFullYear(),today.getMonth())]:0}});}});
  const home=$('[data-view-panel="home"]'),daily=$('[data-view-panel="daily"]');
  const homePeriodStorageKey='vaultiqflow-home-period-v1';
  let selectedHomeYear=today.getFullYear(),selectedHomeMonth=today.getMonth();
  try{const savedPeriod=JSON.parse(localStorage.getItem(homePeriodStorageKey));if(Number.isInteger(savedPeriod?.year)&&Number.isInteger(savedPeriod?.month)&&savedPeriod.month>=0&&savedPeriod.month<12){selectedHomeYear=savedPeriod.year;selectedHomeMonth=savedPeriod.month;}}catch(error){console.warn('Ignoring invalid saved Home period.',error);}
  function syncHomePeriodSelection(){
    const selectedDate=new Date(selectedHomeYear,selectedHomeMonth,1),label=new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(selectedDate);
    const selectedPeriod=$('#selected-period'),selectedYear=$('#selected-year'),todayButton=$('[data-home-today]');
    if(selectedPeriod)selectedPeriod.textContent=label;
    if(selectedYear)selectedYear.textContent=String(selectedHomeYear);
    const isCurrentPeriod=selectedHomeYear===today.getFullYear()&&selectedHomeMonth===today.getMonth();
    $$('[data-open-period]').forEach(button=>{
      button.dataset.month=String(selectedHomeMonth);button.dataset.year=String(selectedHomeYear);
      button.classList.toggle('rounded-full',!isCurrentPeriod);button.classList.toggle('bg-[#292b2e]',!isCurrentPeriod);button.classList.toggle('bg-transparent',isCurrentPeriod);
      button.classList.toggle('font-bold',!isCurrentPeriod);button.classList.toggle('font-semibold',isCurrentPeriod);button.setAttribute('aria-pressed',String(!isCurrentPeriod));
    });
    if(todayButton){todayButton.classList.toggle('bg-[#292b2e]',isCurrentPeriod);todayButton.classList.toggle('bg-transparent',!isCurrentPeriod);todayButton.classList.toggle('text-[#e5e6e8]',isCurrentPeriod);todayButton.classList.toggle('text-[#92959c]',!isCurrentPeriod);todayButton.classList.toggle('font-bold',isCurrentPeriod);todayButton.classList.toggle('font-semibold',!isCurrentPeriod);todayButton.setAttribute('aria-pressed',String(isCurrentPeriod));}
    localStorage.setItem(homePeriodStorageKey,JSON.stringify({year:selectedHomeYear,month:selectedHomeMonth}));
  }
  syncHomePeriodSelection();
  const activitySection=$$('section',home).find(s=>s.textContent.includes('Recent Activity'));
  const activity=activitySection?.querySelector(':scope > div.rounded-\\[20px\\]');
  const budgetList=itemsMainList();
  function itemsMainList(){const p=$('[data-view-panel="items"]');return p?.querySelector('#budget-list');}
  const homeExpenseSection=$$('section',home).find(s=>s.querySelector('h2')?.textContent.trim()==='Your Expenses');
  const homeExpenses=homeExpenseSection?.querySelector(':scope > div.grid');
  const homeBudgetSection=$$('section',home).find(s=>s.textContent.includes('Budget by Expense'));
  const homeBudget=homeBudgetSection?.querySelector(':scope > div.grid');
  const homeBudgetHeading=homeBudgetSection?.querySelector('h2');if(homeBudgetHeading){homeBudgetHeading.textContent='Your Expense Items';homeBudgetHeading.className='m-0 text-[22px] tracking-[-.45px] max-[700px]:text-[19px]';const headingRow=homeBudgetHeading.parentElement;if(headingRow)headingRow.className='mb-[14px] flex items-center gap-3 max-[700px]:gap-[9px]';headingRow?.querySelector('button')?.remove();const countBadge=homeBudgetSection.querySelector('span');if(countBadge)countBadge.className='rounded-[20px] bg-[#1b1d1f] px-3 py-[5px] text-[13px] text-[#00df83]';if(!homeBudgetSection.querySelector('[data-home-budget-copy]')){const copy=document.createElement('p');copy.dataset.homeBudgetCopy='';copy.className='-mt-2 mb-5 text-sm text-[#92959c]';copy.textContent='Change a target for the selected month; items remain available in other months.';headingRow?.after(copy);}}
  function itemRowMarkup(item,period,itemsPage=false){const actionSize=itemsPage?'size-8 rounded-xl border border-[#303438] bg-[#17181b]':'size-9 rounded-lg',iconSize='size-[17px]';return `<article class="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[#2b2d30] bg-[#191a1c] p-4 transition-colors hover:border-[#41444a] max-[390px]:gap-2 max-[390px]:p-3"><span class="grid size-11 place-items-center rounded-[18px] border border-[#303438] bg-[#202225] text-base text-[#00df83]">${iconFor(item.name)}</span><div class="min-w-0"><h3 class="truncate text-[15px] font-medium">${esc(item.name)}</h3><small class="text-[13px] text-[#92959c]">${money(item.targets[period]||0)} monthly target</small></div><div class="flex items-center gap-1"><button class="grid ${actionSize} place-items-center text-[#92959c] transition-colors hover:bg-white/5 hover:text-white" type="button" title="Edit ${esc(item.name)}" aria-label="Edit ${esc(item.name)}" data-item-action="edit" data-item-id="${item.id}" data-target-month="${period}"><svg class="${iconSize} fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24"><path d="m14 5 5 5M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z"/></svg></button><button class="grid ${actionSize} place-items-center text-[#92959c] transition-colors hover:bg-red-500/10 hover:text-red-300" type="button" title="Delete ${esc(item.name)}" aria-label="Delete ${esc(item.name)}" data-item-action="delete" data-item-id="${item.id}" data-target-month="${period}"><svg class="${iconSize} fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24"><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14m-8-4h4l1 4H8l1-4Z"/></svg></button></div></article>`;}
  function renderExpenseItemRows(container,period,itemsPage=false){if(!container)return;container.innerHTML=state.items.map(item=>itemRowMarkup(item,period,itemsPage)).join('');}
  function renderHomeExpenses(){
    if(!homeExpenses)return;
    const period=monthKey(selectedHomeYear,selectedHomeMonth),spendByCategory=new Map();
    periodExpenses(selectedHomeYear,selectedHomeMonth).forEach(expense=>spendByCategory.set(expense.category,(spendByCategory.get(expense.category)||0)+expense.amount));
    const colors=['#ff704b','#ffd000','#b34cff','#00d9e8','#00e787','#f342a0','#9e8cff','#33bdf4'];
    homeExpenses.innerHTML=state.items.map((item,index)=>{
      const spent=spendByCategory.get(item.name)||0,target=Number(item.targets[period]||0),percent=target?spent/target*100:0,color=colors[index%colors.length];
      return `<article class="grid grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-x-[18px] gap-y-3 rounded-[26px] border border-[#2b2d30] bg-[#191a1c] px-6 py-[22px] max-[700px]:grid-cols-[50px_minmax(0,1fr)_auto] max-[700px]:gap-x-3 max-[700px]:gap-y-[10px] max-[700px]:rounded-[22px] max-[700px]:px-4 max-[700px]:py-[14px]"><span class="grid h-[60px] w-[60px] place-items-center rounded-[22px] border max-[700px]:h-10 max-[700px]:w-10 max-[700px]:rounded-[18px]" style="color:${color};border-color:${color}73;background-color:${color}1a">${iconFor(item.name)}</span><div class="min-w-0"><h4 class="block overflow-hidden text-ellipsis whitespace-nowrap text-[21px] max-[700px]:text-[15px]">${esc(item.name)}</h4><small class="mt-px block text-[17px] text-[#92959c] max-[700px]:text-[13px]">${money(spent)} of ${money(target)}</small></div><b class="whitespace-nowrap text-md">${target?`${Math.round(percent*10)/10}%`:'No target'}</b><div class="col-span-3 h-3 overflow-hidden rounded-[20px] bg-[#282a2d] max-[700px]:h-1"><i class="block h-full rounded-[inherit]" style="width:${Math.min(100,percent)}%;background-color:${color}"></i></div></article>`;
    }).join('')||'<p class="rounded-2xl border border-[#2b2d30] bg-[#191a1c] p-4 text-sm text-[#92959c]">No expense categories yet.</p>';
  }
  function openItemEditor(id,period){const item=state.items.find(x=>x.id===id);if(!item)return;const dlg=makeDialog('item-edit-dialog','Edit Expense Item',`<form id="item-edit-form" class="grid gap-3"><label>Name<input class="mt-2 h-11 w-full rounded-xl border border-[#30333b] bg-[#191a22] px-3" name="name" required value="${esc(item.name)}"></label><label>Monthly target<input class="mt-2 h-11 w-full rounded-xl border border-[#30333b] bg-[#191a22] px-3" name="target" type="number" min="0" required value="${Number(item.targets[period]||0)}"></label><button class="rounded-xl bg-[#00df83] p-3 text-black">Save</button></form>`),form=$('#item-edit-form',dlg);if(!form)return;form.elements.name.value=item.name;form.elements.target.value=Number(item.targets[period]||0);open(dlg);form.onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),old=item.name,newName=String(f.get('name')).trim();if(!newName)return;item.name=newName;item.targets[period]=Number(f.get('target'));state.expenses.forEach(x=>{if(x.category===old)x.category=newName;});persist();close(dlg);renderHome();renderItems();};}
  function confirmItemDelete(id){const item=state.items.find(x=>x.id===id);if(!item)return;const dlg=makeDialog('item-delete-dialog','Delete expense item',`<p>Delete ${esc(item.name)} from your items? Existing expense history will be kept.</p><div class="mt-4 flex gap-3"><button data-x class="rounded-xl border border-[#444] px-4">Close</button> <button id="delete-item-confirm" class="rounded-xl bg-red-600 px-4 py-3">Confirm Delete</button></div>`);open(dlg);$('#delete-item-confirm').onclick=()=>{state.items=state.items.filter(x=>x.id!==id);persist();close(dlg);renderHome();renderItems();};}
  function bindExpenseItemActions(container){container?.addEventListener('click',e=>{const button=e.target.closest('[data-item-action]');if(!button)return;if(button.dataset.itemAction==='edit')openItemEditor(button.dataset.itemId,button.dataset.targetMonth);if(button.dataset.itemAction==='delete')confirmItemDelete(button.dataset.itemId);});}
  bindExpenseItemActions(homeBudget);bindExpenseItemActions(budgetList);
  function renderHome(){renderHomeExpenses();if(homeBudget){renderExpenseItemRows(homeBudget,monthKey(selectedHomeYear,selectedHomeMonth));const count=homeBudgetSection?.querySelector('span');if(count)count.textContent=`${state.items.length} Items`;}
    const all=state.expenses.slice().sort((a,b)=>b.timestamp.localeCompare(a.timestamp));const nowKey=isoDate(today),yest=new Date(today);yest.setDate(yest.getDate()-1);const group=all.filter(e=>dateOf(e)===nowKey);const chosen=group.length?group:all.filter(e=>dateOf(e)===isoDate(yest));window.activityDate=group.length?nowKey:isoDate(yest);const recent=chosen.slice(0,5);if(activity)activity.innerHTML=recent.map(e=>`<article class="relative flex items-center gap-3 border-b border-[#292b2e] px-[6px] py-[10px] last:border-0"><span class="grid h-[37px] w-[37px] place-items-center rounded-[17px] border border-[#00df83]/20 bg-[#202225] text-[#00df83]">${iconFor(e.category)}</span><div class="min-w-0"><h4 class="truncate text-[14px]">${esc(e.title)}</h4><small class="text-xs text-[#92959c]">${esc(dateOf(e))}, ${fmtTime(e.timestamp)}</small></div><b class="ml-auto text-sm font-normal">${money(e.amount)}</b></article>`).join('')||'<p class="p-3 text-sm text-[#92959c]">No expenses yet.</p>';const view=activitySection?.querySelector('button');if(view)view.onclick=()=>{showView('daily');selectDailyDate(window.activityDate);};renderHomeOverview();}
  function renderHomeOverview(){
    const year=Number($('#selected-year')?.textContent)||today.getFullYear();
    const bars=$$('[data-chart-bar]');
    const vals=Array.from({length:12},(_,m)=>periodExpenses(year,m).reduce((a,e)=>a+e.amount,0));
    const max=Math.max(1000,Math.ceil(Math.max(0,...vals)/1000)*1000),chartBars=$('[data-chart-bars]'),axisLabels=$$('span',chartBars?.parentElement?.previousElementSibling);
    const axisValue=value=>value>=1000?`₹${Math.round(value/100)/10}k`:`₹${Math.round(value)}`;
    [max,max*.75,max*.5,max*.25,0].forEach((value,index)=>{if(axisLabels[index])axisLabels[index].textContent=index===4?'0':axisValue(value);});
    bars.forEach((bar,m)=>{bar.style.boxSizing='border-box';bar.style.paddingBottom='24px';bar.dataset.selected=String(m===selectedHomeMonth);bar.title=`${new Intl.DateTimeFormat(undefined,{month:'long'}).format(new Date(year,m,1))}: ${money(vals[m])}`;bar.setAttribute('aria-label',bar.title);const fill=bar.querySelector('b');if(fill){fill.style.height=vals[m]?`${vals[m]/max*100}%`:'0%';fill.dataset.selected=String(m===selectedHomeMonth);}const label=bar.querySelector('span');if(label)label.dataset.selected=String(m===selectedHomeMonth);const tooltip=bar.querySelector('em');if(tooltip)tooltip.remove();});
    const title=$('#monthly-spending-total');
    if(title)title.innerHTML=`<span style="margin-right:8px">₹</span>${money(vals[selectedHomeMonth]||0).slice(1)}`;
    const period=monthKey(selectedHomeYear,selectedHomeMonth),monthExpenses=periodExpenses(selectedHomeYear,selectedHomeMonth),target=periodTargets(selectedHomeYear,selectedHomeMonth),spent=monthExpenses.reduce((a,e)=>a+e.amount,0),previousYearSpent=periodExpenses(selectedHomeYear-1,selectedHomeMonth).reduce((a,e)=>a+e.amount,0),yearChange=spent-previousYearSpent,remaining=Math.max(0,target-spent),safePercent=target>0?Math.min(100,Math.round(remaining/target*100)):null;
    const isTodayActive=selectedHomeYear===today.getFullYear()&&selectedHomeMonth===today.getMonth();
    const homeTotalLabel=$('#home-total-label');
    if(homeTotalLabel)homeTotalLabel.textContent=isTodayActive?"Today's total spent":'Monthly total spent';
    const currentDate=new Date(),currentDateKey=isoDate(currentDate),previousDate=new Date(currentDate);
    previousDate.setDate(previousDate.getDate()-1);
    const previousDateKey=isoDate(previousDate);
    const spendForDate=dateKey=>state.expenses.filter(e=>dateOf(e)===dateKey).reduce((a,e)=>a+e.amount,0);
    const expToday=spendForDate(currentDateKey),expYesterday=spendForDate(previousDateKey),homeTotal=home?.querySelector('h1'),displayedSpend=isTodayActive?expToday:spent;
    if(homeTotal)homeTotal.innerHTML=`<span class="pr-2 text-[.67em] font-medium align-[12%] text-[#00df83]">₹</span>${displayedSpend.toLocaleString('en-IN',{minimumFractionDigits:2})}`;
    let comparisonText,trend='neutral';
    if(isTodayActive){
      if(expYesterday===0){
        comparisonText=expToday===0?'No spending today or yesterday':'Spent Today';
        if(expToday>0)trend='up';
      }else if(expToday===expYesterday)comparisonText='Same as yesterday';
      else{
        const percent=Math.round(Math.abs(expToday-expYesterday)/expYesterday*100);
        trend=expToday>expYesterday?'up':'down';
        comparisonText=`${percent||'<1'}% ${trend==='down'?'less':'more'} than yesterday`;
      }
    }else if(previousYearSpent===0){
      comparisonText=spent===0?'No spending this month or last year':'New spending vs last year';
      if(spent>0)trend='up';
    }else if(spent===previousYearSpent)comparisonText='Same as last year';
    else{
      const percent=Math.round(Math.abs(spent-previousYearSpent)/previousYearSpent*100);
      trend=spent>previousYearSpent?'up':'down';
      comparisonText=`${percent||'<1'}% ${trend==='down'?'less':'more'} than last year`;
    }
    const comparison=$('#daily-spend-comparison'),comparisonIcon=$('#daily-spend-comparison-icon');
    if(comparison)comparison.textContent=comparisonText;
    if(comparisonIcon)comparisonIcon.setAttribute('d',trend==='up'?'m4 17 7-7 4 4 5-7M14 7h6v6':trend==='down'?'m4 7 7 7 4-4 5 7M14 17h6v-6':'M7 17 17 7M9 7h8v8');
    const yearChangeValue=$('#year-change-value');
    if(yearChangeValue)yearChangeValue.textContent=`${yearChange>0?'+':yearChange<0?'-':''}${money(Math.abs(yearChange))}`;
    const safeLabel=$('#budget-safe-label');
    if(safeLabel)safeLabel.textContent=safePercent===null?'No Target':`${safePercent}% Safe`;
    const spendByCategory=new Map();
    monthExpenses.forEach(e=>spendByCategory.set(e.category,(spendByCategory.get(e.category)||0)+e.amount));
    const breaches=state.items.filter(item=>(spendByCategory.get(item.name)||0)>Number(item.targets[period]||0)).length,breachLabel=$('#budget-breach-label');
    if(breachLabel)breachLabel.textContent=`${breaches} ${breaches===1?'Breach':'Breaches'}`;
    const cards=$$('article',$('[aria-label="Monthly budget summary"]'));
    if(cards.length>=3){cards[0].querySelector('h4').textContent=money(target);cards[1].querySelector('h4').textContent=money(remaining);cards[2].querySelector('h4').textContent=money(Math.max(0,spent-target));}
  }
  $$('[data-chart-bar]').forEach((bar,index)=>bar.addEventListener('click',()=>{selectedHomeMonth=index;selectedHomeYear=Number($('#selected-year')?.textContent)||today.getFullYear();syncHomePeriodSelection();renderHome();}));
  function iconFor(name){
    const n=String(name).toLowerCase();
    const svg=(body,size='h-6 w-6')=>`<svg class="${size} fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
    if(!n)return svg('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>','h-[18px] w-[18px]');
    if(/emergency\s*fund/i.test(n))return svg('<path d="M5 8h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12v5"/><path d="M21 12h-5a2 2 0 0 0 0 4h5"/><path d="M16 14h.01"/>');
    if(/post\s*office\s*rd|groww\s*sip/i.test(n))return svg('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>');
    if(/food|dining|restaurant|cafe/i.test(n))return svg('<path d="M3 11h18a9 9 0 0 1-18 0Zm2-4 2 2m3-4 1 3m4-3-1 3m5-1-2 2"/><path d="M5 20h14"/>');
    if(/grocer|suppl/i.test(n))return svg('<path d="M4 9h16l-1 11H5L4 9Z"/><path d="m4 9 2-5h12l2 5M9 13v3m6-3v3"/>');
    if(/fuel|transport|vehicle|travel/i.test(n))return svg('<path d="M5 16V8l2-3h10l2 3v8M4 16h16l-1 4h-3l-.5-2h-7L8 20H5l-1-4Z"/><path d="M7 12h2m6 0h2M19 9h2l1 3v4h-3"/>');
    if(/bill|utilit|electric|water/i.test(n))return svg('<path d="M13 2 4 13h7l-1 9 10-12h-7l1-8Z"/>');
    if(/health|medical|pharma/i.test(n))return svg('<path d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.8 4.8 0 0 1 12 6.3a4.8 4.8 0 0 1 8.8 2.5Z"/><path d="M9 11h6m-3-3v6"/>');
    if(/shop|personal|cloth|apparel/i.test(n))return svg('<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>');
    if(/entertain|movie|game|hobby/i.test(n))return svg('<path d="M4 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><path d="m10 10 5 3-5 3v-6Z"/>');
    if(/home|housing|rent|mainten/i.test(n))return svg('<path d="m3 11 9-8 9 8v10h-6v-7H9v7H3V11Z"/><path d="M14 21v-4h2"/>');
    return svg('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>');
  }

  // Add expense, remember the note and infer the meal from the current local time.
  const expDialog=$('#expense-dialog'),expForm=$('#expense-form'),amount=$('#expense-amount'),note=$('#expense-note');
  const datePickerWrap=$('[data-date-picker-trigger]'),dateInput=$('#expense-date'),dateDisplay=$('#expense-date-display'),timeInput=$('#expense-time');
  const formatExpenseDate=value=>{const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value||'');return match?`${match[3]}/${match[2]}/${match[1]}`:'';};
  dateInput?.addEventListener('change',()=>{if(dateDisplay)dateDisplay.value=formatExpenseDate(dateInput.value);});
  function showStatusToast(message){
    let toast=$('#new-item-saved-toast');
    if(!toast){toast=document.createElement('div');toast.id='new-item-saved-toast';toast.className='fixed left-1/2 top-6 z-[200] -translate-x-1/2 rounded-2xl border-0 bg-[linear-gradient(110deg,#00e984,#00bb62)] px-5 py-3 text-sm font-semibold text-black shadow-[0_12px_36px_rgba(0,0,0,.45)]';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.append(toast);}
    toast.textContent=message;toast.hidden=false;
    clearTimeout(showStatusToast.timeout);showStatusToast.timeout=window.setTimeout(()=>{toast.hidden=true;},3000);
  }
  function showNewItemSaved(){showStatusToast('Item Saved');}
  const popupPlacement=(anchor,popup,heightLimit)=>{const r=anchor.getBoundingClientRect(),vv=window.visualViewport;let viewTop=vv?.offsetTop||0,viewBottom=viewTop+(vv?.height||window.innerHeight);for(let p=anchor.parentElement;p&&p!==document.body;p=p.parentElement){const overflow=getComputedStyle(p).overflowY;if(/auto|scroll|hidden|clip/.test(overflow)){const clip=p.getBoundingClientRect();viewTop=Math.max(viewTop,clip.top);viewBottom=Math.min(viewBottom,clip.bottom);}}const spaceAbove=Math.max(0,r.top-viewTop-8),spaceBelow=Math.max(0,viewBottom-r.bottom-8),desired=Math.min(popup.scrollHeight||heightLimit,heightLimit);const direction=spaceBelow>=desired?'down':spaceAbove>=desired?'up':spaceBelow>=spaceAbove?'down':'up';return{direction,maxHeight:Math.max(0,Math.min(desired,direction==='down'?spaceBelow:spaceAbove))};};
  let calendarMonth=new Date(today.getFullYear(),today.getMonth(),1),calendarPopup=null,calendarBackdrop=null,calendarPositionHandler=null,activeDateInput=null,activeDateAnchor=null,calendarCentered=false,calendarViewportCentered=false;
  const closeCalendar=()=>{calendarPopup?.remove();calendarBackdrop?.remove();calendarPopup=null;calendarBackdrop=null;activeDateInput?.setAttribute('aria-expanded','false');activeDateAnchor?.classList.remove('z-[110]');activeDateInput=null;activeDateAnchor=null;calendarCentered=false;calendarViewportCentered=false;if(calendarPositionHandler){window.removeEventListener('resize',calendarPositionHandler);window.removeEventListener('scroll',calendarPositionHandler,true);window.visualViewport?.removeEventListener('resize',calendarPositionHandler);window.visualViewport?.removeEventListener('scroll',calendarPositionHandler);calendarPositionHandler=null;}};
  const renderCalendar=()=>{
    if(!calendarPopup)return;
    const y=calendarMonth.getFullYear(),m=calendarMonth.getMonth(),first=new Date(y,m,1),start=new Date(y,m,1-((first.getDay()+6)%7));
    const title=new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(calendarMonth);
    const weekdays=['Mo','Tu','We','Th','Fr','Sa','Su'];
    const days=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const value=isoDate(d),selected=value===activeDateInput?.value,sameMonth=d.getMonth()===m;return `<button type="button" class="grid h-10 w-10 place-items-center justify-self-center rounded-xl text-sm font-semibold transition-colors ${selected?'border border-[#00df83] bg-[#075a48] text-white':sameMonth?'text-[#e4e4e7] hover:bg-[#303136]':'text-[#66676d] hover:bg-[#303136]'}" data-calendar-date="${value}" aria-label="${new Intl.DateTimeFormat(undefined,{dateStyle:'full'}).format(d)}" ${selected?'aria-current="date"':''}>${d.getDate()}</button>`;}).join('');
    calendarPopup.innerHTML=`<div class="sticky top-0 z-10 mb-5 flex items-center justify-between bg-[#1b1c1f]"><button type="button" data-calendar-shift="-1" class="grid h-10 w-10 place-items-center rounded-xl border border-[#38393e] bg-[#252629] text-[#d7d7da] hover:bg-[#303136]" aria-label="Previous month"><svg class="h-4 w-4 fill-none stroke-current [stroke-width:2] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button><h2 class="m-0 text-[17px] font-bold text-[#f1f1f3]">${title}</h2><button type="button" data-calendar-shift="1" class="grid h-10 w-10 place-items-center rounded-xl border border-[#38393e] bg-[#252629] text-[#d7d7da] hover:bg-[#303136]" aria-label="Next month"><svg class="h-4 w-4 fill-none stroke-current [stroke-width:2] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button></div><div class="mb-2 grid grid-cols-7 gap-y-2 text-center text-xs font-semibold text-[#8f9096]">${weekdays.map(d=>`<span class="py-1">${d}</span>`).join('')}</div><div class="grid grid-cols-7 gap-y-2">${days}</div>`;
  };
  const openCalendar=(input=dateInput,anchorOverride=null,centerViewport=false)=>{
    if(!input)return;
    if(calendarPopup&&activeDateInput===input){closeCalendar();return;}if(calendarPopup)closeCalendar();
    let anchor=anchorOverride||input.closest('[data-date-picker-trigger],[data-date-picker-anchor]');if(!anchor){anchor=document.createElement('span');anchor.dataset.datePickerAnchor='';anchor.className='relative block w-full min-w-0';input.before(anchor);anchor.append(input);input.classList.add('w-full');}
    activeDateInput=input;activeDateAnchor=anchor;calendarCentered=!!input.closest('dialog')&&!anchorOverride;calendarViewportCentered=centerViewport;anchor.classList.add('relative','z-[110]');
    const selected=input.value?new Date(`${input.value}T12:00:00`):today;
    calendarMonth=new Date(selected.getFullYear(),selected.getMonth(),1);
    calendarPopup=document.createElement('section');calendarPopup.id='expense-date-calendar';calendarPopup.setAttribute('role','dialog');calendarPopup.setAttribute('aria-label','Choose expense date');calendarPopup.className=calendarViewportCentered?'fixed left-1/2 top-1/2 z-[120] w-[400px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[27px] border border-[#3b3c40] bg-[#1b1c1f] p-5 shadow-[0_18px_60px_rgba(0,0,0,.65)] max-[420px]:p-4':calendarCentered?'absolute left-1/2 top-1/2 z-[120] w-[400px] max-w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[27px] border border-[#3b3c40] bg-[#1b1c1f] p-5 shadow-[0_18px_60px_rgba(0,0,0,.65)] max-[420px]:p-4':'absolute left-1/2 z-[120] w-[400px] max-w-[calc(100vw-24px)] -translate-x-1/2 overflow-y-auto rounded-[27px] border border-[#3b3c40] bg-[#1b1c1f] p-5 shadow-[0_18px_60px_rgba(0,0,0,.65)] max-[420px]:p-4';calendarPopup.style.boxSizing='border-box';
    const modal=input.closest('dialog'),host=calendarViewportCentered?document.body:calendarCentered?modal:anchor;if(calendarCentered||calendarViewportCentered){calendarBackdrop=document.createElement('div');calendarBackdrop.className=calendarViewportCentered?'fixed inset-0 z-[110] bg-black/30 backdrop-blur-sm':'absolute inset-0 z-[110] bg-black/25 backdrop-blur-lg';calendarBackdrop.addEventListener('click',closeCalendar);host.append(calendarBackdrop);}host.append(calendarPopup);renderCalendar();calendarPopup.addEventListener('click',e=>{const shift=e.target.closest('[data-calendar-shift]');if(shift){e.preventDefault();calendarMonth.setMonth(calendarMonth.getMonth()+Number(shift.dataset.calendarShift));renderCalendar();calendarPositionHandler?.();return;}const day=e.target.closest('[data-calendar-date]');if(day){e.preventDefault();activeDateInput.value=day.dataset.calendarDate;activeDateInput.dispatchEvent(new Event('change',{bubbles:true}));closeCalendar();}});calendarPositionHandler=()=>{if(calendarCentered){const modalRect=modal.getBoundingClientRect(),viewHeight=window.visualViewport?.height||window.innerHeight,modalWidth=modal.clientWidth,modalHeight=Math.min(modalRect.height,viewHeight);calendarPopup.style.width=`${Math.max(0,Math.min(400,modalWidth-24))}px`;calendarPopup.style.maxHeight=`${Math.max(0,modalHeight-24)}px`;}else if(calendarViewportCentered){const viewport=window.visualViewport,viewWidth=viewport?.width||window.innerWidth,viewHeight=viewport?.height||window.innerHeight;calendarPopup.style.left=`${(viewport?.offsetLeft||0)+viewWidth/2}px`;calendarPopup.style.top=`${(viewport?.offsetTop||0)+viewHeight/2}px`;calendarPopup.style.width=`${Math.max(0,Math.min(400,viewWidth-24))}px`;calendarPopup.style.maxHeight=`${Math.max(0,viewHeight-24)}px`;}else{const place=popupPlacement(anchor,calendarPopup,480);calendarPopup.classList.remove('top-full','bottom-full','top-[calc(100%+8px)]','bottom-[calc(100%+8px)]','rounded-b-[27px]','rounded-t-none','rounded-t-[27px]','rounded-b-none','border-t-0','border-b-0');calendarPopup.classList.add(...(place.direction==='down'?['top-[calc(100%+8px)]','rounded-b-[27px]','rounded-t-none','border-t-0']:['bottom-[calc(100%+8px)]','rounded-t-[27px]','rounded-b-none','border-b-0']));calendarPopup.style.maxHeight=`${place.maxHeight}px`;}};window.addEventListener('resize',calendarPositionHandler);window.addEventListener('scroll',calendarPositionHandler,true);window.visualViewport?.addEventListener('resize',calendarPositionHandler);window.visualViewport?.addEventListener('scroll',calendarPositionHandler);calendarPositionHandler();input.setAttribute('aria-haspopup','dialog');input.setAttribute('aria-expanded','true');
  };
  datePickerWrap?.addEventListener('click',e=>{if(e.target===dateInput)return;e.preventDefault();openCalendar(dateInput);});
  document.addEventListener('click',e=>{const input=e.target.closest('input[type="date"]');if(input){e.preventDefault();openCalendar(input);}},true);
  document.addEventListener('cancel',e=>{if(e.target.matches('dialog'))closeCalendar();},true);
  let activeFieldDropdown=null;
  const closeFieldDropdown=()=>{if(!activeFieldDropdown)return;const {menu,target,anchor,reposition}=activeFieldDropdown;if(menu instanceof HTMLDialogElement&&menu.open)menu.close();menu.remove();target.setAttribute('aria-expanded','false');anchor.classList.remove('z-[110]');window.removeEventListener('resize',reposition);window.removeEventListener('scroll',reposition,true);window.visualViewport?.removeEventListener('resize',reposition);window.visualViewport?.removeEventListener('scroll',reposition);activeFieldDropdown=null;};
  const openFieldDropdown=target=>{
    closeFieldDropdown();const isTime=target.matches('input[type="time"]'),isYear=target.matches('[data-year-select]');let anchor=target.closest('[data-category-control],[data-dropdown-anchor],[data-year-dropdown-anchor]');if(!anchor){anchor=document.createElement('span');anchor.dataset.dropdownAnchor='';anchor.className='relative block w-full min-w-0';target.before(anchor);anchor.append(target);target.classList.add('w-full');}
    const years=[...new Set([today.getFullYear(),selectedHomeYear,...state.expenses.map(e=>new Date(e.timestamp).getFullYear())])].sort((a,b)=>b-a);
    const choices=isYear?years.map(y=>({value:String(y),label:String(y)})):Array.from(target.options||[]).map(option=>({value:option.value,label:option.textContent}));
    const menu=document.createElement(isTime?'dialog':'div');menu.setAttribute('role',isTime?'dialog':'listbox');menu.setAttribute('aria-label',isTime?'Choose a time':'Options');menu.className=`${isTime?'fixed left-1/2 top-1/2 m-0 w-[min(430px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 border-0 p-0 backdrop:bg-black/40 backdrop:backdrop-blur-md':'absolute'} ${anchor.matches('[data-category-control]')?'-left-px w-[calc(100%+2px)]':'left-0 w-full'} z-[120] overflow-y-auto rounded-2xl border border-[#36383e] bg-[#1b1c1f] py-1 shadow-[0_16px_40px_rgba(0,0,0,.55)]`;
    if(isYear){menu.style.overflowY=choices.length>4?'scroll':'auto';if(choices.length<=4)menu.dataset.yearDropdownCompact='';}
    let timeSelection=null;if(isTime){const [hour='20',minute='00']=String(target.value||'20:00').split(':');const hour24=Number(hour);timeSelection={hour:String(hour24%12||12).padStart(2,'0'),minute,period:hour24<12?'AM':'PM'};menu.classList.add('px-5','py-6');menu.style.padding='24px 20px';const optionButtons=(part,values)=>values.map(value=>`<button type="button" data-time-part="${part}" data-time-value="${value}" class="h-10 w-full shrink-0 rounded-[10px] text-center text-[15px] text-[#e6e9ed] transition-colors hover:bg-[#252a2c]">${value}</button>`).join('');menu.innerHTML=`<div class="mb-4 flex items-start justify-between gap-3"><div><h3 class="m-0 text-lg font-normal text-[#f0f1f3]">Choose a time</h3><p class="m-0 mt-1 text-sm text-[#92959c]">Select an hour and minute</p></div><button type="button" data-time-close class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#92959c] transition-colors hover:text-[#00df83]" aria-label="Close time picker"><svg class="h-4 w-4 fill-none stroke-current [stroke-width:2] [stroke-linecap:round]" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="grid grid-cols-2 gap-3"><div><h4 class="mb-2 text-xs font-semibold tracking-wide text-[#92959c]">HOUR</h4><div class="max-h-[180px] space-y-1 overflow-y-auto rounded-xl border border-[#30333b] bg-[#141518] p-1" data-time-list="hour">${optionButtons('hour',Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')))}</div></div><div><h4 class="mb-2 text-xs font-semibold tracking-wide text-[#92959c]">MINUTE</h4><div class="max-h-[180px] space-y-1 overflow-y-auto rounded-xl border border-[#30333b] bg-[#141518] p-1" data-time-list="minute">${optionButtons('minute',Array.from({length:60},(_,i)=>String(i).padStart(2,'0')))}</div></div></div><div class="mt-5 flex items-center justify-between gap-3"><div class="inline-flex rounded-xl border border-[#30333b] bg-[#141518] p-1"><button type="button" data-time-part="period" data-time-value="AM" class="rounded-lg px-4 py-2 text-sm font-semibold">AM</button><button type="button" data-time-part="period" data-time-value="PM" class="rounded-lg px-4 py-2 text-sm font-semibold">PM</button></div><button type="button" data-time-done class="rounded-xl bg-[linear-gradient(110deg,#00e984,#00bb62)] px-6 py-3 text-sm font-semibold text-[#07170f] shadow-[0_8px_24px_rgba(0,223,131,.18)]">Done</button></div>`;}
    else{const selectedValue=isYear?String(selectedHomeYear):target.value;menu.innerHTML=choices.map(choice=>{const value=choice.value,selected=value===selectedValue;return `<button type="button" role="option" aria-selected="${selected}" data-dropdown-value="${esc(value)}" class="block w-full px-3 py-[9px] text-left text-[15px] ${selected?'bg-[#30343a] text-white':'text-[#f0f1f3]'} hover:bg-[#2b2e34]">${esc(choice.label)}</button>`;}).join('');}
    if(isTime){document.body.append(menu);menu.showModal();}else{anchor.append(menu);anchor.classList.add('z-[110]');}
    const updateTimeSelection=()=>{if(!isTime)return;$$('[data-time-part]',menu).forEach(button=>{const selected=timeSelection[button.dataset.timePart]===button.dataset.timeValue;button.classList.toggle('bg-[linear-gradient(110deg,#00e984,#00bb62)]',selected);button.classList.toggle('text-[#07170f]',selected);button.classList.toggle('font-semibold',selected);if(button.dataset.timePart==='period')button.classList.toggle('text-[#92959c]',!selected);});};updateTimeSelection();
    const reposition=()=>{if(isTime){const vv=window.visualViewport,w=vv?.width||window.innerWidth,h=vv?.height||window.innerHeight;menu.style.left=`${(vv?.offsetLeft||0)+w/2}px`;menu.style.top=`${(vv?.offsetTop||0)+h/2}px`;menu.style.width=`${Math.max(0,Math.min(430,w-24))}px`;menu.style.maxHeight=`${Math.max(0,h-24)}px`;return;}const place=popupPlacement(anchor,menu,320);menu.classList.remove('top-full','bottom-full','top-[calc(100%+8px)]','bottom-[calc(100%+8px)]','rounded-b-2xl','rounded-t-none','rounded-t-2xl','rounded-b-none','border-t-0','border-b-0');menu.classList.add(...(place.direction==='down'?['top-[calc(100%+8px)]','rounded-b-2xl','rounded-t-none','border-t-0']:['bottom-[calc(100%+8px)]','rounded-t-2xl','rounded-b-none','border-b-0']));menu.style.maxHeight=`${place.maxHeight}px`;};
    reposition();window.addEventListener('resize',reposition);window.addEventListener('scroll',reposition,true);window.visualViewport?.addEventListener('resize',reposition);window.visualViewport?.addEventListener('scroll',reposition);activeFieldDropdown={menu,target,anchor,reposition};target.setAttribute('aria-haspopup','listbox');target.setAttribute('aria-expanded','true');
    menu.querySelector(`[data-time-list="hour"] [data-time-value="${timeSelection?.hour}"]`)?.scrollIntoView({block:'nearest'});menu.querySelector(`[data-time-list="minute"] [data-time-value="${timeSelection?.minute}"]`)?.scrollIntoView({block:'nearest'});
    menu.addEventListener('cancel',e=>{if(isTime){e.preventDefault();closeFieldDropdown();}});menu.addEventListener('click',e=>{if(isTime){if(e.target===menu||e.target.closest('[data-time-close]')){closeFieldDropdown();target.focus({preventScroll:true});return;}const done=e.target.closest('[data-time-done]');if(done){let hour=Number(timeSelection.hour)%12;if(timeSelection.period==='PM')hour+=12;target.value=`${String(hour).padStart(2,'0')}:${timeSelection.minute}`;target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));closeFieldDropdown();target.focus({preventScroll:true});return;}const timeOption=e.target.closest('[data-time-part]');if(!timeOption)return;timeSelection[timeOption.dataset.timePart]=timeOption.dataset.timeValue;updateTimeSelection();return;}const option=e.target.closest('[data-dropdown-value]');if(!option)return;if(isYear){selectedHomeYear=Number(option.dataset.dropdownValue);syncHomePeriodSelection();target.setAttribute('aria-label',`Select year: ${selectedHomeYear}`);}else{target.value=option.dataset.dropdownValue;target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));}closeFieldDropdown();if(isYear)renderHome();target.focus({preventScroll:true});});
  };
  document.addEventListener('pointerdown',e=>{const target=e.target.closest('select,input[type="time"]');if(target){if(calendarPopup)closeCalendar();e.preventDefault();if(activeFieldDropdown?.target===target){closeFieldDropdown();return;}target.focus({preventScroll:true});openFieldDropdown(target);return;}if(activeFieldDropdown&&(!activeFieldDropdown.menu.contains(e.target)||e.target===activeFieldDropdown.menu)&&!e.target.closest('[data-year-select]'))closeFieldDropdown();if(calendarPopup&&!calendarPopup.contains(e.target)&&!activeDateAnchor?.contains(e.target))closeCalendar();},true);
  document.addEventListener('click',e=>{if(e.target.closest('select,input[type="time"]'))e.preventDefault();},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeFieldDropdown){e.preventDefault();closeFieldDropdown();return;}const target=e.target.closest?.('select,input[type="time"],[data-year-select]');if(target&&['Enter',' ','ArrowDown'].includes(e.key)){e.preventDefault();if(activeFieldDropdown?.target===target)closeFieldDropdown();else openFieldDropdown(target);}},true);
  const yearButton=$('[data-year-select]');yearButton?.addEventListener('click',e=>{e.preventDefault();if(activeFieldDropdown?.target===yearButton)closeFieldDropdown();else openFieldDropdown(yearButton);});
  if(note)note.closest('label').firstChild.textContent='Note';
  let resizeAmount=()=>{};
  if(amount){resizeAmount=()=>{const filled=!!amount.value;amount.classList.toggle('text-white',filled);amount.classList.toggle('text-[#555862]',!filled);if(!filled){amount.style.width='42px';return;}const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),font=getComputedStyle(amount);ctx.font=`${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;const line=$('#expense-amount-line'),max=(line?.clientWidth||300)-70;amount.style.width=`${Math.min(max,Math.max(26,ctx.measureText(amount.value).width+8))}px`;};amount.addEventListener('input',resizeAmount);window.addEventListener('resize',resizeAmount);resizeAmount();}
  const cat=$('#expense-category');const categoryIcon=cat?.closest('label')?.querySelector('span svg');if(categoryIcon){const badge=document.createElement('span');badge.dataset.categoryIcon='';badge.className='grid h-[18px] w-[18px] flex-none place-items-center text-[#00df83]';badge.innerHTML=iconFor(cat.value,'h-[18px] w-[18px]');categoryIcon.replaceWith(badge);}cat?.addEventListener('change',()=>{const badge=$('[data-category-icon]');if(badge)badge.innerHTML=iconFor(cat.value,'h-[18px] w-[18px]');});
  const resetExpenseDraft=()=>{expForm?.reset();if(amount){amount.value='';resizeAmount();}if(dateInput){dateInput.value=isoDate(today);if(dateDisplay)dateDisplay.value=formatExpenseDate(dateInput.value);}if(timeInput)timeInput.value=`${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`;if(cat)cat.value='';if(note)note.value='';const badge=$('[data-category-icon]');if(badge)badge.innerHTML=iconFor('', 'h-[18px] w-[18px]');if(activeFieldDropdown?.target===cat)closeFieldDropdown();};
  if(expForm){expForm.method='dialog';expForm.addEventListener('submit',ev=>{const submitter=ev.submitter;if(submitter?.value==='cancel'){close(expDialog);return;}ev.preventDefault();const spent=Number(amount.value);if(!amount.value||!Number.isFinite(spent)||spent<=0){amount.reportValidity();return;}const now=new Date();const date=dateInput?.value||isoDate(now),time=timeInput?.value||`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,timestamp=new Date(`${date}T${time}:00`).toISOString();const category=cat?.value||'Food & Dining';const title=category;state.expenses.push({id:crypto.randomUUID(),title,category,amount:spent,note:note?.value||'',timestamp,meal:mealFor(Number(time.slice(0,2)))});state.notifications.push({id:crypto.randomUUID(),title:'Expense added',message:`${title}  ${money(spent)} added to ${category}.`,timestamp:now.toISOString()});notifyUser(title,'sound/notification.wav');persist();showNewItemSaved();resetExpenseDraft();close(expDialog);renderHome();renderDaily();renderReport();});}
  $$('[data-open-expense]').forEach(b=>b.onclick=()=>{resetExpenseDraft();open(expDialog);});
  $$('[data-notification-quick-log]').forEach(b=>b.onclick=()=>{close(notifDialog);resetExpenseDraft();open(expDialog);});
  // Daily date selection and meal grouping from persisted expenses.
  function selectDailyDate(v){dailyDate=v;renderDaily();}
  $$('[data-day-shift]').forEach(b=>b.onclick=()=>{const d=new Date(`${dailyDate}T12:00:00`);d.setDate(d.getDate()+Number(b.dataset.dayShift));selectDailyDate(isoDate(d));});
  const dailyHeader=$('#daily-date'),dailyDateAnchor=dailyHeader?.parentElement,dailyDateInput=document.createElement('input');if(dailyDateInput){dailyDateInput.type='date';dailyDateInput.className='hidden';dailyDateInput.value=dailyDate;dailyDateInput.tabIndex=-1;dailyDateInput.setAttribute('aria-hidden','true');dailyDateAnchor?.append(dailyDateInput);dailyDateInput.addEventListener('change',()=>selectDailyDate(dailyDateInput.value));dailyDateAnchor?.addEventListener('click',e=>{if(e.target.closest('button'))return;dailyDateInput.value=dailyDate;openCalendar(dailyDateInput,dailyDateAnchor,true);});}
  function renderDaily(){if(!daily)return;const d=new Date(`${dailyDate}T12:00:00`),list=state.expenses.filter(e=>dateOf(e)===dailyDate).sort((a,b)=>b.timestamp.localeCompare(a.timestamp)),total=list.reduce((a,e)=>a+e.amount,0),target=periodTargets(d.getFullYear(),d.getMonth())/new Date(d.getFullYear(),d.getMonth()+1,0).getDate(),pct=target?Math.round(total/target*100):0;dailyHeader.dataset.date=dailyDate;dailyHeader.textContent=fmtDate(d);const tag=$('[data-today-tag]');if(tag){tag.hidden=dailyDate!==isoDate(today);tag.textContent='Today';}const sections=$$('section',daily).filter(s=>/Breakfast|Afternoon|Evening|Night/.test(s.textContent));sections.forEach(s=>s.remove());const sum=$$('section',daily).find(s=>s.classList.contains('rounded-[32px]'));if(sum){const p=sum.querySelector('p'),h=sum.querySelector('h1'),cons=sum.querySelector('h4'),left=sum.querySelector('b');if(p)p.lastChild.textContent=`${dailyDate===isoDate(today)?"Today's":dailyDate===isoDate(new Date(today.getTime()-86400000))?'Yesterday\'s':'Selected day'} spend`;if(h)h.innerHTML=`<span style="margin-right:8px" class="text-[.68em] text-[#00df83]">₹</span>${total.toLocaleString('en-IN',{minimumFractionDigits:2})}`;if(cons)cons.textContent=`${pct}% consumed`;if(left)left.textContent=`${money(Math.max(0,target-total))} left`;const fill=sum.querySelector('div:last-child > i');if(fill)fill.style.width=`${Math.min(100,pct)}%`;}
    ['Breakfast','Afternoon','Evening','Night'].forEach(meal=>{
      const arr=list.filter(e=>e.meal===meal);
      if(!arr.length)return;
      const sec=document.createElement('section');
      sec.className='my-7';
      sec.innerHTML=`<div class="mb-3 flex justify-between"><h2 class="text-xl max-[700px]:text-lg">${meal}</h2><span class="text-sm text-[#92959c]">${arr.length} transaction${arr.length===1?'':'s'}</span></div>${arr.map(e=>`<article class="mb-3 grid grid-cols-[37px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[#2b2d30] bg-[#191a1c] p-4 max-[390px]:gap-2 max-[390px]:p-3"><span class="grid h-[37px] w-[37px] place-items-center rounded-[17px] bg-[#202225] border border-[#00df83]/20 text-[#00df83]">${iconFor(e.category)}</span><div class="min-w-0"><div class="flex min-w-0 items-baseline gap-2"><h3 class="min-w-0 truncate text-[15px] font-medium">${esc(e.category||e.title)}</h3><time class="shrink-0 text-[11px] text-[#92959c]">${fmtTime(e.timestamp)}</time></div><div class="flex w-full min-w-0 items-end justify-start gap-2"><b class="shrink-0 whitespace-nowrap text-sm font-normal">${money(e.amount)}</b>.<small class="min-w-0 truncate whitespace-nowrap text-left text-xs text-[#92959c]">${esc(e.note||'No note')}</small></div></div><div class="flex items-center gap-1"><button class="grid size-9 place-items-center rounded-xl border border-[#303136] text-[#92959c] transition-colors hover:bg-white/5 hover:text-white max-[390px]:size-8" type="button" title="Edit ${esc(e.title)}" aria-label="Edit ${esc(e.title)}" data-daily-action="edit" data-expense-id="${e.id}"><svg class="size-[17px] fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z"/></svg></button><button class="grid size-9 place-items-center rounded-xl border border-[#303136] text-[#92959c] transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 max-[390px]:size-8" type="button" title="Delete ${esc(e.title)}" aria-label="Delete ${esc(e.title)}" data-daily-action="delete" data-expense-id="${e.id}"><svg class="size-[17px] fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14m-8-4h4l1 4H8l1-4Z"/></svg></button></div></article>`).join('')}`;
      daily.append(sec);
    });
  }
  daily?.addEventListener('click',e=>{
    const b=e.target.closest('[data-daily-action]');
    if(!b)return;
    const item=state.expenses.find(x=>x.id===b.dataset.expenseId);
    if(!item)return;
    if(b.dataset.dailyAction==='delete'){
      const dlg=makeDialog('expense-delete-dialog','Delete Expense',`<p>Delete this expense? This cannot be undone.</p><div class="mt-4 flex gap-3"><button id="delete-expense-confirm" class="rounded-xl bg-red-600 px-4 py-3" type="button">Delete expense</button><button data-x class="rounded-xl border border-[#444] px-4" type="button">Cancel</button></div>`);
      open(dlg);
      $('#delete-expense-confirm').onclick=()=>{
        state.expenses=state.expenses.filter(x=>x.id!==item.id);
        persist();
        close(dlg);
        renderDaily();
        renderHome();
        renderReport();
      };
      return;
    }
    const dt=new Date(item.timestamp),dlg=makeDialog('expense-edit-dialog','Edit Expense',`<form id="expense-edit-form" class="grid gap-3"><label>Category<span class="relative mt-2 block"><select class="h-11 w-full appearance-none rounded-xl border border-[#30333b] bg-[#191a22] pl-3 pr-11" name="category"></select><svg class="pointer-events-none absolute right-[14px] top-1/2 h-3 w-3 -translate-y-1/2 flex-none fill-none stroke-current text-[#92959c] stroke-2 [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></span></label><div class="grid grid-cols-2 gap-3"><label>Date<input class="mt-2 h-11 w-full rounded-xl border border-[#30333b] bg-[#191a22] px-3 [color-scheme:dark]" name="date" type="date" required></label><label>Time<input class="mt-2 h-11 w-full rounded-xl border border-[#30333b] bg-[#191a22] px-3 [color-scheme:dark]" name="time" type="time" required></label></div><label>Amount<input class="mt-2 h-11 w-full rounded-xl border border-[#30333b] bg-[#191a22] px-3" name="amount" type="number" min="0.01" step="0.01" required></label><label>Note<input class="mt-2 h-11 w-full rounded-xl border border-[#30333b] bg-[#191a22] px-3" name="note" placeholder="Add a note (optional)"></label><button class="rounded-xl bg-[#00df83] p-3 text-black">Save changes</button></form>`);
    const form=$('#expense-edit-form',dlg),categoryField=form.elements.namedItem('category'),noteField=form.elements.namedItem('note');
    categoryField.innerHTML=state.items.map(i=>`<option value="${esc(i.name)}">${esc(i.name)}</option>`).join('');
    if(!state.items.some(i=>i.name===item.category)){
      const option=document.createElement('option');option.value=item.category;option.textContent=item.category;categoryField.append(option);
    }
    categoryField.value=item.category;
    form.elements.namedItem('date').value=dateOf(item);
    form.elements.namedItem('time').value=`${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
    form.elements.namedItem('amount').value=String(item.amount);
    noteField.value=item.note||'';
    noteField.placeholder='Add a note (optional)';
    open(dlg);
    $('#expense-edit-form').onsubmit=ev=>{
      ev.preventDefault();
      const f=new FormData(ev.currentTarget);
      item.category=String(f.get('category'));
      item.amount=Number(f.get('amount'));
      item.note=String(f.get('note')||'');
      item.timestamp=new Date(`${f.get('date')}T${f.get('time')}:00`).toISOString();
      item.meal=mealFor(new Date(item.timestamp).getHours());
      persist();
      close(dlg);
      renderDaily();
      renderHome();
      renderReport();
    };
  });

  // Items with month-specific targets and safe edit/delete dialogs.
  let selectedItemsMonth=monthKey(today.getFullYear(),today.getMonth());
  const itemForm=$('#item-form');if(itemForm){itemForm.className='grid gap-3';itemForm.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(itemForm),name=String(fd.get('name')||'').trim(),target=Number(fd.get('amount'));if(!name||target<0)return;let item=itemByName(name),isNew=!item;if(!item){item={id:crypto.randomUUID(),name,targets:{}};state.items.push(item);}item.targets[selectedItemsMonth]=target;persist();itemForm.reset();renderItems();renderHome();if(isNew)showNewItemSaved();});}
  const itemsMain=$('[data-view-panel="items"]');if(itemsMain){const intro=itemForm?.previousElementSibling;intro?.querySelector('span')?.remove();itemForm?.querySelectorAll('input').forEach(input=>{input.classList.add('text-[16px]','font-normal');const wrap=input.parentElement;wrap?.classList.remove('h-[58px]');wrap?.classList.add('h-[48px]');wrap?.querySelector('svg')?.remove();});const addBtn=itemForm?.querySelector('[type="submit"]');addBtn?.classList.add('h-[48px]','py-0','text-[16px]','font-normal');}
  function renderItems(){if(!budgetList)return;if(cat){const current=cat.value;cat.innerHTML='<option class="bg-[#191a22] text-[#f0f1f3]" value="" selected>Choose a category</option>'+state.items.map(i=>`<option class="bg-[#191a22] text-[#f0f1f3]" value="${esc(i.name)}">${esc(i.name)}</option>`).join('');if(state.items.some(i=>i.name===current))cat.value=current;}renderExpenseItemRows(budgetList,selectedItemsMonth,true);$('#item-count')?.replaceChildren(document.createTextNode(String(state.items.length)));const label=$('#item-count-label');if(label)label.textContent=state.items.length===1?'item':'items';}
  // Date picker period dialog is truly current by default; available years follow saved data.
  const period=$('#period-dialog');if(period){syncHomePeriodSelection();$$('[data-open-period]').forEach(b=>{b.onclick=()=>{delete period.dataset.targetView;const year=Number(b.dataset.year||today.getFullYear()),month=Number(b.dataset.month||today.getMonth());period.dataset.draftYear=year;period.dataset.draftMonth=month;$('#period-dialog-year').textContent=year;$$('[data-period-month]',period).forEach(x=>x.dataset.selected=String(Number(x.dataset.periodMonth)===month));open(period);};});$$('[data-period-month]',period).forEach(b=>b.onclick=()=>{$$('[data-period-month]',period).forEach(x=>x.dataset.selected='false');b.dataset.selected='true';period.dataset.draftMonth=b.dataset.periodMonth;});$$('[data-period-year-shift]',period).forEach(b=>b.onclick=()=>{period.dataset.draftYear=Number(period.dataset.draftYear)+Number(b.dataset.periodYearShift);$('#period-dialog-year').textContent=period.dataset.draftYear;});$('[data-apply-period]',period)?.addEventListener('click',()=>{const y=Number(period.dataset.draftYear),m=Number(period.dataset.draftMonth);if(period.dataset.targetView==='reports'){reportDate=new Date(y,m,1);delete period.dataset.targetView;close(period);renderReport();return;}selectedHomeYear=y;selectedHomeMonth=m;syncHomePeriodSelection();close(period);renderHome();});}
  $('[data-home-today]')?.addEventListener('click',()=>{selectedHomeYear=today.getFullYear();selectedHomeMonth=today.getMonth();syncHomePeriodSelection();renderHome();});

  // Notifications render only the sections that currently contain data.
  const notifDialog=$('#notifications-dialog');let notificationsSection=$('section[aria-label="Recent notifications"]',notifDialog),remindersSection=$('[data-reminders-section]',notifDialog),addReminderSection=null,notificationTabs=null,notificationPanels=null,activeNotificationTab='messages';
  if(notifDialog){
    const frame=notifDialog.firstElementChild;
    notifDialog.classList.remove('flex','flex-col','h-[min(90dvh,760px)]','max-h-[calc(100dvh-40px)]','overflow-auto','max-[700px]:h-[100dvh]','max-[700px]:fixed','max-[700px]:inset-0','max-[700px]:m-0','max-[700px]:max-h-[100dvh]','max-[700px]:w-screen','max-[700px]:max-w-none','max-[700px]:rounded-none','max-[700px]:border-0');
    notifDialog.classList.add('h-auto','max-h-[calc(100dvh-16px)]','overflow-hidden','max-[700px]:fixed','max-[700px]:bottom-0','max-[700px]:left-1/2','max-[700px]:right-auto','max-[700px]:top-auto','max-[700px]:m-0','max-[700px]:max-h-[calc(100dvh-16px)]','max-[700px]:w-screen','max-[700px]:max-w-none','max-[700px]:-translate-x-1/2','max-[700px]:rounded-t-[28px]','max-[700px]:rounded-b-none');
    frame?.classList.remove('px-[30px]','pb-7','pt-6','max-[700px]:px-4','max-[700px]:pb-5','max-[700px]:pt-[18px]','max-[390px]:px-3');
    frame?.classList.add('flex','h-auto','min-h-0','flex-col','overflow-y-auto','max-h-[calc(100dvh-16px)]','px-5','py-5');
    const header=$('#notifications-title',notifDialog)?.parentElement?.parentElement;
    header?.classList.add('shrink-0');
    notificationTabs=document.createElement('div');
    notificationTabs.className='mb-4 flex shrink-0 rounded-full bg-[#202124] p-1';
    notificationTabs.innerHTML='<button type="button" class="flex-1 rounded-full px-3 py-2 text-sm" data-notification-tab="messages">Recent Messages</button><button type="button" class="flex-1 rounded-full px-3 py-2 text-sm" data-notification-tab="reminders">Active Reminders</button>';
    header?.after(notificationTabs);
    notificationPanels=document.createElement('div');
    notificationPanels.className='max-h-[60dvh] overflow-y-auto overscroll-contain';
    notificationTabs.after(notificationPanels);
    notificationPanels.append(notificationsSection,remindersSection);
    notifDialog.selectNotificationTab=tab=>{activeNotificationTab=tab;updateNotificationTabs();};
    notificationTabs.onclick=e=>{const button=e.target.closest('[data-notification-tab]');if(button&&!button.hidden)notifDialog.selectNotificationTab(button.dataset.notificationTab);};
    addReminderSection=document.createElement('section');
    addReminderSection.dataset.addReminderSection='';
    addReminderSection.className='mt-5';
    const addReminderButton=$('[data-open-reminder]',remindersSection);
    if(addReminderButton){addReminderSection.append(addReminderButton);frame.append(addReminderSection);}
  }
  function updateNotificationTabs(){
    if(!notificationTabs)return;
    const hasMessages=!!notificationsSection?.isConnected&&state.notifications.length>0;
    const hasReminders=!!remindersSection?.isConnected&&state.reminders.some(reminder=>reminder.enabled);
    if(hasMessages&&hasReminders){if(activeNotificationTab!=='messages'&&activeNotificationTab!=='reminders')activeNotificationTab='messages';}
    else if(hasMessages)activeNotificationTab='messages';
    else if(hasReminders)activeNotificationTab='reminders';
    else activeNotificationTab='messages';
    notificationTabs.hidden=!(hasMessages||hasReminders);
    if(notificationPanels)notificationPanels.hidden=!(hasMessages||hasReminders);
    $$('[data-notification-tab]',notificationTabs).forEach(button=>{
      const available=button.dataset.notificationTab==='messages'?hasMessages:hasReminders,selected=button.dataset.notificationTab===activeNotificationTab;
      button.hidden=!available;button.className=`flex-1 rounded-full px-3 py-2 text-sm ${selected?'bg-[#00df83] text-black':''}`;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
    });
    if(notificationsSection)notificationsSection.hidden=!hasMessages||activeNotificationTab!=='messages';
    if(remindersSection)remindersSection.hidden=!hasReminders||activeNotificationTab!=='reminders';
  }
  if(notifDialog){
    remindersSection?.addEventListener('change',()=>{
      const count=$('[data-reminder-count]',remindersSection);
      if(count)count.textContent=`${state.reminders.filter(reminder=>reminder.enabled).length} Active Schedules`;
      updateNotificationTabs();
    });
  }
  function bindNotificationSwipe(card,onSwipe){
    const content=$('[data-notice-content]',card),reveal=$('[data-notice-reveal]',card),deleteLabel=$('[data-notice-delete-label]',card);
    let activePointer=null,startX=0,offset=0;
    card.addEventListener('pointerdown',event=>{
      if(!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0))return;
      activePointer=event.pointerId;startX=event.clientX;offset=0;reveal.hidden=true;reveal.style.width='0px';deleteLabel.hidden=true;content.style.transition='none';card.setPointerCapture(event.pointerId);
    });
    card.addEventListener('pointermove',event=>{
      if(event.pointerId!==activePointer)return;
      const distance=event.clientX-startX;
      if(Math.abs(distance)<4)return;
      const width=card.getBoundingClientRect().width;
      offset=Math.max(-width,Math.min(width,distance));
      reveal.hidden=false;reveal.style.width=`${Math.abs(offset)}px`;reveal.style.left=offset>0?'0':'auto';reveal.style.right=offset<0?'0':'auto';
      content.style.transform=`translateX(${offset}px)`;
      deleteLabel.hidden=Math.abs(offset)<80;
    });
    card.addEventListener('pointerup',event=>{
      if(event.pointerId!==activePointer)return;
      activePointer=null;
      const width=card.getBoundingClientRect().width,shouldDelete=Math.abs(offset)>=width*.75;
      content.style.transition='transform 180ms ease-out';
      if(shouldDelete){
        const direction=Math.sign(offset),noticeId=card.dataset.notice;
        reveal.style.width=`${width}px`;deleteLabel.hidden=false;
        onSwipe();
        card.style.pointerEvents='none';
        content.style.transform=`translateX(${direction*width}px)`;
        window.setTimeout(()=>{state.notifications=state.notifications.filter(n=>n.id!==noticeId);persist();renderNotifications();},180);
      }else{
        if(Math.abs(offset)>8)onSwipe();
        reveal.hidden=true;reveal.style.width='0px';deleteLabel.hidden=true;
        content.style.transform='translateX(0px)';
      }
      offset=0;
    });
    card.addEventListener('pointercancel',event=>{
      if(event.pointerId!==activePointer)return;
      activePointer=null;offset=0;reveal.hidden=true;reveal.style.width='0px';deleteLabel.hidden=true;content.style.transition='transform 180ms ease-out';content.style.transform='translateX(0px)';
    });
  }
  function renderNotifications(){
    if(!notifDialog||!notificationsSection)return;
    const cutoff=Date.now()-10*86400000;
    state.notifications=state.notifications.filter(n=>new Date(n.timestamp).getTime()>=cutoff);
    persist();
    if(state.notifications.length){
      if(!notificationsSection.isConnected)notificationPanels.prepend(notificationsSection);
      notificationsSection.innerHTML=`<div class="space-y-2">${state.notifications.slice().sort((a,b)=>b.timestamp.localeCompare(a.timestamp)).map(n=>`<article data-notice="${n.id}" class="relative cursor-pointer overflow-hidden rounded-2xl bg-[#202124]" style="touch-action:pan-y"><div aria-hidden="true" data-notice-reveal hidden class="absolute inset-y-0 left-0 flex items-center justify-center overflow-hidden rounded-2xl bg-red-600"><span data-notice-delete-label hidden class="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-white"><svg class="h-4 w-4 shrink-0 fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24"><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14m-8-4h4l1 4H8l1-4Z"/></svg>Delete</span></div><div data-notice-content class="relative z-[1] rounded-2xl border border-[#202124] bg-[#202124] p-4 transition-transform duration-200 ease-out"><h3 class="m-0">${esc(n.title)}</h3><p class="mb-2 mt-1 text-sm text-[#c7c9ce]">${esc(n.message)}</p><time class="text-xs text-[#92959c]">${new Date(n.timestamp).toLocaleString()}</time></div></article>`).join('')}</div>`;
    }else notificationsSection.remove();
    $$('[data-notice]',notificationsSection).forEach(card=>{
      let ignoreClickUntil=0;
      card.onclick=()=>{
        if(Date.now()<ignoreClickUntil)return;
        const n=state.notifications.find(x=>x.id===card.dataset.notice);
        if(!n)return;
        const dlg=makeDialog('notification-detail-dialog',n.title,`<p>${esc(n.message)}</p><time class="text-xs text-[#92959c]">${new Date(n.timestamp).toLocaleString()}</time>`);
        close(notifDialog);open(dlg);
      };
      bindNotificationSwipe(card,()=>{ignoreClickUntil=Date.now()+350;});
      card.oncontextmenu=e=>{e.preventDefault();deleteNotice(card.dataset.notice);};
    });
    updateNotificationTabs();
  }
  function deleteNotice(id){const n=state.notifications.find(x=>x.id===id);if(!n)return;const dlg=makeDialog('notification-delete-dialog','Delete notification',`<p>Delete this notification?</p><div class="mt-4 flex flex-wrap gap-3"><button id="notice-undo" class="rounded-xl border border-[#444] px-4 py-3">Undo</button><button id="notice-confirm" class="rounded-xl bg-red-600 px-4 py-3">Confirm Delete</button><button data-x class="rounded-xl border border-[#444] px-4">Close</button></div>`);open(dlg);$('#notice-undo').onclick=()=>close(dlg);$('#notice-confirm').onclick=()=>{state.notifications=state.notifications.filter(x=>x.id!==id);persist();close(dlg);renderNotifications();};}
  $$('[data-open-notifications]').forEach(b=>b.onclick=()=>{renderNotifications();open(notifDialog);});

  // Persistent reminder controls and time edit modal.
  const reminderForm=$('#reminder-form');reminderForm?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(reminderForm);state.reminders.push({id:crypto.randomUUID(),title:fd.get('title'),time:fd.get('time'),frequency:fd.get('frequency'),createdAt:new Date().toISOString(),enabled:true});persist();close($('#reminder-dialog'));renderReminderList();});
  function formatReminderTime(value){const match=/^(\d{1,2}):(\d{2})$/.exec(String(value||''));if(!match)return String(value||'');const h=Number(match[1]),m=Number(match[2]);if(h>23||m>59)return String(value);return `${String(h%12||12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`;}
  function renderReminderList(){const sec=remindersSection;if(!sec)return;$$('[data-reminder-generated]',sec).forEach(x=>x.remove());const template=$('[data-reminder-card]',sec);if(template)template.remove();const count=$('[data-reminder-count]',sec);if(count)count.textContent=`${state.reminders.filter(r=>r.enabled).length} Active Schedules`;if(state.reminders.length){if(!sec.isConnected)notificationPanels.append(sec);}else sec.remove();state.reminders.forEach(r=>{const c=document.createElement('article');c.dataset.reminderGenerated='';c.className='mb-3 rounded-2xl bg-[#17181b] p-4';c.innerHTML=`<div class="flex items-center justify-between"><div><h3>${esc(r.title)}</h3><time class="text-xs">${esc(formatReminderTime(r.time))} · ${esc(r.frequency||'Daily')}</time></div><label class="flex cursor-pointer items-center"><input type="checkbox" ${r.enabled?'checked':''} aria-label="Enable ${esc(r.title)}"></label></div><button class="mt-2 text-sm text-[#23d99a]" data-reminder-edit="${r.id}">Edit Time</button>`;sec.insertBefore(c,$('[data-open-reminder]',sec));const toggle=$('input[type="checkbox"]',c);styleToggle(toggle);toggle.onchange=e=>{r.enabled=e.target.checked;persist();};$('[data-reminder-edit]',c).onclick=()=>{const dlg=makeDialog('reminder-time-edit-dialog','Edit reminder time',`<input id="reminder-edit-time" type="time" class="h-12 w-full rounded-xl border border-[#30333b] bg-[#191a22] px-3 [color-scheme:dark]" value="${r.time}"><button id="reminder-edit-save" class="mt-4 w-full rounded-xl bg-[#00df83] p-3 text-black">Save time</button>`);open(dlg);$('#reminder-edit-save').onclick=()=>{r.time=$('#reminder-edit-time').value;persist();close(dlg);renderReminderList();};};});updateNotificationTabs();}
  function openReminderDialog(){const dlg=$('#reminder-dialog');if(!dlg)return;open(dlg);if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const mobile=matchMedia('(max-width: 700px)').matches;const animation=dlg.animate(mobile?[{transform:'translate(-50%, 100%)',opacity:.9},{transform:'translate(-50%, 0)',opacity:1}]:[{transform:'translateY(18px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});animation.onfinish=()=>animation.cancel();}
  $$('[data-open-reminder]').forEach(b=>b.onclick=openReminderDialog);renderReminderList();

  // Download, backup and safe restore.
  const downloadDialog=makeDialog('download-dialog','Download & Backup',`<div class="space-y-5"><section class="grid gap-2 rounded-2xl bg-[#202124] p-4"><h3>Export CSV</h3><p class="m-0 text-sm text-[#92959c]">Save expense records to VaultiqFlow/CSV in a location you choose.</p><button id="csv-download" class="inline-flex items-center gap-2 rounded-xl bg-[#00df83] px-4 py-3 text-black"><svg class="h-4 w-4 fill-none stroke-current [stroke-width:2] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 19h14"/></svg>Download CSV</button></section><section class="grid gap-2 rounded-2xl bg-[#202124] p-4"><h3>Backup Data</h3><p class="m-0 text-sm text-[#92959c]">Save expenses, items, targets, reminders and preferences as JSON to VaultiqFlow/Backup in a location you choose.</p><button id="json-export" class="inline-flex items-center gap-2 rounded-xl bg-[#00df83] px-4 py-3 text-black"><svg class="h-4 w-4 fill-none stroke-current [stroke-width:2] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 19h14"/></svg>Export JSON Backup</button></section><p id="download-status" class="m-0 text-sm text-[#92959c]" role="status" aria-live="polite"></p><section class="grid gap-2 rounded-2xl bg-[#202124] p-4"><h3>Restore Backup</h3><p class="m-0 text-sm text-[#92959c]">Choose a previous VaultiqFlow JSON backup. Existing data is replaced only after confirmation.</p><input id="backup-file" type="file" accept="application/json,.json" class="hidden"><button id="backup-select" class="inline-flex items-center gap-2 rounded-xl border border-[#444]  bg-[#00df83] px-4 py-3 text-black"><svg class="h-4 w-4 fill-none stroke-current [stroke-width:2] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m-5 5 5-5 5 5M5 14v5h14v-5"/></svg>Select Backup File</button><p id="backup-error" class="m-0 text-sm text-red-300"></p></section></div>`);
  $$('button[aria-label="Download"]').forEach(b=>b.onclick=()=>open(downloadDialog));
  $('#csv-download')?.addEventListener('click',async e=>{const rows=[['date','time','item title','category','amount','note','meal section'],...state.expenses.slice().sort((a,b)=>a.timestamp.localeCompare(b.timestamp)).map(x=>[dateOf(x),fmtTime(x.timestamp),x.title,x.category,x.amount,x.note,x.meal])];await saveExportFile(e.currentTarget,'CSV','expenses.csv',rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\r\n'),'text/csv');});
  $('#json-export')?.addEventListener('click',async e=>await saveExportFile(e.currentTarget,'Backup','vaultiqflow-backup.json',JSON.stringify({format:'vaultiqflow-backup',version:2,exportedAt:new Date().toISOString(),data:state},null,2),'application/json'));
  function normalizeBackup(parsed){
    const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value),invalidBackup=detail=>new Error(`This file is not a compatible VaultiqFlow backup. ${detail}`);
    if(!isRecord(parsed))throw invalidBackup('The JSON root must be an object.');
    if(parsed.format!==undefined&&parsed.format!==null&&typeof parsed.format==='string'&&!parsed.format.toLowerCase().replace(/[^a-z0-9]/g,'').includes('vaultiqflow'))throw invalidBackup('The backup format is not recognized.');
    let source=parsed;
    for(const key of ['data','state','backup','payload','vaultiqflow']){
      const candidate=parsed[key];
      if(candidate===undefined)continue;
      const decoded=typeof candidate==='string'?JSON.parse(candidate):candidate;
      if(isRecord(decoded)&&Array.isArray(decoded.items)&&Array.isArray(decoded.expenses)){source=decoded;break;}
    }
    if(isRecord(source)&&typeof source['vaultiqflow-data-v2']==='string')source=JSON.parse(source['vaultiqflow-data-v2']);
    if(typeof source==='string')source=JSON.parse(source);
    if(!isRecord(source)||!Array.isArray(source.items)||!Array.isArray(source.expenses))throw invalidBackup('Expected an items array and an expenses array.');
    const reminders=source.reminders??[],notifications=source.notifications??[],settings=source.settings??{};
    if(!Array.isArray(reminders)||!Array.isArray(notifications)||!isRecord(settings))throw invalidBackup('Reminders, notifications, or settings have an invalid structure.');
    const items=source.items.map(item=>{
      if(!isRecord(item)||typeof item.name!=='string'||!item.name.trim())throw invalidBackup('An expense item is missing its name.');
      return{...item,id:typeof item.id==='string'&&item.id?item.id:crypto.randomUUID(),targets:isRecord(item.targets)?item.targets:{}};
    });
    const expenses=source.expenses.map(expense=>{
      if(!isRecord(expense)||typeof expense.title!=='string'||!Number.isFinite(Number(expense.amount))||!Number.isFinite(new Date(expense.timestamp).getTime()))throw invalidBackup('An expense is missing a valid title, amount, or timestamp.');
      const timestamp=new Date(expense.timestamp).toISOString();
      return{...expense,id:typeof expense.id==='string'&&expense.id?expense.id:crypto.randomUUID(),category:typeof expense.category==='string'&&expense.category?expense.category:'Food & Dining',amount:Number(expense.amount),note:typeof expense.note==='string'?expense.note:'',timestamp,meal:typeof expense.meal==='string'?expense.meal:mealFor(new Date(timestamp).getHours())};
    });
    const normalizedReminders=reminders.map(reminder=>{
      if(!isRecord(reminder)||typeof reminder.title!=='string'||typeof reminder.time!=='string')throw invalidBackup('A reminder is missing its title or time.');
      return{...reminder,id:typeof reminder.id==='string'&&reminder.id?reminder.id:crypto.randomUUID(),frequency:['Daily','Weekly','Monthly'].includes(reminder.frequency)?reminder.frequency:'Daily',enabled:typeof reminder.enabled==='boolean'?reminder.enabled:true};
    });
    const normalizedNotifications=notifications.map(notification=>{
      if(!isRecord(notification)||typeof notification.title!=='string'||typeof notification.message!=='string'||!Number.isFinite(new Date(notification.timestamp).getTime()))throw invalidBackup('A notification is missing its title, message, or timestamp.');
      return{...notification,id:typeof notification.id==='string'&&notification.id?notification.id:crypto.randomUUID(),timestamp:new Date(notification.timestamp).toISOString()};
    });
    return{...source,version:2,items,expenses,reminders:normalizedReminders,notifications:normalizedNotifications,settings:{preferences:true,browser:false,sound:true,note:'',soundUrl:'',...settings}};
  }
  $('#backup-select')?.addEventListener('click',()=>$('#backup-file').click());
  $('#backup-file')?.addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    $('#backup-error').textContent='';
    try{
      const next=normalizeBackup(JSON.parse(await file.text()));
      const confirmDialog=makeDialog('backup-confirm-dialog','Replace current data?',`<p class="mb-5 text-sm text-[#c5c6ca]">Replace all current VaultiqFlow data with this backup?</p><div class="flex justify-end gap-3"><button id="backup-replace-cancel" class="rounded-xl border border-[#444] px-4 py-2 text-[#c5c6ca]">Cancel</button><button id="backup-replace-confirm" class="rounded-xl bg-[#00df83] px-4 py-2 text-black">Replace data</button></div>`);
      open(confirmDialog);
      $('#backup-replace-cancel',confirmDialog).onclick=()=>close(confirmDialog);
      $('#backup-replace-confirm',confirmDialog).onclick=()=>{state=next;persist();renderHome();renderItems();renderDaily();renderReport();renderReminderList();renderNotifications();close(confirmDialog);close(downloadDialog);showView('home');};
    }catch(err){$('#backup-error').textContent=err.message||'Unable to restore this file.';}
    e.target.value='';
  });
  function downloadFile(name,content,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.style.position='fixed';a.style.left='-10000px';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function offerDownloadLink(status,name,content,type,message='If the automatic download did not start, use'){const url=URL.createObjectURL(new Blob([content],{type}));status.append(document.createTextNode(` ${message} `));const link=document.createElement('a');link.href=url;link.download=name;link.className='text-[#00df83] underline';link.textContent=`Download ${name}`;link.addEventListener('click',()=>setTimeout(()=>URL.revokeObjectURL(url),1000),{once:true});status.append(link,'.');}
  async function saveExportFile(button,folderName,name,content,type){const status=$('#download-status');if(!status)return;status.className='m-0 text-sm text-[#92959c]';status.textContent='';button.disabled=true;let directorySelected=false;try{if(typeof window.showDirectoryPicker!=='function'){downloadFile(name,content,type);status.textContent='Folder access is not supported in this browser.';offerDownloadLink(status,name,content,type);return;}const selected=await window.showDirectoryPicker({id:'vaultiqflow-downloads',mode:'readwrite'});directorySelected=true;const root=await selected.getDirectoryHandle('VaultiqFlow',{create:true}),folder=await root.getDirectoryHandle(folderName,{create:true}),file=await folder.getFileHandle(name,{create:true}),writer=await file.createWritable();try{await writer.write(new Blob([content],{type}));await writer.close();}catch(error){await writer.abort();throw error;}status.textContent=`Saved under ${selected.name||'the selected folder'}/VaultiqFlow/${folderName}/${name}.`;offerDownloadLink(status,name,content,type,'Download a copy:');}catch(error){if(error?.name==='AbortError'&&!directorySelected){status.textContent='Folder selection was cancelled. No file was downloaded.';}else{try{downloadFile(name,content,type);status.textContent='Could not save to the selected folder.';offerDownloadLink(status,name,content,type);}catch(downloadError){console.error('Export download failed.',downloadError);status.className='m-0 text-sm text-red-300';status.textContent='Unable to download the file. Check browser download permissions and try again.';}}}finally{button.disabled=false;}}

  // Preferences, browser notifications, sound upload and scoped data reset.
  $$('button[aria-label="Settings"]').forEach(b=>b.onclick=()=>{
    const dlg=makeDialog('settings-dialog','Settings & Preferences',`<div class="space-y-5"><section><div class="space-y-3"><label class="flex items-center justify-between rounded-xl bg-[#202124] p-4"><span><b class="font-normal">Preferences</b><small class="block text-[#92959c]">Enable helpful spending signals.</small></span><input data-setting="preferences" type="checkbox"></label><label class="flex items-center justify-between rounded-xl bg-[#202124] p-4"><span><b class="font-normal">Browser Notifications</b><small class="block text-[#92959c]">Allow browser alerts for reminders.</small></span><input data-setting="browser" type="checkbox"></label><div class="rounded-xl bg-[#202124] p-4"><label class="flex justify-between"><span><b class="font-normal">Notification Sound</b><small class="block text-[#92959c]">Preview or upload an MP3/WAV.</small></span><input data-setting="sound" type="checkbox"></label><div class="mt-3 flex gap-2"><button id="sound-preview" class="inline-flex items-center gap-2 rounded-lg border border-[#444] px-3 py-2"><svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>Preview</button><input id="sound-file" type="file" accept="audio/mpeg,audio/wav,.mp3,.wav" class="hidden"><button id="sound-upload" type="button" class="inline-flex items-center gap-2 rounded-lg border border-[#444] px-3 py-2"><svg class="h-4 w-4 fill-none stroke-current [stroke-width:2] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m-5 5 5-5 5 5M5 14v5h14v-5"/></svg>Upload</button></div></div></div></section><section class="grid gap-3 rounded-xl bg-[#202124] p-4"><b class="font-normal">Reset Month Target</b><p class="text-sm text-[#92959c]">Clear VaultiqFlow data stored in this browser. This does not affect other browser data.</p><button id="clear-data" class="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-3"><svg class="h-4 w-4 fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>Clear All Local Data</button></section></div>`);
    $$('[data-setting]',dlg).forEach(styleToggle);
    $$('[data-setting]',dlg).forEach(i=>{
      i.checked=!!state.settings[i.dataset.setting];
      i.onchange=async()=>{
        if(i.dataset.setting==='browser'&&i.checked){
          if(!('Notification'in window)){i.checked=false;return alert('Browser notifications are not supported here.');}
          const p=await Notification.requestPermission();
          if(p!=='granted'){i.checked=false;alert('Notification permission was not granted.');return;}
        }
        state.settings[i.dataset.setting]=i.checked;
        persist();
      };
    });
    $('#sound-upload',dlg).onclick=()=>$('#sound-file',dlg).click();
    $('#sound-file',dlg).onchange=e=>{
      const input=e.target,f=input.files[0];
      input.value='';
      if(!f)return;
      if(!/\.(mp3|wav)$/i.test(f.name)||(f.type&&!f.type.startsWith('audio/'))){
        alert('Choose an MP3 or WAV file.');
        return;
      }
      const reader=new FileReader();
      reader.onerror=()=>{
        console.error('Unable to read notification sound.',reader.error);
        alert('Unable to read the selected sound file.');
      };
      reader.onload=()=>{
        if(typeof reader.result!=='string'){
          alert('Unable to read the selected sound file.');
          return;
        }
        const previousSoundUrl=state.settings.soundUrl;
        state.settings.soundUrl=reader.result;
        try{persist();}
        catch(error){
          state.settings.soundUrl=previousSoundUrl;
          console.error('Unable to save notification sound.',error);
          alert('Unable to save the selected sound. Try a smaller audio file.');
          return;
        }
        showStatusToast('Successfully Updated');
      };
      reader.readAsDataURL(f);
    };
    $('#sound-preview',dlg).onclick=()=>playSound(state.settings.soundUrl||'sound/notification.wav');
    $('#clear-data',dlg).onclick=()=>{if(confirm('Permanently clear all VaultiqFlow data stored by this app on this device?')){localStorage.removeItem(key);localStorage.removeItem(homePeriodStorageKey);location.reload();}};
    open(dlg);
  });
  function notifyUser(title,soundPath='sound/notification.wav'){if(state.settings.browser&&'Notification'in window&&Notification.permission==='granted')new Notification('Expense added',{body:title});if(state.settings.sound)playSound(soundPath);}
  function playSound(soundPath){const source=soundPath==='sound/notification.wav'&&state.settings.soundUrl?state.settings.soundUrl:soundPath;new Audio(source).play().catch(error=>console.warn('Unable to play sound.',error));}
  function checkReminders(){const now=new Date(),day=isoDate(now),hm=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;let changed=false;state.reminders.forEach(r=>{const anchorValue=new Date(r.createdAt||now),anchor=Number.isFinite(anchorValue.getTime())?anchorValue:now,frequency=r.frequency||'Daily',onSchedule=frequency==='Weekly'?anchor.getDay()===now.getDay():frequency==='Monthly'?anchor.getDate()===now.getDate():true;if(r.enabled&&onSchedule&&r.time===hm&&r.lastFired!==day){r.lastFired=day;state.notifications.push({id:crypto.randomUUID(),title:r.title,message:`Reminder: ${r.title}`,timestamp:now.toISOString()});notifyUser(r.title,'sound/alert.wav');changed=true;}});if(changed){persist();if(notifDialog?.open)renderNotifications();}}
  function renderItemsSafe(){renderItems();}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.settings.browser&&'Notification'in window&&Notification.permission==='granted'){} });
  persist();renderHome();renderItems();renderDaily();renderReport();renderNotifications();showView(location.hash.slice(1)||'home');checkReminders();window.setInterval(checkReminders,30000);
})();
