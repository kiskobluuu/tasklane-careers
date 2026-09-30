(() => {
 const c=window.TASKLANE_CONFIG, form=document.getElementById('applicationForm'), steps=[...document.querySelectorAll('.form-step')], next=document.getElementById('nextButton'), back=document.getElementById('backButton'), submit=document.getElementById('submitButton'), status=document.getElementById('formStatus'); let current=1;
 const params=new URLSearchParams(location.search); const roleSlug=params.get('role'); const role=c.roles?.[roleSlug];
 if(!role){location.href='index.html#openings';return}
 const DRAFT=`tasklane_application_draft_v3_${role.slug}`;
 document.title=`Apply — ${role.title} | Task Lane Company`; document.getElementById('applyRoleTitle').textContent=role.title; document.getElementById('role_slug').value=role.slug; document.getElementById('resumeHelp').textContent=`Maximum ${c.application.maxResumeMb} MB. Accepted: ${c.application.acceptedResumeTypes.join(', ')}`;
 if(c.staging)document.getElementById('stagingBanner').hidden=false;
 ['source','utm_source','utm_medium','utm_campaign'].forEach(k=>{const e=document.getElementById(k),v=params.get(k)||sessionStorage.getItem(`tasklane_${k}`)||'';e.value=v;if(params.get(k))sessionStorage.setItem(`tasklane_${k}`,params.get(k))});
 if(c.application.requireResume)document.getElementById('resume').required=true;
 const setStatus=(m='',t='')=>{status.textContent=m;status.className=`form-status ${t}`.trim()};
 const show=n=>{current=n;steps.forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===n));document.querySelectorAll('[data-step-indicator]').forEach(li=>{const sn=Number(li.dataset.stepIndicator);li.classList.toggle('active',sn===n);li.classList.toggle('complete',sn<n)});back.hidden=n===1;next.hidden=n===steps.length;submit.hidden=n!==steps.length;setStatus();if(n===steps.length)review();window.scrollTo({top:0,behavior:'smooth'})};
 const valid=()=>{for(const f of steps[current-1].querySelectorAll('[required]')){if(!f.checkValidity()){f.reportValidity();f.focus();return false}}const r=document.getElementById('resume');if(r.files[0]&&r.files[0].size>c.application.maxResumeMb*1024*1024){setStatus(`Résumé is larger than ${c.application.maxResumeMb} MB.`,'error');return false}return true};
 const save=()=>{const d={};[...form.elements].forEach(e=>{if(!e.name||e.type==='file'||e.type==='hidden'||e.name==='website')return;d[e.name]=e.type==='checkbox'?e.checked:e.value});sessionStorage.setItem(DRAFT,JSON.stringify(d))};
 const restore=()=>{try{const d=JSON.parse(sessionStorage.getItem(DRAFT)||'{}');Object.entries(d).forEach(([k,v])=>{const e=form.elements[k];if(!e)return;if(e.type==='checkbox')e.checked=!!v;else e.value=v})}catch{}}; restore();
 const review=()=>{const box=document.getElementById('reviewSummary'),d=new FormData(form),items=[['Name',`${d.get('first_name')||''} ${d.get('last_name')||''}`.trim()],['Email',d.get('email')],['Country / territory',d.get('country')],['Availability',d.get('weekly_availability')],['Start date',d.get('start_date')]];box.innerHTML='';items.forEach(([l,v])=>{const x=document.createElement('div');x.className='review-item';x.innerHTML=`<span>${l}</span><strong></strong>`;x.querySelector('strong').textContent=v||'—';box.appendChild(x)})};
 next.addEventListener('click',()=>{if(valid()){save();show(Math.min(current+1,steps.length))}});back.addEventListener('click',()=>{save();show(Math.max(1,current-1))});form.addEventListener('input',save);
 const wrap=document.getElementById('turnstileWrap'),key=c.application.turnstileSiteKey;if(!key||key.includes('YOUR_'))wrap.innerHTML='<p class="microcopy">Spam verification is not yet configured. Submissions remain in staging until launch checks are complete.</p>';else wrap.innerHTML=`<div class="cf-turnstile" data-sitekey="${key}" data-theme="light"></div>`;
 form.addEventListener('submit',async e=>{
 e.preventDefault();
 if(!valid())return;
 // Allow a single controlled end-to-end test with ?test=1 while public submissions stay in staging.
 const testMode=c.staging && params.get('test')==='1';
 if(c.staging&&!testMode){setStatus('Applications are temporarily disabled while the final security checks are completed.','error');return}
 if(!c.application.endpoint||c.application.endpoint.includes('YOUR_')){setStatus('Application endpoint is not configured.','error');return}
 const fd=new FormData(form);
 const resume=fd.get('resume');
 if(resume instanceof File&&resume.size){setStatus('Résumé upload is not yet supported by the live application service. Please remove the file to continue.','error');return}
 const fullName=[fd.get('first_name'),fd.get('last_name')].map(v=>String(v||'').trim()).filter(Boolean).join(' ');
 const payload={
  role_slug:String(fd.get('role_slug')||''),full_name:fullName,email:String(fd.get('email')||''),
  phone:String(fd.get('phone')||''),country:String(fd.get('country')||''),timezone:String(fd.get('timezone')||''),
  experience_summary:String(fd.get('relevant_experience')||''),
  relevant_skills:[String(fd.get('role_interest')||''),String(fd.get('linkedin_url')||''),String(fd.get('portfolio_url')||'')].filter(Boolean).join('\n\n'),
  availability_hours:String(fd.get('weekly_availability')||''),available_start_date:String(fd.get('start_date')||''),
  additional_notes:String(fd.get('availability_notes')||''),
  consent_privacy:fd.has('privacy_consent'),consent_accuracy:fd.has('truthfulness'),
  website:String(fd.get('website')||'')
 };
 submit.disabled=true;setStatus('Submitting…');
 try{
  const r=await fetch(c.application.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const b=await r.json().catch(()=>({}));
  if(!r.ok||!b.ok)throw new Error(b.error||'Submission failed.');
  sessionStorage.removeItem(DRAFT);
  location.href='thank-you.html';
 }catch(err){setStatus(err.message||'We could not submit the application. Please try again.','error');submit.disabled=false}
});show(1);
})();
