#!/usr/bin/env python
"""
Comprehensive database population script for RevSync
Populates motorcycle and tune databases with realistic data
"""

import os
import sys
import django
from django.contrib.auth.models import User
from decimal import Decimal
from datetime import datetime, date, timedelta
import random

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'revsync.settings')
django.setup()

from bikes.models import (
    Manufacturer, EngineType, BikeCategory, Motorcycle, ECUType,
    MotorcycleECU, BikeSpecification, BikeImage, BikeReview
)
from tunes.models import (
    TuneCategory, TuneType, SafetyRating, TuneCreator, Tune,
    TuneCompatibility, TuneReview, TuneCollection, TuneCollectionItem
)


def create_manufacturers():
    """Create motorcycle manufacturers"""
    manufacturers_data = [
        {"name": "Yamaha", "country": "Japan", "founded_year": 1955, "website": "https://yamaha-motor.com"},
        {"name": "Honda", "country": "Japan", "founded_year": 1946, "website": "https://honda.com"},
        {"name": "Kawasaki", "country": "Japan", "founded_year": 1896, "website": "https://kawasaki.com"},
        {"name": "Suzuki", "country": "Japan", "founded_year": 1909, "website": "https://suzuki.com"},
        {"name": "Ducati", "country": "Italy", "founded_year": 1926, "website": "https://ducati.com"},
        {"name": "BMW", "country": "Germany", "founded_year": 1916, "website": "https://bmw-motorrad.com"},
        {"name": "KTM", "country": "Austria", "founded_year": 1934, "website": "https://ktm.com"},
        {"name": "Aprilia", "country": "Italy", "founded_year": 1945, "website": "https://aprilia.com"},
        {"name": "Triumph", "country": "United Kingdom", "founded_year": 1902, "website": "https://triumph.co.uk"},
        {"name": "Harley-Davidson", "country": "United States", "founded_year": 1903, "website": "https://harley-davidson.com"},
        {"name": "Indian Motorcycle", "country": "United States", "founded_year": 1901, "website": "https://indianmotorcycle.com"},
        {"name": "Moto Guzzi", "country": "Italy", "founded_year": 1921, "website": "https://motoguzzi.com"},
        {"name": "MV Agusta", "country": "Italy", "founded_year": 1945, "website": "https://mvagusta.com"},
        {"name": "Zero Motorcycles", "country": "United States", "founded_year": 2006, "website": "https://zeromotorcycles.com"},
        {"name": "Energica", "country": "Italy", "founded_year": 2014, "website": "https://energicamotor.com"},
    ]
    
    manufacturers = []
    for data in manufacturers_data:
        manufacturer, created = Manufacturer.objects.get_or_create(
            name=data["name"],
            defaults=data
        )
        manufacturers.append(manufacturer)
        if created:
            print(f"Created manufacturer: {manufacturer.name}")
    
    return manufacturers


def create_engine_types():
    """Create engine type configurations"""
    engine_types_data = [
        {"name": "Parallel Twin 270°", "configuration": "parallel_twin", "cooling_system": "liquid", "fuel_system": "fuel_injection"},
        {"name": "Inline Four DOHC", "configuration": "inline_four", "cooling_system": "liquid", "fuel_system": "fuel_injection"},
        {"name": "V-Twin 90° Desmo", "configuration": "v_twin", "cooling_system": "liquid", "fuel_system": "fuel_injection"},
        {"name": "Single Cylinder SOHC", "configuration": "single", "cooling_system": "air", "fuel_system": "fuel_injection"},
        {"name": "Inline Three Crossplane", "configuration": "inline_three", "cooling_system": "liquid", "fuel_system": "fuel_injection"},
        {"name": "Boxer Twin", "configuration": "boxer", "cooling_system": "air", "fuel_system": "fuel_injection"},
        {"name": "V-Four 90°", "configuration": "v_four", "cooling_system": "liquid", "fuel_system": "fuel_injection"},
        {"name": "Inline Six", "configuration": "inline_six", "cooling_system": "liquid", "fuel_system": "fuel_injection"},
        {"name": "V-Twin 45° Air-Cooled", "configuration": "v_twin", "cooling_system": "air", "fuel_system": "fuel_injection"},
        {"name": "Single Cylinder Liquid", "configuration": "single", "cooling_system": "liquid", "fuel_system": "fuel_injection"},
    ]
    
    engine_types = []
    for data in engine_types_data:
        engine_type, created = EngineType.objects.get_or_create(
            name=data["name"],
            defaults=data
        )
        engine_types.append(engine_type)
        if created:
            print(f"Created engine type: {engine_type.name}")
    
    return engine_types


