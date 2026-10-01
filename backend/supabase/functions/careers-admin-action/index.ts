import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const allowedOrigins=new Set(["https://careers.tasklaneco.com","https://kiskobluuu.github.io"]);
const cors=(o:string|null)=>({"Access-Control-Allow-Origin":o&&allowedOrigins.has(o)?o:"https://careers.tasklaneco.com","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"});
const reply=(b:unknown,s:number,o:string|null)=>new Response(JSON.stringify(b),{status:s,headers:{...cors(o),"Content-Type":"application/json","Cache-Control":"no-store"}});
const safe=(v:string)=>v.replace(/[<>&"']/g,"");
Deno.serve(async req=>{
 const origin=req.headers.get("origin");if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=="POST"||(origin&&!allowedOrigins.has(origin)))return reply({ok:false,error:"Not allowed"},403,origin);
 const auth=req.headers.get("authorization")||"";if(!auth.startsWith("Bearer "))return reply({ok:false,error:"Authentication required"},401,origin);
 const userClient=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}}});
 const {data:{user},error:ue}=await userClient.auth.getUser();if(ue||!user)return reply({ok:false,error:"Authentication required"},401,origin);
 const {data:staff}=await userClient.from("careers_staff").select("role").eq("user_id",user.id).maybeSingle();if(!staff)return reply({ok:false,error:"Staff access required"},403,origin);
 let b:any;try{b=await req.json()}catch{return reply({ok:false,error:"Invalid request"},400,origin)}
 const applicationId=String(b.application_id||"");if(!/^[0-9a-f-]{36}$/i.test(applicationId))return reply({ok:false,error:"Invalid application"},400,origin);
 const service=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
 const {data:a,error:ae}=await service.from("applications").select("id,full_name,email,role_title,status,resume_path").eq("id",applicationId).single();
 if(ae||!a)return reply({ok:false,error:"Application not found"},404,origin);
 if(b.action==="resume_url"){
   if(!a.resume_path)return reply({ok:false,error:"No résumé was submitted with this application."},404,origin);
   const {data,error}=await service.storage.from("applicant-resumes").createSignedUrl(a.resume_path,120,{download:true});
   if(error||!data?.signedUrl)return reply({ok:false,error:"Could not create secure résumé link"},500,origin);
   return reply({ok:true,url:data.signedUrl,expires_in:120},200,origin);
 }
 if(b.action==="send_status_email"){
   const templates:Record<string,{subject:string,body:string}>={
    reviewing:{subject:"Update on your Task Lane application",body:"Your application is currently under review. We will contact you again if we need additional information or when there is another update."},
    shortlisted:{subject:"Your Task Lane application has been shortlisted",body:"Your application has been shortlisted for further consideration. We will contact you with the next step as the hiring process progresses."},
    approved:{subject:"Task Lane application decision",body:"We are pleased to let you know that your application has been approved to move forward. A member of Task Lane Company will contact you with the next steps and any required documentation."},
    rejected:{subject:"Update on your Task Lane application",body:"Thank you for the time you invested in applying. We will not be moving forward with your application for this position."},
    withdrawn:{subject:"Task Lane application withdrawal confirmation",body:"This email confirms that your application has been marked as withdrawn. Thank you for your interest in Task Lane Company."}
   };
   const t=templates[a.status];if(!t)return reply({ok:false,error:"Choose a review status before sending an applicant update."},400,origin);
   const key=Deno.env.get("RESEND_API_KEY");if(!key)return reply({ok:false,error:"Email service is not configured"},500,origin);
   let success=false,pid:string|null=null,err:string|null=null;
   try{const rr=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({
     from:"Task Lane Careers <careers@tasklaneco.com>",to:[a.email],subject:t.subject,
     html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1b283e"><img src="https://careers.tasklaneco.com/assets/tasklane-logo-mark.png" width="84" alt="Task Lane Company"><h1>Application update</h1><p>Hi ${safe(a.full_name)},</p><p>${safe(t.body)}</p><p><strong>Position:</strong> ${safe(a.role_title)}</p><p>— Task Lane Company Careers</p></div>`,
     text:`Hi ${a.full_name},\n\n${t.body}\n\nPosition: ${a.role_title}\n\n— Task Lane Company Careers`
   })});const j=await rr.json();success=rr.ok;pid=j?.id||null;if(!rr.ok)err=JSON.stringify(j).slice(0,1000)}catch(e){err=String(e).slice(0,1000)}
   await service.from("email_events").insert({application_id:a.id,kind:"status_"+a.status,recipient:a.email,provider_message_id:pid,success,error_message:err});
   if(!success)return reply({ok:false,error:"The email could not be sent. Check Email Events for the failed attempt."},502,origin);
   return reply({ok:true,kind:"status_"+a.status},200,origin);
 }
 return reply({ok:false,error:"Unknown action"},400,origin);
});