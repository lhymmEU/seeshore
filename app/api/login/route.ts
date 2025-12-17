import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with service role for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    switch (action) {
      case 'login': {
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return NextResponse.json(
            { success: false, message: error.message },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Login successful",
          user: data.user,
        });
      }

      case 'register': {
        // Sign up the user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm email for admin-created users
          user_metadata: { name },
        });

        if (authError) {
          return NextResponse.json(
            { success: false, message: authError.message },
            { status: 400 }
          );
        }

        if (!authData.user) {
          return NextResponse.json(
            { success: false, message: "Failed to create user" },
            { status: 400 }
          );
        }

        // Create user profile in users table
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            name: name || 'User',
            type: 'Guest',
          });

        if (profileError) {
          // If profile creation fails, we should still return success
          // as the auth user was created
          console.error('Profile creation error:', profileError);
        }

        return NextResponse.json({
          success: true,
          message: "Registration successful",
          user: authData.user,
        });
      }

      case 'check_user': {
        // Check if a user with this email exists
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
          return NextResponse.json(
            { success: false, message: error.message },
            { status: 400 }
          );
        }

        const userExists = users?.users?.some(
          (u) => u.email === email
        );

        return NextResponse.json({
          success: true,
          userExists,
        });
      }

      case 'create_owner': {
        // Admin action: Create a store owner
        // 1. Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
        });

        if (authError) {
          return NextResponse.json(
            { success: false, message: authError.message },
            { status: 400 }
          );
        }

        if (!authData.user) {
          return NextResponse.json(
            { success: false, message: "Failed to create user" },
            { status: 400 }
          );
        }

        // 2. Create user profile as Owner
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            name: name || 'Store Owner',
            type: 'Owner',
          });

        if (profileError) {
          return NextResponse.json(
            { success: false, message: profileError.message },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Store owner created",
          userId: authData.user.id,
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 }
    );
  }
}