def create_bike_categories():
    """Create motorcycle categories"""
    categories = [
        'sport', 'supersport', 'naked', 'touring', 'cruiser', 'adventure',
        'dual_sport', 'dirt_bike', 'scooter', 'electric', 'cafe_racer'
    ]
    
    bike_categories = []
    for category in categories:
        bike_category, created = BikeCategory.objects.get_or_create(name=category)
        bike_categories.append(bike_category)
        if created:
            print(f"Created bike category: {bike_category.get_name_display()}")
    
    return bike_categories


def create_ecu_types():
    """Create ECU types for different motorcycles"""
    ecu_types_data = [
        {
            "name": "ME17.9.21", "manufacturer": "Bosch", "version": "2.1",
            "processor": "TriCore TC1782", "memory_kb": 2048, "flash_memory_kb": 4096,
            "communication_protocol": "can", "supported_formats": ["bin", "hex"],
            "is_tunable": True, "requires_cable": True
        },
        {
            "name": "IAW-5AM", "manufacturer": "Magneti Marelli", "version": "1.0",
            "processor": "ST10F269", "memory_kb": 1024, "flash_memory_kb": 2048,
            "communication_protocol": "kline", "supported_formats": ["bin", "ecu"],
            "is_tunable": True, "requires_cable": True
        },
        {
            "name": "Synerject", "manufacturer": "Continental", "version": "3.2",
            "processor": "MPC5554", "memory_kb": 1536, "flash_memory_kb": 3072,
            "communication_protocol": "can", "supported_formats": ["bin", "hex", "map"],
            "is_tunable": True, "requires_cable": False, "supports_obd": True
        },
        {
            "name": "Keihin PGM-FI", "manufacturer": "Keihin", "version": "4.1",
            "processor": "Renesas SH7058", "memory_kb": 512, "flash_memory_kb": 1024,
            "communication_protocol": "kline", "supported_formats": ["bin"],
            "is_tunable": True, "requires_cable": True
        },
        {
            "name": "Mikuni EFI", "manufacturer": "Mikuni", "version": "2.0",
            "processor": "Hitachi SH7055", "memory_kb": 768, "flash_memory_kb": 1536,
            "communication_protocol": "can", "supported_formats": ["bin", "hex"],
            "is_tunable": True, "requires_cable": True
        },
    ]
    
    ecu_types = []
    for data in ecu_types_data:
        ecu_type, created = ECUType.objects.get_or_create(
            name=data["name"],
            manufacturer=data["manufacturer"],
            defaults=data
        )
        ecu_types.append(ecu_type)
        if created:
            print(f"Created ECU type: {ecu_type}")
    
    return ecu_types


