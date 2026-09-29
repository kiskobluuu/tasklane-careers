import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY") || "";
const notifyEmail = Deno.env.get("NOTIFY_EMAIL") || "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const fromEmail = Deno.env.get("FROM_EMAIL") || "Task Lane Careers <onboarding@resend.dev>";
const supabase = createClient(supabaseUrl, serviceRole, {auth:{persistSession:false}});

const cors = (origin:string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
});
const json = (body:unknown, status=200, origin=allowedOrigin) => new Response(JSON.stringify(body),{status,headers:{...cors(origin),"content-type":"application/json; charset=utf-8"}});
const clean=(v:FormDataEntryValue|null,max=4000)=>String(v??"").trim().slice(0,max);

async function verifyTurnstile(token:string, ip:string|null){
  if(!turnstileSecret) return false;
  const body=new URLSearchParams({secret:turnstileSecret,response:token});
  if(ip) body.set("remoteip",ip);
  const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body});
  const data=await r.json(); return data.success===true;
}

Deno.serve(async req=>{
  const origin=req.headers.get("origin")||"";
  if(req.method==="OPTIONS") return new Response(null,{headers:cors(origin)});
  if(req.method!=="POST") return json({error:"Method not allowed"},405,origin);
  if(allowedOrigin && origin!==allowedOrigin) return json({error:"Origin not allowed"},403,origin);

  try{
    const fd=await req.formData();
    if(clean(fd.get("website"),100)) return json({ok:true},200,origin); // honeypot
    const token=clean(fd.get("cf-turnstile-response"),4000);
    const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||null;
    if(!(await verifyTurnstile(token,ip))) return json({error:"Verification failed. Please refresh and try again."},400,origin);

    const required=["role_slug","first_name","last_name","email","country","timezone","relevant_experience","role_interest","start_date","weekly_availability","assessment_method","assessment_recommendation","tool_goal","tool_strengths","tool_weakness","tool_improvement","truthfulness","privacy_consent","assessment_acknowledgement"];
    for(const k of required) if(!clean(fd.get(k))) return json({error:`Missing required field: ${k}`},400,origin);
    const email=clean(fd.get("email"),160).toLowerCase();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({error:"Invalid email address."},400,origin);
    const roleSlug=clean(fd.get("role_slug"),120);

    const since=new Date(Date.now()-60*60*1000).toISOString();
    const {data:dup}=await supabase.from("job_applications").select("id").eq("role_slug",roleSlug).eq("email",email).gte("created_at",since).limit(1);
    if(dup?.length) return json({error:"An application for this email and role was recently submitted."},409,origin);

    const id=crypto.randomUUID(); let resumePath:null|string=null;
    const resume=fd.get("resume");
    if(resume instanceof File && resume.size>0){
      if(resume.size>5*1024*1024) return json({error:"Résumé must be 5 MB or smaller."},400,origin);
      const ext=(resume.name.split(".").pop()||"").toLowerCase();
      if(!["pdf","doc","docx"].includes(ext)) return json({error:"Résumé must be PDF, DOC or DOCX."},400,origin);
      resumePath=`${roleSlug}/${id}.${ext}`;
      const {error:uploadError}=await supabase.storage.from("applicant-resumes").upload(resumePath,resume,{contentType:resume.type||"application/octet-stream",upsert:false});
      if(uploadError) throw uploadError;
    }

    const row={id,role_slug:roleSlug,first_name:clean(fd.get("first_name"),80),last_name:clean(fd.get("last_name"),80),email,phone:clean(fd.get("phone"),40)||null,country:clean(fd.get("country"),100),timezone:clean(fd.get("timezone"),50),linkedin_url:clean(fd.get("linkedin_url"),500)||null,portfolio_url:clean(fd.get("portfolio_url"),500)||null,resume_path:resumePath,relevant_experience:clean(fd.get("relevant_experience"),2000),role_interest:clean(fd.get("role_interest"),1500),start_date:clean(fd.get("start_date"),20),weekly_availability:clean(fd.get("weekly_availability"),100),availability_notes:clean(fd.get("availability_notes"),800)||null,assessment_method:clean(fd.get("assessment_method"),1800),assessment_recommendation:clean(fd.get("assessment_recommendation"),1800),tool_goal:clean(fd.get("tool_goal"),1000),tool_strengths:clean(fd.get("tool_strengths"),1200),tool_weakness:clean(fd.get("tool_weakness"),1000),tool_improvement:clean(fd.get("tool_improvement"),1000),source:clean(fd.get("source"),120)||null,utm_source:clean(fd.get("utm_source"),120)||null,utm_medium:clean(fd.get("utm_medium"),120)||null,utm_campaign:clean(fd.get("utm_campaign"),160)||null};
    const {error}=await supabase.from("job_applications").insert(row); if(error) throw error;

    if(resendApiKey&&notifyEmail){
      await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${resendApiKey}`,"Content-Type":"application/json"},body:JSON.stringify({from:fromEmail,to:[notifyEmail],subject:`New Task Lane application: ${roleSlug}`,text:`A new application was submitted by ${row.first_name} ${row.last_name} (${email}). Review it in Supabase.\n\nDo not forward applicant data unnecessarily.`})}).catch(()=>{});
    }
    return json({ok:true,id},201,origin);
  }catch(err){console.error(err);return json({error:"We could not submit the application. Please try again later."},500,origin)}
});
