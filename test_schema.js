const projectRef = "dwhwjjogtrqzovrkwisd";
const token = "sbp_0e2b8c1802181fc51497a34543cff1018e073617";
fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'workflows' 
      ORDER BY ordinal_position;
    `
  })
}).then(r => r.json()).then(data => {
  console.log("SCHEMA:", data);
}).catch(e => console.error(e));

fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: `
      SELECT polname, polcmd, polqual, polwithcheck 
      FROM pg_policy 
      WHERE polrelid = 'public.workflows'::regclass;
    `
  })
}).then(r => r.json()).then(data => {
  console.log("RLS POLICIES:", data);
}).catch(e => console.error(e));