def create_motorcycles(manufacturers, categories, engine_types):
    """Create comprehensive motorcycle database"""
    motorcycles_data = [
        # Yamaha motorcycles
        {
            "manufacturer": "Yamaha", "model_name": "YZF-R1", "year": 2023, "category": "supersport",
            "displacement_cc": 998, "cylinders": 4, "max_power_hp": 200, "max_torque_nm": 113,
            "dry_weight_kg": 199, "seat_height_mm": 855, "fuel_capacity_liters": 17.0,
            "top_speed_kmh": 299, "acceleration_0_100_seconds": 3.0, "msrp_usd": 17399,
            "abs": True, "traction_control": True, "riding_modes": True, "quickshifter": True,
            "description": "The ultimate supersport machine with MotoGP-derived technology"
        },
        {
            "manufacturer": "Yamaha", "model_name": "MT-09", "year": 2023, "category": "naked",
            "displacement_cc": 889, "cylinders": 3, "max_power_hp": 117, "max_torque_nm": 93,
            "dry_weight_kg": 189, "seat_height_mm": 825, "fuel_capacity_liters": 14.0,
            "top_speed_kmh": 241, "acceleration_0_100_seconds": 3.1, "msrp_usd": 9699,
            "abs": True, "traction_control": True, "riding_modes": True,
            "description": "Agile naked bike with crossplane triple engine"
        },
        {
            "manufacturer": "Yamaha", "model_name": "Tenere 700", "year": 2023, "category": "adventure",
            "displacement_cc": 689, "cylinders": 2, "max_power_hp": 72, "max_torque_nm": 68,
            "dry_weight_kg": 205, "seat_height_mm": 880, "fuel_capacity_liters": 16.0,
            "top_speed_kmh": 180, "msrp_usd": 10199,
            "abs": True, "description": "Adventure touring bike built for exploration"
        },
        
        # Honda motorcycles
        {
            "manufacturer": "Honda", "model_name": "CBR1000RR-R", "year": 2023, "category": "supersport",
            "displacement_cc": 999, "cylinders": 4, "max_power_hp": 217, "max_torque_nm": 113,
            "dry_weight_kg": 201, "seat_height_mm": 830, "fuel_capacity_liters": 16.1,
            "top_speed_kmh": 299, "acceleration_0_100_seconds": 2.9, "msrp_usd": 28500,
            "abs": True, "traction_control": True, "riding_modes": True, "quickshifter": True,
            "description": "Honda's flagship superbike with RC213V-S derived technology"
        },
        {
            "manufacturer": "Honda", "model_name": "CB650R", "year": 2023, "category": "naked",
            "displacement_cc": 649, "cylinders": 4, "max_power_hp": 95, "max_torque_nm": 64,
            "dry_weight_kg": 189, "seat_height_mm": 810, "fuel_capacity_liters": 15.4,
            "top_speed_kmh": 200, "msrp_usd": 8999,
            "abs": True, "description": "Neo-sports cafe with inline-four power"
        },
        
        # Kawasaki motorcycles
        {
            "manufacturer": "Kawasaki", "model_name": "ZX-10R", "year": 2023, "category": "supersport",
            "displacement_cc": 998, "cylinders": 4, "max_power_hp": 203, "max_torque_nm": 115,
            "dry_weight_kg": 206, "seat_height_mm": 835, "fuel_capacity_liters": 17.0,
            "top_speed_kmh": 299, "acceleration_0_100_seconds": 2.9, "msrp_usd": 16999,
            "abs": True, "traction_control": True, "riding_modes": True, "quickshifter": True,
            "description": "Track-focused superbike with advanced electronics"
        },
        {
            "manufacturer": "Kawasaki", "model_name": "Z900", "year": 2023, "category": "naked",
            "displacement_cc": 948, "cylinders": 4, "max_power_hp": 125, "max_torque_nm": 98,
            "dry_weight_kg": 212, "seat_height_mm": 795, "fuel_capacity_liters": 17.0,
            "top_speed_kmh": 230, "msrp_usd": 8999,
            "abs": True, "traction_control": True, "description": "Refined naked with supernaked performance"
        },
        
        # Ducati motorcycles
        {
            "manufacturer": "Ducati", "model_name": "Panigale V4S", "year": 2023, "category": "supersport",
            "displacement_cc": 1103, "cylinders": 4, "max_power_hp": 214, "max_torque_nm": 124,
            "dry_weight_kg": 195, "seat_height_mm": 830, "fuel_capacity_liters": 16.0,
            "top_speed_kmh": 299, "acceleration_0_100_seconds": 2.8, "msrp_usd": 28395,
            "abs": True, "traction_control": True, "riding_modes": True, "quickshifter": True,
            "electronic_suspension": True, "description": "MotoGP-derived V4 superbike masterpiece"
        },
        {
            "manufacturer": "Ducati", "model_name": "Monster 937", "year": 2023, "category": "naked",
            "displacement_cc": 937, "cylinders": 2, "max_power_hp": 111, "max_torque_nm": 93,
            "dry_weight_kg": 188, "seat_height_mm": 775, "fuel_capacity_liters": 14.0,
            "top_speed_kmh": 225, "msrp_usd": 11995,
            "abs": True, "traction_control": True, "riding_modes": True,
            "description": "Iconic naked bike with Testastretta L-twin power"
        },
        
        # BMW motorcycles
        {
            "manufacturer": "BMW", "model_name": "S1000RR", "year": 2023, "category": "supersport",
            "displacement_cc": 999, "cylinders": 4, "max_power_hp": 205, "max_torque_nm": 113,
            "dry_weight_kg": 197, "seat_height_mm": 824, "fuel_capacity_liters": 16.5,
            "top_speed_kmh": 299, "acceleration_0_100_seconds": 2.9, "msrp_usd": 17295,
            "abs": True, "traction_control": True, "riding_modes": True, "quickshifter": True,
            "description": "German precision engineering in superbike form"
        },
        {
            "manufacturer": "BMW", "model_name": "R1250GS", "year": 2023, "category": "adventure",
            "displacement_cc": 1254, "cylinders": 2, "max_power_hp": 136, "max_torque_nm": 143,
            "dry_weight_kg": 249, "seat_height_mm": 850, "fuel_capacity_liters": 20.0,
            "top_speed_kmh": 200, "msrp_usd": 17295,
            "abs": True, "traction_control": True, "riding_modes": True,
            "description": "The ultimate adventure touring motorcycle"
        },
        
        # KTM motorcycles
        {
            "manufacturer": "KTM", "model_name": "1290 Super Duke R", "year": 2023, "category": "naked",
            "displacement_cc": 1301, "cylinders": 2, "max_power_hp": 180, "max_torque_nm": 140,
            "dry_weight_kg": 189, "seat_height_mm": 835, "fuel_capacity_liters": 16.0,
            "top_speed_kmh": 270, "acceleration_0_100_seconds": 2.8, "msrp_usd": 18999,
            "abs": True, "traction_control": True, "riding_modes": True, "quickshifter": True,
            "description": "The Beast - ultimate naked bike with LC8 V-twin power"
        },
        
        # Harley-Davidson motorcycles
        {
            "manufacturer": "Harley-Davidson", "model_name": "Fat Bob", "year": 2023, "category": "cruiser",
            "displacement_cc": 1868, "cylinders": 2, "max_power_hp": 93, "max_torque_nm": 155,
            "dry_weight_kg": 299, "seat_height_mm": 675, "fuel_capacity_liters": 13.2,
            "top_speed_kmh": 180, "msrp_usd": 18999,
            "abs": True, "traction_control": True,
            "description": "American cruiser with Milwaukee-Eight 114 power"
        },
        
        # Electric motorcycles
        {
            "manufacturer": "Zero Motorcycles", "model_name": "SR/F", "year": 2023, "category": "electric",
            "displacement_cc": 0, "cylinders": 0, "max_power_hp": 110, "max_torque_nm": 190,
            "dry_weight_kg": 220, "seat_height_mm": 787, "fuel_capacity_liters": 0,
            "top_speed_kmh": 200, "acceleration_0_100_seconds": 3.0, "msrp_usd": 19995,
            "abs": True, "traction_control": True, "riding_modes": True,
            "description": "Premium electric motorcycle with instant torque"
        },
    ]
    
    motorcycles = []
    category_map = {cat.name: cat for cat in categories}
    manufacturer_map = {man.name: man for man in manufacturers}
    
    for data in motorcycles_data:
        manufacturer = manufacturer_map[data.pop("manufacturer")]
        category = category_map[data.pop("category")]
        
        motorcycle, created = Motorcycle.objects.get_or_create(
            manufacturer=manufacturer,
            model_name=data["model_name"],
            year=data["year"],
            defaults={**data, "category": category}
        )
        motorcycles.append(motorcycle)
        if created:
            print(f"Created motorcycle: {motorcycle}")
    
    return motorcycles


