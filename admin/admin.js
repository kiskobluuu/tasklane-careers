(() => {
const SUPABASE_URL='https://lvqnwnzuqcxpdryppmpm.supabase.co';
const SUPABASE_KEY='sb_publishable_uxqKE783zcNmy7tkVgDCqQ_0zJOPXvc';
const ADMIN_ACTION_URL=SUPABASE_URL+'/functions/v1/careers-admin-action';
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const $=id=>document.getElementById(id), loginPanel=$('loginPanel'),dashboard=$('dashboard'),signOut=$('signOut'),rows=$('applicationRows'),detail=$('detailPanel');
const pageSize=25;let page=0,total=0,apps=[],selectedId=null,staff=null,searchTimer=null;
const roles={'research-operations-coordinator':'Research Operations Coordinator','quality-compliance-specialist':'Quality & Compliance Specialist','partner-task-operations-manager':'Partner & Task Operations Manager'};
const escFilter=v=>String(v||'').replace(/[,%()]/g,' ').trim().slice(0,100);
const fmtDate=v=>v?new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):'—';
const setStatus=(el,msg='',err=false)=>{el.textContent=msg;el.classList.toggle('error',err)};
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
function field(label,value,full=false){const d=node('div','',full?'field full':'field');d.append(node('span',label));d.append(node('p',value||'—'));return d}
async function requireStaff(){
 const {data:{user},error}=await sb.auth.getUser(); if(error||!user)return false;
 const {data,error:e}=await sb.from('careers_staff').select('role').eq('user_id',user.id).maybeSingle();
 if(e||!data){await sb.auth.signOut();setStatus($('loginStatus'),'This account is not authorized for the recruitment dashboard.',true);return false}
 staff={user,role:data.role};return true;
}
async function showApp(){
 if(await requireStaff()){loginPanel.hidden=true;dashboard.hidden=false;signOut.hidden=false;$('staffLabel').textContent=userLabel();await loadApps()}else{loginPanel.hidden=false;dashboard.hidden=true;signOut.hidden=true}
}
function userLabel(){return staff?staff.user.email+' · '+staff.role:''}
function buildQuery(){
 let q=sb.from('applications').select('id,created_at,role_slug,role_title,full_name,email,status',{count:'exact'});
 const role=$('roleFilter').value,status=$('statusFilter').value,s=escFilter($('search').value);
 if(role)q=q.eq('role_slug',role);if(status)q=q.eq('status',status);if(s)q=q.or('full_name.ilike.%'+s+'%,email.ilike.%'+s+'%');
 return q.order('created_at',{ascending:false}).range(page*pageSize,page*pageSize+pageSize-1);
}
async function loadApps(){
 setStatus($('listStatus'),'Loading applications…');rows.replaceChildren();
 const {data,error,count}=await buildQuery();if(error){setStatus($('listStatus'),'Could not load applications.',true);return}
 apps=data||[];total=count||0;renderRows();setStatus($('listStatus'),apps.length?'':'No applications match these filters.');
 $('pageLabel').textContent='Page '+(page+1)+' · '+total+' result'+(total===1?'':'s');$('prevPage').disabled=page===0;$('nextPage').disabled=(page+1)*pageSize>=total;updateMetrics();
 if(selectedId&&!apps.some(a=>a.id===selectedId)){selectedId=null;detail.replaceChildren(node('div','Select an application to review it.','empty-detail'))}
}
function renderRows(){rows.replaceChildren();for(const a of apps){const tr=document.createElement('tr');tr.dataset.id=a.id;if(a.id===selectedId)tr.classList.add('selected');const who=document.createElement('td');who.append(node('strong',a.full_name));who.append(node('div',a.email,'tiny'));const role=node('td',a.role_title||roles[a.role_slug]||a.role_slug);const st=document.createElement('td');st.append(node('span',a.status,'status-pill'));tr.append(who,role,st,node('td',fmtDate(a.created_at)));tr.addEventListener('click',()=>openApplication(a.id));rows.append(tr)}}
function updateMetrics(){const counts={submitted:0,reviewing:0,shortlisted:0};apps.forEach(a=>{if(a.status in counts)counts[a.status]++});$('metricTotal').textContent=total;$('metricSubmitted').textContent=counts.submitted;$('metricReviewing').textContent=counts.reviewing;$('metricShortlisted').textContent=counts.shortlisted}
async function openApplication(id){
 selectedId=id;renderRows();detail.replaceChildren(node('div','Loading application…','empty-detail'));
 const [ar,nr,hr,er]=await Promise.all([
  sb.from('applications').select('id,created_at,updated_at,role_slug,role_title,full_name,email,phone,country,city_region,experience_summary,relevant_skills,availability_hours,available_start_date,timezone,additional_notes,status,resume_path').eq('id',id).single(),
  sb.from('application_notes').select('id,created_at,note').eq('application_id',id).order('created_at',{ascending:false}),
  sb.from('application_status_history').select('id,created_at,old_status,new_status,reason').eq('application_id',id).order('created_at',{ascending:false}),
  sb.from('email_events').select('created_at,kind,success').eq('application_id',id).order('created_at',{ascending:false})
 ]);
 if(ar.error){detail.replaceChildren(node('div','Could not load this application.','empty-detail'));return}renderDetail(ar.data,nr.data||[],hr.data||[],er.data||[]);
}
function renderDetail(a,notes,history,emails){
 detail.replaceChildren();const head=node('div','', 'detail-head'),title=document.createElement('div');title.append(node('p',a.role_title||roles[a.role_slug]||a.role_slug,'eyebrow'),node('h2',a.full_name),node('p',a.email,'muted'));head.append(title,node('span',a.status,'status-pill'));detail.append(head);
 const basics=node('div','','detail-section'),grid=node('div','','detail-fields');grid.append(field('Phone',a.phone),field('Country',a.country),field('City / region',a.city_region),field('Time zone',a.timezone),field('Availability',a.availability_hours),field('Available start',a.available_start_date),field('Experience',a.experience_summary,true),field('Relevant skills / links',a.relevant_skills,true),field('Additional notes',a.additional_notes,true),field('Received',fmtDate(a.created_at)),field('Last updated',fmtDate(a.updated_at)));basics.append(node('h3','Application'),grid);detail.append(basics);
 if(a.resume_path){
  const rs=node('div','','detail-section');rs.append(node('h3','Résumé / CV'));const rb=node('button','Open secure résumé','secondary-btn');
  rb.addEventListener('click',async()=>{rb.disabled=true;const {data:{session}}=await sb.auth.getSession();try{const r=await fetch(ADMIN_ACTION_URL,{method:'POST',headers:{'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'resume_url',application_id:a.id})});const b=await r.json();if(!r.ok||!b.ok)throw new Error(b.error||'Could not open résumé.');window.open(b.url,'_blank','noopener')}catch(e){alert(e.message||'Could not open résumé.')}finally{rb.disabled=false}});rs.append(rb,node('p','Private link expires after 2 minutes.','tiny'));detail.append(rs);
 }
 const review=node('div','','detail-section');review.append(node('h3','Review status'));const controls=node('div','','status-controls'),sel=document.createElement('select');['submitted','reviewing','shortlisted','approved','rejected','withdrawn'].forEach(v=>{const o=node('option',v);o.value=v;o.selected=v===a.status;sel.append(o)});const save=node('button','Save status','primary-btn');save.addEventListener('click',async()=>{save.disabled=true;const {error}=await sb.from('applications').update({status:sel.value}).eq('id',a.id);save.disabled=false;if(error){alert('Status could not be updated.');return}await Promise.all([loadApps(),openApplication(a.id)])});controls.append(sel,save);review.append(controls);detail.append(review);
 const cs=node('div','','detail-section');cs.append(node('h3','Applicant communication'));const cp=node('p','Send a controlled email matching the current review status. Saving a status does not send email automatically.','muted'),send=node('button','Send '+a.status+' email','secondary-btn');send.disabled=a.status==='submitted';send.addEventListener('click',async()=>{if(!confirm('Send the '+a.status+' application update to '+a.email+'?'))return;send.disabled=true;const {data:{session}}=await sb.auth.getSession();try{const r=await fetch(ADMIN_ACTION_URL,{method:'POST',headers:{'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'send_status_email',application_id:a.id})});const b=await r.json();if(!r.ok||!b.ok)throw new Error(b.error||'Email could not be sent.');alert('Applicant update sent successfully.');openApplication(a.id)}catch(e){alert(e.message||'Email could not be sent.')}finally{send.disabled=false}});cs.append(cp,send);detail.append(cs);
 const ns=node('div','','detail-section');ns.append(node('h3','Private staff notes'));const form=node('div','','note-form'),ta=document.createElement('textarea');ta.placeholder='Add a factual internal review note…';ta.maxLength=4000;const add=node('button','Add note','secondary-btn');add.addEventListener('click',async()=>{const note=ta.value.trim();if(!note)return;add.disabled=true;const {error}=await sb.from('application_notes').insert({application_id:a.id,note});add.disabled=false;if(error){alert('Note could not be saved.');return}ta.value='';openApplication(a.id)});form.append(ta,add);ns.append(form);for(const n of notes){const x=node('div','','note-item');x.append(node('div',n.note),node('div',fmtDate(n.created_at),'tiny'));ns.append(x)}detail.append(ns);
 const hs=node('div','','detail-section');hs.append(node('h3','Status history'));if(!history.length)hs.append(node('p','No status changes yet.','muted'));for(const h of history){const x=node('div','','history-item');x.append(node('div',(h.old_status||'—')+' → '+h.new_status),node('div',fmtDate(h.created_at)+(h.reason?' · '+h.reason:''),'tiny'));hs.append(x)}detail.append(hs);
 const es=node('div','','detail-section');es.append(node('h3','Email events'));if(!emails.length)es.append(node('p','No email events recorded.','muted'));for(const e of emails){const x=node('div','','history-item');x.append(node('div',e.kind+' · '+(e.success?'sent':'failed')),node('div',fmtDate(e.created_at),'tiny'));es.append(x)}detail.append(es);
}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;setStatus($('loginStatus'),'Signing in…');const {error}=await sb.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});btn.disabled=false;if(error){setStatus($('loginStatus'),'Sign-in failed. Check your email and password.',true);return}await showApp()});
signOut.addEventListener('click',async()=>{await sb.auth.signOut();staff=null;selectedId=null;await showApp()});$('refresh').addEventListener('click',loadApps);
$('roleFilter').addEventListener('change',()=>{page=0;loadApps()});$('statusFilter').addEventListener('change',()=>{page=0;loadApps()});$('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{page=0;loadApps()},300)});
$('prevPage').addEventListener('click',()=>{if(page>0){page--;loadApps()}});$('nextPage').addEventListener('click',()=>{if((page+1)*pageSize<total){page++;loadApps()}});
sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){loginPanel.hidden=false;dashboard.hidden=true;signOut.hidden=true}});showApp();
})();