#!/usr/bin/env python
"""
Quick runner script to expand the motorcycle database
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revsync.settings')
django.setup()

from django.core.management import call_command

def main():
    """Run the comprehensive motorcycle database expansion"""
    print("🏍️  Starting comprehensive motorcycle database expansion...")
    print("This will add 500+ popular motorcycle models from 2015-2024")
    print("Ensuring users can find their specific bikes!")
    print()
    
    try:
        # Run the expansion command
        call_command('populate_comprehensive_bikes')
        
        print()
        print("✅ Database expansion completed successfully!")
        print("Your RevSync platform now has comprehensive motorcycle coverage!")
        print()
        print("📊 Coverage includes:")
        print("  - All major manufacturers (Yamaha, Honda, Kawasaki, Suzuki, Ducati, BMW, KTM, etc.)")
        print("  - Popular models from 2015-2024")
        print("  - Multiple engine sizes and variants")
        print("  - Budget-friendly and premium bikes")
        print("  - Scooters and electric motorcycles")
        print("  - Regional variants and special editions")
        print()
        print("🎯 Result: Nearly guaranteed bike coverage for all users!")
        
    except Exception as e:
        print(f"❌ Error during expansion: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 