def create_tune_data():
    """Create tune-related data"""
    # Create tune categories
    tune_categories = []
    categories = ['performance', 'economy', 'racing', 'track', 'street', 'touring', 'custom']
    for category in categories:
        tune_category, created = TuneCategory.objects.get_or_create(name=category)
        tune_categories.append(tune_category)
        if created:
            print(f"Created tune category: {tune_category}")
    
    # Create tune types
    tune_types = []
    types = ['flash', 'piggyback', 'fuel_controller', 'ignition_map', 'full_system']
    for tune_type in types:
        tune_type_obj, created = TuneType.objects.get_or_create(name=tune_type)
        tune_types.append(tune_type_obj)
        if created:
            print(f"Created tune type: {tune_type_obj}")
    
    # Create safety ratings
    safety_ratings_data = [
        {
            "level": "LOW",
            "description": "Minimal risk with conservative tuning parameters",
            "color_code": "#28a745",
            "warning_text": "This tune has been tested and verified safe for street use.",
            "requires_consent": False,
            "max_downloads": 5
        },
        {
            "level": "MEDIUM",
            "description": "Moderate risk with enhanced performance parameters",
            "color_code": "#ffc107",
            "warning_text": "This tune modifies engine parameters. Use with caution.",
            "requires_consent": True,
            "max_downloads": 3
        },
        {
            "level": "HIGH",
            "description": "High risk with aggressive tuning for experienced users",
            "color_code": "#fd7e14",
            "warning_text": "This tune significantly modifies engine behavior. Professional installation recommended.",
            "requires_consent": True,
            "max_downloads": 2
        },
        {
            "level": "CRITICAL",
            "description": "Extreme modifications for track use only",
            "color_code": "#dc3545",
            "warning_text": "WARNING: Track use only. May void warranty and damage engine.",
            "requires_consent": True,
            "max_downloads": 1
        }
    ]
    
    safety_ratings = []
    for data in safety_ratings_data:
        safety_rating, created = SafetyRating.objects.get_or_create(
            level=data["level"],
            defaults=data
        )
        safety_ratings.append(safety_rating)
        if created:
            print(f"Created safety rating: {safety_rating}")
    
    return tune_categories, tune_types, safety_ratings


