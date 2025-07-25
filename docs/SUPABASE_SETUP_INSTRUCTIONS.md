# 🔗 **Supabase Connection Setup Guide**

## **Step 1: Get Your Supabase Credentials**

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (or create a new one if you don't have one)
3. **Navigate to Settings → API**
4. **Copy these two values**:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **Anon Key** (starts with `eyJhbGciOi...`)

---

## **Step 2: Create Environment File**

Create a file called `.env` in your `mobile/` directory:

```bash
# Replace with YOUR actual values from Supabase Dashboard
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Backend API (keep as-is for now)
EXPO_PUBLIC_API_URL=http://localhost:8000/api

# Auth Configuration (keep as-is)
EXPO_PUBLIC_AUTH_REDIRECT_URL=com.yourcompany.revsync://auth
EXPO_PUBLIC_PASSWORD_MIN_LENGTH=8
EXPO_PUBLIC_SESSION_TIMEOUT=60
EXPO_PUBLIC_MAX_LOGIN_ATTEMPTS=5

# Feature Flags (keep as-is)
EXPO_PUBLIC_ENABLE_BIOMETRICS=true
EXPO_PUBLIC_ENABLE_2FA=true
EXPO_PUBLIC_ENABLE_SOCIAL_LOGIN=false
EXPO_PUBLIC_ENABLE_MAGIC_LINKS=true
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_LOG_LEVEL=info
```

---

## **Step 3: Set Up Database Tables**

### **3a. Go to Supabase SQL Editor**
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**

### **3b. Create User Profiles Table**
Run this SQL command:

```sql
-- Create user profiles table for onboarding data
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Profile Info
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    date_of_birth DATE,
    
    -- Onboarding Data
    motorcycle_type TEXT,
    skill_level TEXT,
    riding_style TEXT,
    riding_experience TEXT,
    safety_tolerance TEXT,
    performance_goals JSONB DEFAULT '[]'::jsonb,
    selected_bike_data JSONB,
    
    -- Onboarding Status
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Preferences
    preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### **3c. Set Up Row Level Security (RLS)**
Run this SQL command:

```sql
-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Enable profile creation on signup
CREATE POLICY "Enable profile creation" ON user_profiles
    FOR INSERT WITH CHECK (true);
```

### **3d. Create Auto Profile Creation Function**
Run this SQL command:

```sql
-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## **Step 4: Test the Connection**

### **4a. Install Dependencies (if not already done)**
```bash
cd mobile/
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

### **4b. Test Authentication**
1. **Start your app**: `npm start`
2. **Try registering** a new account through your app
3. **Check Supabase Dashboard** → Authentication → Users
4. **Verify the user appears** in both Auth and your `user_profiles` table

---

## **Step 5: Backend Integration**

### **5a. Update Backend Environment**
In your `backend/.env` file, add your Supabase credentials:

```bash
# Supabase Configuration
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

**⚠️ Important**: Use the **Service Role Key** (not Anon Key) for backend operations!

### **5b. Install Backend Dependencies**
```bash
cd backend/
pip install supabase python-dotenv
```

---

## **Step 6: Social Authentication (Optional)**

### **6a. Google OAuth Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID for iOS/Android
4. Add client IDs to your `.env` file

### **6b. Apple OAuth Setup**
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Certificates, Identifiers & Profiles → Identifiers
3. Create App ID with Sign In with Apple capability
4. Add configuration to your `.env` file

---

## **🎯 Expected Result**

After completing these steps:

✅ **Users can register/login** through your beautiful auth screens  
✅ **Onboarding data saves** to your Supabase database  
✅ **User profiles persist** between app sessions  
✅ **Backend API calls work** with Supabase integration  
✅ **Row Level Security** protects user data  

---

## **🚨 Troubleshooting**

### **Common Issues:**

**1. "Invalid API Key" Error**
- Double-check your Supabase URL and Anon Key
- Make sure there are no extra spaces in your `.env` file

**2. "Row Level Security" Error**
- Verify the RLS policies were created correctly
- Check user is authenticated before making requests

**3. "Table doesn't exist" Error**
- Confirm you ran all the SQL commands in Step 3
- Check the table exists in Supabase → Table Editor

**4. App not reading `.env` file**
- Restart your development server: `npm start`
- Clear cache: `npm start --clear`

---

## **🎊 You're Ready!**

Once you complete these steps, your **complete Auth → Onboarding → Main App flow** will be fully functional with your live Supabase backend! 🚀

Users will be able to:
1. **Register/Login** with beautiful auth screens
2. **Complete onboarding** with motorcycle preferences  
3. **Have data saved** to your Supabase database
4. **Access the main app** with persistent sessions

**Your RevSync app will be production-ready!** ✨ 