const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const artifactsDir = path.join(rootDir, "artifacts");
const reportPath = path.join(artifactsDir, "cucumber-report.json");
const summaryPath = path.join(artifactsDir, "summary.txt");

const statuses = ["passed", "failed", "skipped", "unknown"];

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readJson(filePath, errorMessage) {
  if (!fs.existsSync(filePath)) throw new Error(errorMessage);

  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) {
    throw new Error(`Report file is empty at ${filePath}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Report file is not valid JSON at ${filePath}: ${error.message}`);
  }
}

function readSummary() {
  return fs.existsSync(summaryPath) ? fs.readFileSync(summaryPath, "utf8") : "Summary not available.";
}

function formatNs(ns) {
  const totalMs = Math.round((ns || 0) / 1_000_000);
  const m = Math.floor(totalMs / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${m}m ${s}s ${ms}ms`;
}

function normalize(report) {
  const scenarioCounts = { passed: 0, failed: 0, skipped: 0, unknown: 0 };
  const stepCounts = { passed: 0, failed: 0, skipped: 0, unknown: 0 };
  let totalDurationNs = 0;
  const scenarios = [];

  for (const feature of report) {
    for (const scenario of feature.elements || []) {
      const steps = (scenario.steps || []).filter((step) => !step.hidden).map((step) => {
        const status = step.result?.status || "unknown";
        const durationNs = typeof step.result?.duration === "number" ? step.result.duration : 0;
        const embeddings = Array.isArray(step.embeddings) ? step.embeddings : [];
        const screenshots = embeddings
          .filter((item) => String(item.mime_type || "").startsWith("image/"))
          .map((item, index) => ({
            name: item.name || `Screenshot ${index + 1}`,
            src: `data:${item.mime_type};base64,${item.data}`
          }));
        const notes = embeddings
          .filter((item) => item.mime_type === "text/plain")
          .map((item) => Buffer.from(item.data || "", "base64").toString("utf8"));

        totalDurationNs += durationNs;
        stepCounts[stepCounts[status] === undefined ? "unknown" : status] += 1;

        return {
          keyword: step.keyword || "",
          name: step.name || "",
          status,
          durationMs: Math.round(durationNs / 1_000_000),
          error: step.result?.error_message || "",
          screenshots,
          notes,
          attachmentCount: embeddings.length + ((step.attachments || []).length)
        };
      });

      const failedStep = steps.find((step) => step.status === "failed");
      const allSkipped = steps.length > 0 && steps.every((step) => step.status === "skipped");
      const hasPassed = steps.some((step) => step.status === "passed");
      const status = failedStep ? "failed" : allSkipped && !hasPassed ? "skipped" : steps.length ? "passed" : "unknown";
      scenarioCounts[scenarioCounts[status] === undefined ? "unknown" : status] += 1;

      scenarios.push({
        id: scenarios.length,
        feature: feature.name || "Unnamed Feature",
        name: scenario.name || "Unnamed Scenario",
        status,
        durationLabel: formatNs(steps.reduce((sum, step) => sum + step.durationMs * 1_000_000, 0)),
        failedStep: failedStep?.name || "",
        error: failedStep?.error || "",
        screenshotCount: steps.reduce((sum, step) => sum + step.screenshots.length, 0),
        steps
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalScenarios: scenarios.length,
      totalSteps: Object.values(stepCounts).reduce((sum, count) => sum + count, 0),
      durationLabel: formatNs(totalDurationNs),
      scenarioCounts,
      stepCounts
    },
    scenarios,
    defaultScenarioId: (scenarios.find((item) => item.status === "failed") || scenarios[0] || {}).id ?? null
  };
}

function html(model, summaryText) {
  const data = JSON.stringify(model).replace(/</g, "\\u003c");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>CP Automation TS Report</title><style>
  :root{--bg:#f6f2eb;--panel:#fffdf8;--line:#e6dccd;--text:#1f2933;--muted:#667085;--accent:#1d6f5f;--pass:#1f8f61;--pass-soft:#e5f6ed;--fail:#c44b3d;--fail-soft:#fdeceb;--skip:#b78103;--skip-soft:#fff3d6;--total:#245b8f;--total-soft:#e7f0fb;--unknown:#637381;--shadow:0 12px 34px rgba(70,53,32,.08)}
  *{box-sizing:border-box}body{margin:0;font-family:"Segoe UI",Arial,sans-serif;color:var(--text);background:linear-gradient(180deg,#faf7f1 0%,var(--bg) 100%)}
  .page{width:min(1450px,calc(100% - 24px));margin:12px auto 18px;display:grid;gap:12px}.panel{background:var(--panel);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow)}
  .hero,.side,.detail{padding:16px}.hero{display:grid;gap:12px}.top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.hero h1{margin:0;font-size:clamp(24px,2.6vw,34px)}.hero p{margin:4px 0 0;color:var(--muted);font-size:14px}
  .meta,.filters,.chips,.step-meta,.summary-actions{display:flex;gap:8px;flex-wrap:wrap}.meta{align-items:center;font-size:13px;color:var(--muted)}.meta-text{font-weight:600;color:var(--text)}.pill,.chip,.btn,.status,.nav-btn{padding:7px 11px;border-radius:999px;border:1px solid var(--line);background:#fff;font-size:12px}.btn,.nav-btn{cursor:pointer}.btn.active,.nav-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}.nav-btn.secondary{background:#dceee8;border-color:rgba(29,111,95,.22);color:var(--accent)}
  .nav-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.nav-card{border:1px solid var(--line);border-radius:16px;padding:15px;background:#fff;cursor:pointer;display:grid;gap:8px;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}.nav-card:hover{transform:translateY(-1px);box-shadow:0 0 0 3px rgba(29,111,95,.08)}.nav-card .eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}.nav-card .value{font-size:32px;font-weight:700}.nav-card .desc{font-size:12px;color:var(--muted);line-height:1.45}.nav-card-pass{background:linear-gradient(180deg,var(--pass-soft) 0%,#fff 100%);border-color:rgba(31,143,97,.2)}.nav-card-fail{background:linear-gradient(180deg,var(--fail-soft) 0%,#fff 100%);border-color:rgba(196,75,61,.2)}.nav-card-skip{background:linear-gradient(180deg,var(--skip-soft) 0%,#fff 100%);border-color:rgba(183,129,3,.2)}.nav-card-total{background:linear-gradient(180deg,var(--total-soft) 0%,#fff 100%);border-color:rgba(36,91,143,.2)}
  .charts{display:grid;grid-template-columns:.88fr 1.12fr;gap:12px}.chart{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff}.chart h2,.side h2,.detail h2,.summary h2{margin:0 0 10px;font-size:17px}.legend{display:grid;gap:6px;margin-top:8px}.legend div{display:flex;justify-content:space-between;font-size:12px}.legend span:first-child{display:flex;align-items:center;gap:8px}.dot{width:12px;height:12px;border-radius:99px;display:inline-block}
  .summary{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff}.summary pre{margin:0;max-height:180px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-family:Consolas,monospace;font-size:12px}
  .view{display:none}.view.active{display:block}.layout{display:grid;grid-template-columns:340px minmax(0,1fr);gap:14px;height:min(78vh,920px)}.toolbar{display:grid;gap:10px}.toolbar input{width:100%;padding:12px;border-radius:12px;border:1px solid var(--line)}
  .side{display:grid;grid-template-rows:auto auto auto minmax(0,1fr);gap:12px;min-height:0}.detail{display:grid;grid-template-rows:minmax(0,1fr);gap:14px;min-height:0}.count{color:var(--muted);font-size:13px}.list{display:grid;gap:10px;align-content:start;overflow:auto;padding-right:4px;min-height:0}.item{width:100%;text-align:left;border:1px solid var(--line);border-radius:14px;background:#fff;padding:12px;cursor:pointer;display:grid;gap:8px}.item.active{border-color:rgba(29,111,95,.45);box-shadow:0 0 0 3px rgba(29,111,95,.12)}
  .name{font-weight:700;line-height:1.4}.chips,.step-meta{color:var(--muted);font-size:12px}.status{font-weight:700;text-transform:uppercase;letter-spacing:.05em;width:fit-content}.status-passed{background:#e5f6ed;color:var(--pass)}.status-failed{background:#fdeceb;color:var(--fail)}.status-skipped{background:#fff3d6;color:var(--skip)}.status-unknown{background:#eef2f6;color:var(--unknown)}
  .detail-shell{display:grid;grid-template-rows:auto minmax(0,1fr);gap:14px;height:100%;min-height:0}.detail-scroll{overflow:auto;padding-right:4px;min-height:0}.header{display:grid;gap:10px;padding-bottom:8px;border-bottom:1px solid var(--line)}.title{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.feature{color:var(--muted);font-size:14px}
  .banner{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.mini{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff}.mini .k{font-size:11px;text-transform:uppercase;color:var(--muted);margin-bottom:6px}.mini .v{font-weight:700;line-height:1.4;font-size:15px}
  .steps{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff;display:grid;gap:10px}.step-list{display:grid;gap:10px}.step{border:1px solid var(--line);border-radius:12px;padding:11px;background:#fff;display:grid;gap:8px}.step-head{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.step-title{font-weight:700;line-height:1.35}.kw{color:var(--accent);margin-right:6px}.error{margin:0;white-space:pre-wrap;word-break:break-word;font-family:Consolas,monospace;font-size:12px;padding:10px;border-radius:10px;background:#fdeceb;border:1px solid rgba(196,75,61,.18)}
  .note-box{margin:0;padding:10px;border-radius:10px;background:#eef7f4;border:1px solid rgba(29,111,95,.16);font-size:12px;line-height:1.5;color:#20423b}.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}.shot{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}.shot img{width:100%;display:block;aspect-ratio:16/10;object-fit:cover;background:#f2ece2;cursor:pointer}.shot a{display:block;padding:9px;color:var(--accent);text-decoration:none;border-top:1px solid var(--line);font-size:12px}
  .empty{border:1px dashed var(--line);border-radius:14px;padding:28px;text-align:center;color:var(--muted);background:rgba(255,255,255,.6)}.modal{position:fixed;inset:0;background:rgba(19,25,31,.75);display:none;align-items:center;justify-content:center;padding:24px}.modal.open{display:flex}.modal-box{display:grid;gap:10px;max-width:min(1200px,100%)}.modal-box img{max-width:100%;max-height:calc(100vh - 90px);border-radius:16px;background:#fff}.close{justify-self:end;border:0;border-radius:999px;padding:10px 14px;cursor:pointer;background:#fff;font-weight:700}
  @media (max-width:1180px){.banner,.charts,.layout,.nav-grid{grid-template-columns:1fr 1fr}.layout{grid-template-columns:1fr;height:auto}.side,.detail{grid-template-rows:auto auto auto auto}}
  @media (max-width:720px){.page{width:min(100%,calc(100% - 18px));margin:10px auto 18px}.hero,.side,.detail{padding:14px}.stats,.banner,.charts,.nav-grid{grid-template-columns:1fr}.top,.title,.step-head{flex-direction:column}}
  </style></head><body><div class="page">
  <section class="panel hero"><div class="top"><div><h1>CP Automation Test Report</h1><p>Summary-first report with filtered scenario review and scrollable details.</p></div><div class="meta" id="meta"></div></div>
  <div id="summaryView" class="view active"><div class="nav-grid" id="navGrid"></div><div class="charts"><section class="chart"><h2>Scenario Summary</h2><canvas id="pie" width="320" height="320"></canvas><div class="legend" id="pieLegend"></div></section><section class="chart"><h2>Step Summary</h2><canvas id="bar" width="520" height="320"></canvas><div class="legend" id="barLegend"></div></section></div><section class="summary"><h2>Execution Summary</h2><pre>${esc(summaryText)}</pre></section></div></section>
  <section id="detailsView" class="view"><div class="layout"><aside class="panel side"><div class="summary-actions"><button class="nav-btn secondary" id="backToSummary" type="button">Back To Summary</button><button class="nav-btn" id="allScenariosBtn" type="button">Show All</button></div><div><h2>Scenarios</h2><div class="count" id="count"></div></div><div class="toolbar"><input id="search" type="search" placeholder="Search scenario name"/><div class="filters" id="filters"></div></div><div class="list" id="list"></div></aside><section class="panel detail"><div id="detailRoot"></div></section></div></section>
  </div><div class="modal" id="modal"><div class="modal-box"><button class="close" id="close" type="button">Close</button><img id="modalImg" alt="Screenshot preview"/></div></div>
  <script>
  const report=${data},statuses=["passed","failed","skipped","unknown"],statusLabels={passed:"Passed",failed:"Failed",skipped:"Skipped",unknown:"Unknown"},colors={passed:"#1f8f61",failed:"#c44b3d",skipped:"#b78103",unknown:"#637381"};let activeScenarioId=report.defaultScenarioId,activeFilter="all",searchText="",currentView="summary";
  const q=(s)=>document.querySelector(s),qa=(s)=>Array.from(document.querySelectorAll(s));
  const safe=(v)=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  function legend(id,counts){q(id).innerHTML=statuses.map(s=>((counts[s]||0)||s!=="unknown")?'<div><span><i class="dot" style="background:'+colors[s]+'"></i>'+statusLabels[s]+'</span><strong>'+(counts[s]||0)+'</strong></div>':"").join("")}
  function pie(id,counts){const c=q(id),x=c.getContext("2d"),t=statuses.reduce((a,s)=>a+(counts[s]||0),0);x.clearRect(0,0,c.width,c.height);if(!t)return;let a=-Math.PI/2;statuses.forEach(s=>{const v=counts[s]||0;if(!v)return;const slice=v/t*Math.PI*2;x.beginPath();x.moveTo(160,160);x.arc(160,160,120,a,a+slice);x.closePath();x.fillStyle=colors[s];x.fill();a+=slice});x.beginPath();x.fillStyle="#fffdf8";x.arc(160,160,64,0,Math.PI*2);x.fill();x.fillStyle="#1f2933";x.font="700 28px Segoe UI";x.textAlign="center";x.fillText(String(t),160,158);x.fillStyle="#667085";x.font="13px Segoe UI";x.fillText("Scenarios",160,184)}
  function bar(id,counts){const c=q(id),x=c.getContext("2d"),labels=statuses.filter(s=>(counts[s]||0)||s!=="unknown"),max=Math.max(1,...labels.map(s=>counts[s]||0)),p={t:28,r:24,b:44,l:42},w=c.width-p.l-p.r,h=c.height-p.t-p.b,bw=Math.min(70,w/Math.max(labels.length,1)-18);x.clearRect(0,0,c.width,c.height);x.strokeStyle="#e6dccd";for(let i=0;i<=4;i++){const y=p.t+h/4*i;x.beginPath();x.moveTo(p.l,y);x.lineTo(c.width-p.r,y);x.stroke()}x.fillStyle="#667085";x.font="12px Segoe UI";x.textAlign="right";for(let i=0;i<=4;i++){const v=Math.round(max-max/4*i);x.fillText(String(v),p.l-8,p.t+h/4*i+4)}labels.forEach((s,i)=>{const v=counts[s]||0,px=p.l+(i+.5)*(w/labels.length)-bw/2,bh=v/max*(h-10),py=p.t+h-bh;x.fillStyle=colors[s];x.fillRect(px,py,bw,bh);x.fillStyle="#1f2933";x.font="700 12px Segoe UI";x.textAlign="center";x.fillText(String(v),px+bw/2,py-8);x.fillStyle="#667085";x.font="12px Segoe UI";x.fillText(statusLabels[s],px+bw/2,c.height-16)})}
  function meta(){const s=report.summary;const generated=new Date(report.generatedAt);const generatedText=isNaN(generated.getTime())?safe(report.generatedAt):safe(generated.toLocaleString());q("#meta").innerHTML='<span class="meta-text">Generated: '+generatedText+'</span><span> | </span><span class="meta-text">Duration: '+safe(s.durationLabel)+'</span>'}
  function navCards(){const s=report.summary;const cards=[{id:"passed",label:"Passed",value:s.scenarioCounts.passed||0,desc:"Open details view with only passed scenarios",cls:"nav-card-pass"},{id:"failed",label:"Failed",value:s.scenarioCounts.failed||0,desc:"Open details view with only failed scenarios",cls:"nav-card-fail"},{id:"skipped",label:"Skipped",value:s.scenarioCounts.skipped||0,desc:"Open details view with only skipped scenarios",cls:"nav-card-skip"},{id:"all",label:"Total",value:s.totalScenarios,desc:"Open details view with all scenarios",cls:"nav-card-total"}];q("#navGrid").innerHTML=cards.map(card=>'<button class="nav-card '+card.cls+'" data-nav-filter="'+card.id+'" type="button"><div class="eyebrow">'+card.label+' Scenarios</div><div class="value">'+card.value+'</div><div class="desc">'+card.desc+'</div></button>').join("");qa("[data-nav-filter]").forEach(btn=>btn.addEventListener("click",()=>openDetails(btn.dataset.navFilter)))}
  function setView(view){currentView=view;q("#summaryView").classList.toggle("active",view==="summary");q("#detailsView").classList.toggle("active",view==="details")}
  function openDetails(filter){activeFilter=filter==="all"?"all":filter;filters();setView("details");renderList()}
  function filters(){const opts=[["all","Total"],["passed","Passed"],["failed","Failed"],["skipped","Skipped"]];q("#filters").innerHTML=opts.map(([id,label])=>'<button class="btn'+(id===activeFilter?' active':'')+'" data-filter="'+id+'" type="button">'+label+'</button>').join("");qa("#filters .btn").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;filters();renderList()}));q("#allScenariosBtn").classList.toggle("active",activeFilter==="all")}
  function filtered(){return report.scenarios.filter(s=>(activeFilter==="all"||s.status===activeFilter)&&(!searchText||s.name.toLowerCase().includes(searchText)))}
  function renderList(){const items=filtered();q("#count").textContent=items.length+" of "+report.summary.totalScenarios+" scenarios shown";if(!items.some(i=>i.id===activeScenarioId))activeScenarioId=items[0]?.id??null;if(!items.length){q("#list").innerHTML='<div class="empty">No scenarios match the current search or filter.</div>';renderDetail();return}
    q("#list").innerHTML=items.map(s=>'<button class="item'+(s.id===activeScenarioId?' active':'')+'" data-id="'+s.id+'" type="button"><span class="status status-'+s.status+'">'+safe(statusLabels[s.status]||"Unknown")+'</span><div class="name">'+safe(s.name)+'</div><div class="chips"><span class="chip">'+safe(s.feature)+'</span><span class="chip">'+safe(s.durationLabel)+'</span><span class="chip">'+s.steps.length+' steps</span><span class="chip">'+s.screenshotCount+' screenshots</span></div>'+(s.failedStep?'<div class="count">Failed Step: '+safe(s.failedStep)+'</div>':'')+'</button>').join("");
    qa("#list .item").forEach(b=>b.addEventListener("click",()=>{activeScenarioId=Number(b.dataset.id);renderList()}));renderDetail()}
  function renderDetail(){const s=report.scenarios.find(i=>i.id===activeScenarioId);if(!s){q("#detailRoot").innerHTML='<div class="empty">Select a scenario to review its step results.</div>';return}const failed=s.steps.find(st=>st.status==="failed"),first=s.steps.flatMap(st=>st.screenshots)[0];
    q("#detailRoot").innerHTML='<div class="detail-shell"><div class="header"><div class="title"><div><h2>'+safe(s.name)+'</h2><div class="feature">'+safe(s.feature)+' | Duration: '+safe(s.durationLabel)+'</div></div><span class="status status-'+s.status+'">'+safe(statusLabels[s.status]||"Unknown")+'</span></div></div><div class="detail-scroll"><section class="steps"><h2>Step Details</h2><div class="step-list">'+s.steps.map((st,i)=>'<article class="step"><div class="step-head"><div class="step-title"><span class="kw">'+safe(st.keyword.trim()||"Step")+'</span>'+safe(st.name)+'</div><div class="step-meta"><span class="status status-'+st.status+'">'+safe(statusLabels[st.status]||"Unknown")+'</span><span class="chip">Step '+(i+1)+'</span><span class="chip">'+st.durationMs+' ms</span></div></div>'+(st.notes&&st.notes.length?st.notes.map(note=>'<div class="note-box">'+safe(note)+'</div>').join(""):'')+(st.error?'<pre class="error">'+safe(st.error)+'</pre>':'')+(st.screenshots.length?'<div class="shots">'+st.screenshots.map((shot,idx)=>'<div class="shot"><img src="'+shot.src+'" alt="'+safe(shot.name)+'" data-src="'+shot.src+'"/><a href="'+shot.src+'" target="_blank" rel="noreferrer">'+safe(shot.name||("Screenshot "+(idx+1)))+'</a></div>').join("")+'</div>':'')+'</article>').join("")+'</div></section></div></div>';
    qa("[data-src]").forEach(img=>img.addEventListener("click",()=>openModal(img.dataset.src)))}
  function openModal(src){q("#modalImg").src=src;q("#modal").classList.add("open")}function closeModal(){q("#modal").classList.remove("open");q("#modalImg").src=""}
  meta();navCards();legend("#pieLegend",report.summary.scenarioCounts);legend("#barLegend",report.summary.stepCounts);pie("#pie",report.summary.scenarioCounts);bar("#bar",report.summary.stepCounts);filters();q("#search").addEventListener("input",e=>{searchText=String(e.target.value||"").trim().toLowerCase();renderList()});q("#close").addEventListener("click",closeModal);q("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});q("#backToSummary").addEventListener("click",()=>setView("summary"));q("#allScenariosBtn").addEventListener("click",()=>{activeFilter="all";filters();renderList()});document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});renderList();
  </script></body></html>`;
}

function main() {
  const outputPath = path.join(rootDir, "report.html");
  const summaryText = readSummary();

  try {
    const report = readJson(reportPath, `Cucumber report not found at ${reportPath}`);
    const model = normalize(report);
    fs.writeFileSync(outputPath, html(model, summaryText), "utf8");
    console.log(`HTML report generated at ${outputPath}`);
  } catch (error) {
    const fallbackModel = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalScenarios: 0,
        totalSteps: 0,
        durationLabel: "0m 0s 0ms",
        scenarioCounts: { passed: 0, failed: 0, skipped: 0, unknown: 0 },
        stepCounts: { passed: 0, failed: 0, skipped: 0, unknown: 0 }
      },
      scenarios: [],
      defaultScenarioId: null
    };
    const combinedSummary = `${summaryText}\n\nHTML report is showing a fallback view because cucumber-report.json could not be parsed.\nReason: ${error.message}`;
    fs.writeFileSync(outputPath, html(fallbackModel, combinedSummary), "utf8");
    console.warn(`HTML report generated with fallback data at ${outputPath}`);
  }
}

main();