def create_tune_creators():
    """Create sample tune creators"""
    creators_data = [
        {
            "username": "dyno_master",
            "email": "dyno@revsync.com",
            "business_name": "DynoMaster Tuning",
            "bio": "Professional motorcycle tuner with 15+ years experience",
            "specialties": ["Sport bikes", "Track tuning", "Dyno testing"],
            "experience_years": 15,
            "is_verified": True,
            "verification_level": "expert"
        },
        {
            "username": "speed_demon_tunes",
            "email": "speed@revsync.com",
            "business_name": "Speed Demon Performance",
            "bio": "Specializing in maximum performance street tunes",
            "specialties": ["Street performance", "Yamaha", "Kawasaki"],
            "experience_years": 8,
            "is_verified": True,
            "verification_level": "professional"
        },
        {
            "username": "euro_tuner",
            "email": "euro@revsync.com",
            "business_name": "European Precision Tuning",
            "bio": "Expert in European motorcycle tuning and optimization",
            "specialties": ["Ducati", "BMW", "Aprilia", "European bikes"],
            "experience_years": 12,
            "is_verified": True,
            "verification_level": "expert"
        },
        {
            "username": "track_specialist",
            "email": "track@revsync.com",
            "business_name": "Track Day Solutions",
            "bio": "Track-focused tuning for maximum performance",
            "specialties": ["Track tuning", "Racing", "Performance optimization"],
            "experience_years": 10,
            "is_verified": True,
            "verification_level": "professional"
        },
        {
            "username": "green_tuner",
            "email": "green@revsync.com",
            "business_name": "Eco Performance",
            "bio": "Fuel economy focused tuning without sacrificing performance",
            "specialties": ["Fuel economy", "Touring", "Commuter bikes"],
            "experience_years": 6,
            "is_verified": True,
            "verification_level": "professional"
        }
    ]
    
    creators = []
    for data in creators_data:
        user_data = {
            "username": data["username"],
            "email": data["email"],
            "password": "defaultpass123"
        }
        
        user, created = User.objects.get_or_create(
            username=data["username"],
            defaults=user_data
        )
        
        if created:
            user.set_password("defaultpass123")
            user.save()
        
        creator_data = {k: v for k, v in data.items() if k not in ["username", "email"]}
        creator, created = TuneCreator.objects.get_or_create(
            user=user,
            defaults=creator_data
        )
        creators.append(creator)
        if created:
            print(f"Created tune creator: {creator}")
    
    return creators


