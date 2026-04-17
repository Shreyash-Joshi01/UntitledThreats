import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  const email = 'admin@gmail.com';
  const password = 'admin123';

  console.log(`Creating user: ${email}...`);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // bypass confirmation
  });

  if (error) {
    if (error.message.includes('already registered')) {
        console.log(`User ${email} already exists. We will ensure they are confirmed.`);
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const user = usersData.users.find(u => u.email === email);
        if (user) {
            // Update to auto-confirm if not already
             await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true, password: password });
             console.log(`User ${email} updated/confirmed.`);
        }
    } else {
        console.error("Error creating admin user:", error.message);
    }
  } else {
    console.log(`Successfully created user: ${data.user.id}`);
  }
}

createAdmin();
