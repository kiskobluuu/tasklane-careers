import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins=new Set(["https://careers.tasklaneco.com","https://kiskobluuu.github.io"]);
const roles:Record<string,string>={
 "research-operations-coordinator":"Research Operations Coordinator",
 "quality-compliance-specialist":"Quality & Compliance Specialist",
 "partner-task-operations-manager":"Partner & Task Operations Manager"
};
const cors=(origin:string|null)=>({"Access-Control-Allow-Origin":origin&&allowedOrigins.has(origin)?origin:"https://careers.tasklaneco.com","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"});
const reply=(body:unknown,status:number,origin:string|null)=>new Response(JSON.stringify(body),{status,headers:{...cors(origin),"Content-Type":"application/json","Cache-Control":"no-store"}});
const clean=(v:unknown,max=4000)=>typeof v==="string"?v.trim().slice(0,max):"";
const emailOk=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=254;
const safe=(v:string)=>v.replace(/[<>&"']/g,"");

Deno.serve(async req=>{
 const origin=req.headers.get("origin");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=="POST")return reply({ok:false,error:"Method not allowed"},405,origin);
 if(origin&&!allowedOrigins.has(origin))return reply({ok:false,error:"Origin not allowed"},403,origin);

 const contentType=req.headers.get("content-type")||"";
 let b:any={}; let resume:File|null=null;
 try{
   if(contentType.includes("multipart/form-data")){
     const fd=await req.formData();
     for(const [k,v] of fd.entries()) if(!(v instanceof File)) b[k]=v;
     const f=fd.get("resume"); if(f instanceof File&&f.size>0)resume=f;
     b.consent_privacy=fd.get("privacy_consent")==="yes"||fd.get("consent_privacy")==="true";
     b.consent_accuracy=fd.get("truthfulness")==="yes"||fd.get("consent_accuracy")==="true";
     b.full_name=[clean(fd.get("first_name"),80),clean(fd.get("last_name"),80)].filter(Boolean).join(" ");
     b.experience_summary=clean(fd.get("relevant_experience"),6000);
     b.relevant_skills=[clean(fd.get("role_interest"),1500),clean(fd.get("linkedin_url"),500),clean(fd.get("portfolio_url"),500)].filter(Boolean).join("\n\n");
     b.availability_hours=clean(fd.get("weekly_availability"),120);
     b.available_start_date=clean(fd.get("start_date"),20);
     b.additional_notes=clean(fd.get("availability_notes"),4000);
   } else b=await req.json();
 }catch{return reply({ok:false,error:"Invalid request"},400,origin)}
 if(clean(b.website,100))return reply({ok:true},200,origin);

 const role_slug=clean(b.role_slug,80),role_title=roles[role_slug],full_name=clean(b.full_name,160),email=clean(b.email,254).toLowerCase();
 if(!role_title||full_name.length<2||!emailOk(email))return reply({ok:false,error:"Please complete the required application fields."},400,origin);
 if(b.consent_privacy!==true||b.consent_accuracy!==true)return reply({ok:false,error:"Required consent is missing."},400,origin);

 if(resume){
   if(resume.size>5*1024*1024)return reply({ok:false,error:"Résumé must be 5 MB or smaller."},400,origin);
   const ext=(resume.name.split(".").pop()||"").toLowerCase();
   if(!["pdf","doc","docx"].includes(ext))return reply({ok:false,error:"Résumé must be PDF, DOC or DOCX."},400,origin);
   const allowedMime=["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
   if(resume.type&&!allowedMime.includes(resume.type))return reply({ok:false,error:"Résumé file type is not supported."},400,origin);
 }

 const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
 const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"";
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(ip+"|tasklane"));
 const ipHash=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");
 if(ipHash){
   const since=new Date(Date.now()-60*60*1000).toISOString();
   const {count}=await supabase.from("applications").select("id",{count:"exact",head:true}).eq("applicant_ip_hash",ipHash).gte("created_at",since);
   if((count||0)>=10)return reply({ok:false,error:"Too many applications were submitted from this connection. Please try again later."},429,origin);
 }

 const id=crypto.randomUUID(); let resumePath:string|null=null;
 if(resume){
   const ext=(resume.name.split(".").pop()||"").toLowerCase();
   resumePath=`${role_slug}/${id}.${ext}`;
   const {error:upErr}=await supabase.storage.from("applicant-resumes").upload(resumePath,resume,{contentType:resume.type||"application/octet-stream",upsert:false});
   if(upErr){console.error(upErr);return reply({ok:false,error:"We could not securely upload your résumé. Please try again."},500,origin)}
 }

 const row={id,role_slug,role_title,full_name,email,phone:clean(b.phone,80)||null,country:clean(b.country,100)||null,city_region:clean(b.city_region,140)||null,
 experience_summary:clean(b.experience_summary,6000)||null,relevant_skills:clean(b.relevant_skills,4000)||null,availability_hours:clean(b.availability_hours,120)||null,
 available_start_date:clean(b.available_start_date,20)||null,timezone:clean(b.timezone,100)||null,additional_notes:clean(b.additional_notes,4000)||null,
 applicant_ip_hash:ipHash||null,user_agent:clean(req.headers.get("user-agent"),500)||null,consent_privacy:true,consent_accuracy:true,resume_path:resumePath};
 const {data,error}=await supabase.from("applications").insert(row).select("id").single();
 if(error){
   if(resumePath)await supabase.storage.from("applicant-resumes").remove([resumePath]);
   if(error.code==="23505")return reply({ok:false,error:"An application for this role has already been submitted with this email address."},409,origin);
   console.error(error);return reply({ok:false,error:"We could not submit your application. Please try again."},500,origin);
 }

 let mailSuccess=false,providerId:string|null=null,mailError:string|null=null;const resendKey=Deno.env.get("RESEND_API_KEY");
 if(resendKey)try{
   const rr=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json"},body:JSON.stringify({
     from:"Task Lane Careers <careers@tasklaneco.com>",to:[email],subject:"We received your Task Lane application",
     html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1b283e"><img src="https://careers.tasklaneco.com/assets/tasklane-logo-mark.png" width="84" alt="Task Lane Company"><h1>Application received</h1><p>Hi ${safe(full_name)},</p><p>Thank you for applying for <strong>${safe(role_title)}</strong> with Task Lane Company.</p><p>Your application has been received successfully. If it moves forward, we will contact you using this email address.</p><p>— Task Lane Company Careers</p></div>`,
     text:`Hi ${full_name},\n\nThank you for applying for ${role_title} with Task Lane Company. Your application has been received successfully. If it moves forward, we will contact you using this email address.\n\n— Task Lane Company Careers`
   })});const j=await rr.json();mailSuccess=rr.ok;providerId=j?.id||null;if(!rr.ok)mailError=JSON.stringify(j).slice(0,1000);
 }catch(e){mailError=String(e).slice(0,1000)}
 await supabase.from("email_events").insert({application_id:data.id,kind:"application_received",recipient:email,provider_message_id:providerId,success:mailSuccess,error_message:mailError});
 return reply({ok:true,application_id:data.id,email_sent:mailSuccess},201,origin);
});