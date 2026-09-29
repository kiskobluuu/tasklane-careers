(() => {
  const c=window.TASKLANE_CONFIG||{}; const $=q=>document.querySelector(q);
  const set=(q,v)=>{const e=$(q);if(e)e.textContent=v||""};
  const list=(q,a=[])=>{const e=$(q);if(!e)return;e.innerHTML="";a.forEach(v=>{const li=document.createElement("li");li.textContent=v;e.appendChild(li)})};
  if(c.staging){const b=$("#stagingBanner");if(b)b.hidden=false}

  if(document.body.dataset.page==="careers-home"){
    const grid=$("#jobGrid");
    Object.values(c.roles||{}).forEach(role=>{
      const card=document.createElement("article");card.className="job-card";
      const h=document.createElement("h3");h.textContent=role.title;
      const meta=document.createElement("p");meta.className="job-meta";meta.textContent=`${role.location} • ${role.type} • ${role.compensation}`;
      const p=document.createElement("p");p.textContent=role.summary;
      const a=document.createElement("a");a.className="btn btn-secondary";a.href=`jobs/${role.slug}.html`;a.textContent="View role & apply";
      card.append(h,meta,p,a);grid.append(card);
    });
  }

  if(document.body.dataset.page==="job"){
    const slug=document.body.dataset.role; const role=c.roles?.[slug];
    if(!role){document.body.innerHTML='<main class="legal-page"><div class="container narrow"><h1>Role not found</h1><p><a href="../index.html">Return to current openings</a>.</p></div></main>';return}
    document.title=`${role.title} | Task Lane Company`;
    set("#roleTitle",role.title);set("#roleSummary",role.summary);set("#roleLocation",role.location);set("#roleType",role.type);set("#roleCompensation",role.compensation);set("#roleSchedule",role.schedule);
    list("#responsibilities",role.responsibilities);list("#qualifications",role.qualifications);list("#niceToHave",role.niceToHave);
    document.querySelectorAll("[data-apply-link]").forEach(a=>a.href=`../apply.html?role=${encodeURIComponent(role.slug)}`);
  }

  document.querySelectorAll("[data-company-legal]").forEach(e=>e.textContent=c.company?.legalName||"");
  document.querySelectorAll("[data-company-location]").forEach(e=>e.textContent=c.company?.location||"");
  document.querySelectorAll("[data-retention-days]").forEach(e=>e.textContent=c.application?.retentionDays||180);
  document.querySelectorAll("[data-privacy-email]").forEach(e=>{const v=c.company?.privacyEmail||"";e.textContent=v;e.href=`mailto:${v}`});
  document.querySelectorAll("[data-careers-email]").forEach(e=>{const v=c.company?.careersEmail||"";e.textContent=v;e.href=`mailto:${v}`});
})();
