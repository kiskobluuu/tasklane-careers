window.TASKLANE_CONFIG = {
  staging: true,
  company: {
    name: "Task Lane Company",
    legalName: "Task Lane Company",
    website: "https://tasklaneco.com",
    careersSite: "https://careers.tasklaneco.com",
    careersEmail: "tasklaneco@gmail.com",
    privacyEmail: "tasklaneco@gmail.com",
    location: "Remote"
  },
  roles: {
    "research-operations-coordinator": {
      slug: "research-operations-coordinator",
      title: "Research Operations Coordinator",
      summary: "Coordinate Task Lane research workflows, monitor task activity, and help maintain consistent, useful participant feedback.",
      location: "Remote",
      type: "Part-Time • 3-Month Contract",
      compensation: "$24/hour",
      schedule: "Approx. 20–24 hours/week",
      responsibilities: [
        "Monitor research-task activity and workflow progress.",
        "Review participant feedback for completeness, relevance, and overall quality.",
        "Organize research workflows and help keep task activity moving on schedule.",
        "Apply documented evaluation standards consistently and flag issues that need review."
      ],
      qualifications: [
        "Strong written communication and attention to detail.",
        "Comfort working independently in digital tools and structured online workflows.",
        "Ability to evaluate written feedback objectively and follow documented criteria.",
        "Reliable availability for approximately 20–24 hours per week during the contract period."
      ],
      niceToHave: [
        "Experience with research operations, surveys, moderation, quality review, or customer/participant feedback.",
        "Experience coordinating recurring online tasks or distributed contributors."
      ]
    },
    "quality-compliance-specialist": {
      slug: "quality-compliance-specialist",
      title: "Quality & Compliance Specialist",
      summary: "Review Task Lane activity for quality, unusual submission patterns, and adherence to task and platform standards.",
      location: "Remote",
      type: "Part-Time • 3-Month Contract",
      compensation: "$27/hour",
      schedule: "Approx. 20–24 hours/week",
      responsibilities: [
        "Review task and participant activity against Task Lane quality standards.",
        "Identify low-quality, inconsistent, duplicate, or unusual submission patterns for further review.",
        "Apply documented policy and compliance requirements consistently.",
        "Record findings clearly and escalate material quality or policy issues to operations."
      ],
      qualifications: [
        "Excellent attention to detail and sound judgment when applying written standards.",
        "Clear, concise written documentation skills.",
        "Comfort reviewing repetitive data or submissions while maintaining consistency.",
        "Reliable availability for approximately 20–24 hours per week during the contract period."
      ],
      niceToHave: [
        "Previous quality assurance, trust & safety, moderation, compliance, audit, or operations-review experience.",
        "Experience identifying patterns or anomalies in high-volume online activity."
      ]
    },
    "partner-task-operations-manager": {
      slug: "partner-task-operations-manager",
      title: "Partner & Task Operations Manager",
      summary: "Coordinate partner relationships and oversee task inventory, performance, issue resolution, and day-to-day task operations.",
      location: "Remote",
      type: "Part-Time • 3-Month Contract",
      compensation: "$33/hour",
      schedule: "Approx. 20–24 hours/week",
      responsibilities: [
        "Manage day-to-day communication and operational coordination with Task Lane providers and partners.",
        "Monitor task inventory, availability, and performance across active workflows.",
        "Investigate provider or task-operation issues and coordinate practical resolutions.",
        "Keep task operations organized, documented, and aligned with Task Lane quality requirements."
      ],
      qualifications: [
        "Strong operational organization, prioritization, and written communication skills.",
        "Ability to coordinate multiple partner or workflow issues without losing detail.",
        "Comfort making practical decisions from performance information and documented standards.",
        "Reliable availability for approximately 20–24 hours per week during the contract period."
      ],
      niceToHave: [
        "Experience in partner operations, marketplace operations, vendor management, account coordination, or digital-platform operations.",
        "Experience working with task inventory, performance reporting, or issue escalation."
      ]
    }
  },
  hiringProcess: [
    "Application",
    "Initial Review",
    "Paid Qualification Evaluation",
    "Final Selection",
    "3-Month Contract"
  ],
  application: {
    endpoint: "https://YOUR_SUPABASE_PROJECT.functions.supabase.co/submit-application",
    maxResumeMb: 5,
    acceptedResumeTypes: [".pdf", ".doc", ".docx"],
    retentionDays: 180,
    requireResume: false,
    turnstileSiteKey: "YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY",
    alternativeAssessmentEmail: "tasklaneco@gmail.com"
  },
  assessmentPartner: {
    enabled: false,
    merchantApprovedApplicantTraffic: false,
    name: "FreshBooks",
    category: "Business management and accounting software",
    compensatedUrl: "PASTE_MERCHANT_APPROVED_AFFILIATE_LINK_HERE",
    directUrl: "https://www.freshbooks.com/",
    noPurchaseRequired: true,
    disclosure: "Task Lane Company may receive compensation if you choose the partner link. Using it is optional, costs you nothing extra, and has no effect on your application. A direct non-affiliate route is provided beside it.",
    instruction: "Explore only the free product experience to the extent you are comfortable. Do not enter payment information. You may instead use the direct link or request the equivalent no-account assessment."
  },
  postSubmissionResources: []
};