def create_sample_tunes(creators, tune_categories, tune_types, safety_ratings, motorcycles):
    """Create sample tunes"""
    tunes_data = [
        {
            "name": "Stage 1 Performance Flash",
            "version": "2.1",
            "description": "Professional stage 1 tune with optimized fuel and ignition maps for maximum power and torque gains while maintaining reliability.",
            "short_description": "Stage 1 performance tune with +15HP, +10Nm gains",
            "creator": creators[0],  # dyno_master
            "category": tune_categories[0],  # performance
            "tune_type": tune_types[0],  # flash
            "safety_rating": safety_ratings[1],  # MEDIUM
            "power_gain_hp": 15,
            "power_gain_percentage": Decimal("8.5"),
            "torque_gain_nm": 10,
            "torque_gain_percentage": Decimal("9.2"),
            "fuel_economy_change_percentage": Decimal("-2.5"),
            "price": Decimal("299.99"),
            "tags": ["stage1", "performance", "street", "reliable"],
            "dyno_tested": True,
            "street_legal": True,
            "status": "approved",
            "is_featured": True
        },
        {
            "name": "Track Day Special",
            "version": "1.5",
            "description": "Aggressive track-focused tune with raised rev limit, optimized for maximum performance on the track. Includes launch control and advanced traction settings.",
            "short_description": "Track-only tune with +25HP, launch control, raised rev limit",
            "creator": creators[3],  # track_specialist
            "category": tune_categories[3],  # track
            "tune_type": tune_types[0],  # flash
            "safety_rating": safety_ratings[2],  # HIGH
            "power_gain_hp": 25,
            "power_gain_percentage": Decimal("14.2"),
            "torque_gain_nm": 18,
            "torque_gain_percentage": Decimal("15.8"),
            "rev_limit_change": 500,
            "speed_limiter_removed": True,
            "price": Decimal("499.99"),
            "tags": ["track", "racing", "aggressive", "launch_control"],
            "dyno_tested": True,
            "street_legal": False,
            "is_track_only": True,
            "requires_premium_fuel": True,
            "status": "approved",
            "is_featured": True
        },
        {
            "name": "Eco Touring Optimization",
            "version": "1.2",
            "description": "Fuel economy focused tune that optimizes combustion efficiency for long-distance touring while maintaining smooth power delivery.",
            "short_description": "Eco-friendly tune with improved fuel economy and smooth power",
            "creator": creators[4],  # green_tuner
            "category": tune_categories[5],  # touring
            "tune_type": tune_types[0],  # flash
            "safety_rating": safety_ratings[0],  # LOW
            "power_gain_hp": 5,
            "power_gain_percentage": Decimal("3.2"),
            "torque_gain_nm": 8,
            "torque_gain_percentage": Decimal("6.1"),
            "fuel_economy_change_percentage": Decimal("12.5"),
            "price": Decimal("199.99"),
            "tags": ["eco", "touring", "fuel_economy", "smooth"],
            "dyno_tested": True,
            "street_legal": True,
            "status": "approved"
        },
        {
            "name": "Ducati V4 Race Flash",
            "version": "3.0",
            "description": "Specialized tune for Ducati V4 engines with Desmodronic valve optimization and advanced electronics integration.",
            "short_description": "Ducati V4 specific race tune with desmo optimization",
            "creator": creators[2],  # euro_tuner
            "category": tune_categories[2],  # racing
            "tune_type": tune_types[0],  # flash
            "safety_rating": safety_ratings[3],  # CRITICAL
            "power_gain_hp": 35,
            "power_gain_percentage": Decimal("18.5"),
            "torque_gain_nm": 25,
            "torque_gain_percentage": Decimal("20.2"),
            "rev_limit_change": 750,
            "speed_limiter_removed": True,
            "price": Decimal("799.99"),
            "tags": ["ducati", "v4", "racing", "desmo", "professional"],
            "dyno_tested": True,
            "street_legal": False,
            "is_track_only": True,
            "is_race_fuel_required": True,
            "status": "approved",
            "is_featured": True
        },
        {
            "name": "QuickShifter Pro",
            "version": "2.0",
            "description": "Advanced quickshifter calibration for seamless gear changes with clutchless upshifts and downshifts.",
            "short_description": "Professional quickshifter calibration for seamless shifts",
            "creator": creators[1],  # speed_demon_tunes
            "category": tune_categories[0],  # performance
            "tune_type": tune_types[3],  # ignition_map
            "safety_rating": safety_ratings[1],  # MEDIUM
            "power_gain_hp": 2,
            "power_gain_percentage": Decimal("1.2"),
            "price": Decimal("149.99"),
            "tags": ["quickshift", "transmission", "smooth", "sport"],
            "dyno_tested": False,
            "street_legal": True,
            "status": "approved"
        }
    ]
    
    tunes = []
    for data in tunes_data:
        # Set published date for approved tunes
        if data.get("status") == "approved":
            data["published_at"] = datetime.now() - timedelta(days=random.randint(1, 30))
        
        tune, created = Tune.objects.get_or_create(
            name=data["name"],
            creator=data["creator"],
            defaults=data
        )
        tunes.append(tune)
        if created:
            print(f"Created tune: {tune}")
    
    return tunes


