import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://nbjyzegfvwrmugqqcntg.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImY4YThiNmJjLTAwZmUtNDY5MC1hYWE3LTk0MzczNDkwYzJiZiJ9.eyJwcm9qZWN0SWQiOiJuYmp5emVnZnZ3cm11Z3FxY250ZyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc4MTQ3MzAzLCJleHAiOjIwOTM1MDczMDMsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.gDqB-2O5qmc1WfTW2zKrMUPI6A-7JWFWDb3Ir7heFMY';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };