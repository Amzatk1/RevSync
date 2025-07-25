# 🧪 **Testing Your Supabase Connection**

Once you've completed the setup in `SUPABASE_SETUP_INSTRUCTIONS.md`, follow these steps to test that everything is working:

## **Step 1: Check Configuration**

Look for these console messages when you start your app:

### ✅ **Correct Configuration**
```
✅ Initializing Supabase with URL: https://your-project-id.supabase.co
✅ Initializing auth with Supabase...
```

### ❌ **Missing Configuration**
```
❌ Missing Supabase configuration!
Please check your .env file has:
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## **Step 2: Test User Registration**

1. **Start your app**: `npm start`
2. **Navigate to Register screen**
3. **Fill out the form**:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPassword123
4. **Tap "Create Account"**

### ✅ **Success Indicators**
```
📝 Attempting sign up for: test@example.com
✅ Sign up successful for user: 12345678-1234-1234-1234-123456789012
```

### ❌ **Configuration Error**
```
❌ Sign up error: Invalid API key
```
*Fix: Double-check your Supabase URL and Anon Key*

---

## **Step 3: Verify in Supabase Dashboard**

1. **Go to your Supabase Dashboard**
2. **Check Authentication → Users**
   - You should see your test user listed
3. **Check Table Editor → user_profiles**
   - You should see a profile created for your user

---

## **Step 4: Test Onboarding Flow**

After successful registration:

1. **Complete the onboarding steps**
2. **Fill out motorcycle preferences**
3. **Tap "Complete Onboarding"**

### ✅ **Success Indicators**
```
✅ Onboarding data saved successfully
✅ User redirected to main app
```

### ✅ **Database Verification**
In Supabase Table Editor → user_profiles, you should see:
- `onboarding_completed: true`
- `motorcycle_type: "sport"` (or whatever you selected)
- `skill_level: "intermediate"` (or whatever you selected)
- Other onboarding data populated

---

## **Step 5: Test Login Flow**

1. **Sign out from the app**
2. **Navigate to Login screen**
3. **Enter your test credentials**
4. **Tap "Sign In"**

### ✅ **Success Indicators**
```
🔐 Attempting sign in for: test@example.com
✅ Sign in successful for user: 12345678-1234-1234-1234-123456789012
ℹ️ No existing session found (first time)
✅ Restored existing session (subsequent times)
```

---

## **🚨 Common Issues & Solutions**

### **"Invalid API Key" Error**
**Problem**: Wrong Supabase credentials
**Solution**: 
1. Go to Supabase Dashboard → Settings → API
2. Copy the correct URL and Anon Key
3. Update your `.env` file
4. Restart your app: `npm start --clear`

### **"Row Level Security" Error**
**Problem**: Database policies not set up correctly
**Solution**: 
1. Go to Supabase SQL Editor
2. Re-run the RLS policies from the setup guide
3. Verify policies exist in Database → Policies

### **"Table 'user_profiles' doesn't exist"**
**Problem**: Database table not created
**Solution**:
1. Go to Supabase SQL Editor
2. Run the table creation SQL from the setup guide
3. Verify table exists in Table Editor

### **Environment Variables Not Loading**
**Problem**: `.env` file not being read
**Solution**:
1. Ensure `.env` file is in the `mobile/` directory
2. Restart development server: `npm start --clear`
3. Check for typos in environment variable names

---

## **🎯 Expected Final Result**

When everything is working correctly:

✅ **User Registration** → Creates user in Supabase Auth + user_profiles table  
✅ **Onboarding** → Saves motorcycle data to user_profiles table  
✅ **Login** → Retrieves user data and shows onboarding completion status  
✅ **Navigation** → Users with completed onboarding go to main app  
✅ **Session Persistence** → Users stay logged in between app restarts  

---

## **🎊 Success!**

Once all tests pass, your **Auth → Onboarding → Main App** flow is fully connected to your live Supabase backend! 

Your app is now **production-ready** with:
- **Real user authentication**
- **Persistent user data** 
- **Secure database operations**
- **Beautiful user experience**

🚀 **Ready for your users!** ✨ 