def create_tune_collections(tunes):
    """Create featured tune collections"""
    # Create a staff user for collections
    staff_user, created = User.objects.get_or_create(
        username="admin",
        defaults={
            "email": "admin@revsync.com",
            "is_staff": True,
            "is_superuser": True
        }
    )
    if created:
        staff_user.set_password("admin123")
        staff_user.save()
    
    collections_data = [
        {
            "name": "Featured Performance Tunes",
            "description": "Hand-picked performance tunes from verified creators",
            "collection_type": "featured",
            "is_featured": True,
            "display_order": 1
        },
        {
            "name": "Track Day Essentials",
            "description": "Everything you need for track day domination",
            "collection_type": "performance",
            "is_featured": True,
            "display_order": 2
        },
        {
            "name": "Eco-Friendly Tunes",
            "description": "Fuel-efficient tunes for conscious riders",
            "collection_type": "category",
            "is_featured": False,
            "display_order": 3
        }
    ]
    
    collections = []
    for data in collections_data:
        collection, created = TuneCollection.objects.get_or_create(
            name=data["name"],
            defaults={**data, "created_by": staff_user}
        )
        collections.append(collection)
        if created:
            print(f"Created tune collection: {collection}")
    
    # Add tunes to collections
    featured_tunes = [t for t in tunes if t.is_featured]
    track_tunes = [t for t in tunes if t.is_track_only]
    eco_tunes = [t for t in tunes if "eco" in t.tags]
    
    # Add to Featured Performance Tunes
    for i, tune in enumerate(featured_tunes[:3]):
        TuneCollectionItem.objects.get_or_create(
            collection=collections[0],
            tune=tune,
            defaults={"order": i + 1}
        )
    
    # Add to Track Day Essentials
    for i, tune in enumerate(track_tunes[:2]):
        TuneCollectionItem.objects.get_or_create(
            collection=collections[1],
            tune=tune,
            defaults={"order": i + 1}
        )
    
    # Add to Eco-Friendly Tunes
    for i, tune in enumerate(eco_tunes[:2]):
        TuneCollectionItem.objects.get_or_create(
            collection=collections[2],
            tune=tune,
            defaults={"order": i + 1}
        )
    
    return collections


def main():
    """Main population function"""
    print("Starting database population...")
    
    try:
        # Create basic data
        print("\n1. Creating manufacturers...")
        manufacturers = create_manufacturers()
        
        print("\n2. Creating engine types...")
        engine_types = create_engine_types()
        
        print("\n3. Creating bike categories...")
        categories = create_bike_categories()
        
        print("\n4. Creating ECU types...")
        ecu_types = create_ecu_types()
        
        print("\n5. Creating motorcycles...")
        motorcycles = create_motorcycles(manufacturers, categories, engine_types)
        
        print("\n6. Creating tune data...")
        tune_categories, tune_types, safety_ratings = create_tune_data()
        
        print("\n7. Creating tune creators...")
        creators = create_tune_creators()
        
        print("\n8. Creating sample tunes...")
        tunes = create_sample_tunes(creators, tune_categories, tune_types, safety_ratings, motorcycles)
        
        print("\n9. Creating tune collections...")
        collections = create_tune_collections(tunes)
        
        print(f"\nDatabase population complete!")
        print(f"Created:")
        print(f"  - {len(manufacturers)} manufacturers")
        print(f"  - {len(engine_types)} engine types")
        print(f"  - {len(categories)} bike categories")
        print(f"  - {len(ecu_types)} ECU types")
        print(f"  - {len(motorcycles)} motorcycles")
        print(f"  - {len(tune_categories)} tune categories")
        print(f"  - {len(tune_types)} tune types")
        print(f"  - {len(safety_ratings)} safety ratings")
        print(f"  - {len(creators)} tune creators")
        print(f"  - {len(tunes)} tunes")
        print(f"  - {len(collections)} tune collections")
        
    except Exception as e:
        print(f"Error during population: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main() 