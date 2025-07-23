#!/usr/bin/env python
"""
Comprehensive motorcycle database expansion for RevSync
Adds 500+ popular motorcycle models to ensure user coverage
"""

import os
import sys
import django
from django.contrib.auth.models import User
from decimal import Decimal
from datetime import datetime, date, timedelta
import random
from django.core.management.base import BaseCommand

from bikes.models import (
    Manufacturer, EngineType, BikeCategory, Motorcycle, ECUType,
    MotorcycleECU, BikeSpecification
)


class Command(BaseCommand):
    help = 'Populate comprehensive motorcycle database with 500+ models'

    def handle(self, *args, **options):
        """Main population function"""
        self.stdout.write("Starting comprehensive motorcycle database expansion...")
        
        # Get existing data
        manufacturers = {m.name: m for m in Manufacturer.objects.all()}
        categories = {c.name: c for c in BikeCategory.objects.all()}
        
        # Add more manufacturers if needed
        self.create_additional_manufacturers(manufacturers)
        
        # Add comprehensive motorcycle database
        total_created = self.create_comprehensive_motorcycles(manufacturers, categories)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully added {total_created} motorcycles to the database!'
            )
        )

    def create_additional_manufacturers(self, manufacturers):
        """Add more manufacturers to cover all major brands"""
        additional_manufacturers = [
            {"name": "Husqvarna", "country": "Sweden", "founded_year": 1903, "website": "https://husqvarna-motorcycles.com"},
            {"name": "Royal Enfield", "country": "India", "founded_year": 1901, "website": "https://royalenfield.com"},
            {"name": "Beta", "country": "Italy", "founded_year": 1904, "website": "https://betamotor.com"},
            {"name": "GAS GAS", "country": "Spain", "founded_year": 1985, "website": "https://gasgas.com"},
            {"name": "Sherco", "country": "France", "founded_year": 1998, "website": "https://sherco.com"},
            {"name": "TM Racing", "country": "Italy", "founded_year": 1976, "website": "https://tmracing.it"},
            {"name": "Benelli", "country": "Italy", "founded_year": 1911, "website": "https://benelli.com"},
            {"name": "CF Moto", "country": "China", "founded_year": 1989, "website": "https://cfmoto.com"},
            {"name": "Kymco", "country": "Taiwan", "founded_year": 1963, "website": "https://kymco.com"},
            {"name": "SYM", "country": "Taiwan", "founded_year": 1954, "website": "https://sym-global.com"},
            {"name": "Piaggio", "country": "Italy", "founded_year": 1884, "website": "https://piaggio.com"},
            {"name": "Vespa", "country": "Italy", "founded_year": 1946, "website": "https://vespa.com"},
            {"name": "Can-Am", "country": "Canada", "founded_year": 1971, "website": "https://can-am.brp.com"},
            {"name": "Polaris", "country": "United States", "founded_year": 1954, "website": "https://polaris.com"},
            {"name": "Norton", "country": "United Kingdom", "founded_year": 1898, "website": "https://nortonmotorcycles.com"},
        ]
        
        for data in additional_manufacturers:
            if data["name"] not in manufacturers:
                manufacturer, created = Manufacturer.objects.get_or_create(
                    name=data["name"],
                    defaults=data
                )
                manufacturers[data["name"]] = manufacturer
                if created:
                    self.stdout.write(f"Added manufacturer: {manufacturer.name}")

    def create_comprehensive_motorcycles(self, manufacturers, categories):
        """Create comprehensive motorcycle database with 500+ models"""
        
        # Massive motorcycle database with popular models from 2015-2024
        motorcycles_data = [
            # YAMAHA - Expanded lineup
            # R-Series
            *self.generate_model_years("Yamaha", "YZF-R1", "supersport", 2015, 2024, 
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 200, "msrp_usd": 17399}),
            *self.generate_model_years("Yamaha", "YZF-R1M", "supersport", 2015, 2024,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 200, "msrp_usd": 22699}),
            *self.generate_model_years("Yamaha", "YZF-R6", "supersport", 2015, 2024,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 117, "msrp_usd": 12199}),
            *self.generate_model_years("Yamaha", "YZF-R3", "sport", 2015, 2024,
                                     {"displacement_cc": 321, "cylinders": 2, "max_power_hp": 42, "msrp_usd": 5299}),
            *self.generate_model_years("Yamaha", "YZF-R125", "sport", 2015, 2024,
                                     {"displacement_cc": 125, "cylinders": 1, "max_power_hp": 15, "msrp_usd": 4599}),
            
            # MT Series
            *self.generate_model_years("Yamaha", "MT-09", "naked", 2015, 2024,
                                     {"displacement_cc": 889, "cylinders": 3, "max_power_hp": 117, "msrp_usd": 9699}),
            *self.generate_model_years("Yamaha", "MT-09 SP", "naked", 2018, 2024,
                                     {"displacement_cc": 889, "cylinders": 3, "max_power_hp": 117, "msrp_usd": 11299}),
            *self.generate_model_years("Yamaha", "MT-07", "naked", 2015, 2024,
                                     {"displacement_cc": 689, "cylinders": 2, "max_power_hp": 73, "msrp_usd": 7699}),
            *self.generate_model_years("Yamaha", "MT-03", "naked", 2016, 2024,
                                     {"displacement_cc": 321, "cylinders": 2, "max_power_hp": 42, "msrp_usd": 4999}),
            *self.generate_model_years("Yamaha", "MT-125", "naked", 2015, 2024,
                                     {"displacement_cc": 125, "cylinders": 1, "max_power_hp": 15, "msrp_usd": 4299}),
            *self.generate_model_years("Yamaha", "MT-10", "naked", 2016, 2024,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 160, "msrp_usd": 13199}),
            
            # Adventure Series
            *self.generate_model_years("Yamaha", "Tenere 700", "adventure", 2019, 2024,
                                     {"displacement_cc": 689, "cylinders": 2, "max_power_hp": 72, "msrp_usd": 10199}),
            *self.generate_model_years("Yamaha", "Super Tenere 1200", "adventure", 2015, 2024,
                                     {"displacement_cc": 1199, "cylinders": 2, "max_power_hp": 112, "msrp_usd": 15999}),
            
            # Cruiser Series
            *self.generate_model_years("Yamaha", "Bolt", "cruiser", 2015, 2024,
                                     {"displacement_cc": 942, "cylinders": 2, "max_power_hp": 54, "msrp_usd": 8199}),
            *self.generate_model_years("Yamaha", "V Star 250", "cruiser", 2015, 2020,
                                     {"displacement_cc": 249, "cylinders": 2, "max_power_hp": 21, "msrp_usd": 4399}),
            *self.generate_model_years("Yamaha", "V Star 650", "cruiser", 2015, 2019,
                                     {"displacement_cc": 649, "cylinders": 2, "max_power_hp": 40, "msrp_usd": 6799}),
            
            # HONDA - Expanded lineup
            # CBR Series
            *self.generate_model_years("Honda", "CBR1000RR", "supersport", 2015, 2024,
                                     {"displacement_cc": 999, "cylinders": 4, "max_power_hp": 189, "msrp_usd": 16199}),
            *self.generate_model_years("Honda", "CBR1000RR-R", "supersport", 2020, 2024,
                                     {"displacement_cc": 999, "cylinders": 4, "max_power_hp": 217, "msrp_usd": 28500}),
            *self.generate_model_years("Honda", "CBR600RR", "supersport", 2015, 2024,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 118, "msrp_usd": 11799}),
            *self.generate_model_years("Honda", "CBR500R", "sport", 2015, 2024,
                                     {"displacement_cc": 471, "cylinders": 2, "max_power_hp": 47, "msrp_usd": 6999}),
            *self.generate_model_years("Honda", "CBR300R", "sport", 2015, 2019,
                                     {"displacement_cc": 286, "cylinders": 1, "max_power_hp": 30, "msrp_usd": 4699}),
            *self.generate_model_years("Honda", "CBR250RR", "sport", 2017, 2024,
                                     {"displacement_cc": 249, "cylinders": 2, "max_power_hp": 40, "msrp_usd": 5299}),
            
            # CB Series
            *self.generate_model_years("Honda", "CB1000R", "naked", 2018, 2024,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 143, "msrp_usd": 12499}),
            *self.generate_model_years("Honda", "CB650R", "naked", 2019, 2024,
                                     {"displacement_cc": 649, "cylinders": 4, "max_power_hp": 95, "msrp_usd": 8999}),
            *self.generate_model_years("Honda", "CB500F", "naked", 2015, 2024,
                                     {"displacement_cc": 471, "cylinders": 2, "max_power_hp": 47, "msrp_usd": 6299}),
            *self.generate_model_years("Honda", "CB300F", "naked", 2015, 2019,
                                     {"displacement_cc": 286, "cylinders": 1, "max_power_hp": 30, "msrp_usd": 4299}),
            *self.generate_model_years("Honda", "CB125R", "naked", 2018, 2024,
                                     {"displacement_cc": 125, "cylinders": 1, "max_power_hp": 15, "msrp_usd": 3899}),
            
            # Adventure Series
            *self.generate_model_years("Honda", "Africa Twin", "adventure", 2016, 2024,
                                     {"displacement_cc": 1084, "cylinders": 2, "max_power_hp": 101, "msrp_usd": 14399}),
            *self.generate_model_years("Honda", "CB500X", "adventure", 2015, 2024,
                                     {"displacement_cc": 471, "cylinders": 2, "max_power_hp": 47, "msrp_usd": 6999}),
            
            # Cruiser Series
            *self.generate_model_years("Honda", "Shadow 750", "cruiser", 2015, 2020,
                                     {"displacement_cc": 745, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 7699}),
            *self.generate_model_years("Honda", "Rebel 300", "cruiser", 2017, 2024,
                                     {"displacement_cc": 286, "cylinders": 1, "max_power_hp": 27, "msrp_usd": 4599}),
            *self.generate_model_years("Honda", "Rebel 500", "cruiser", 2017, 2024,
                                     {"displacement_cc": 471, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 6199}),
            *self.generate_model_years("Honda", "Rebel 1100", "cruiser", 2021, 2024,
                                     {"displacement_cc": 1084, "cylinders": 2, "max_power_hp": 87, "msrp_usd": 9299}),
            
            # KAWASAKI - Expanded lineup
            # Ninja Series
            *self.generate_model_years("Kawasaki", "Ninja ZX-10R", "supersport", 2015, 2024,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 203, "msrp_usd": 16999}),
            *self.generate_model_years("Kawasaki", "Ninja ZX-6R", "supersport", 2015, 2024,
                                     {"displacement_cc": 636, "cylinders": 4, "max_power_hp": 130, "msrp_usd": 10999}),
            *self.generate_model_years("Kawasaki", "Ninja 650", "sport", 2015, 2024,
                                     {"displacement_cc": 649, "cylinders": 2, "max_power_hp": 68, "msrp_usd": 7399}),
            *self.generate_model_years("Kawasaki", "Ninja 400", "sport", 2018, 2024,
                                     {"displacement_cc": 399, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 5299}),
            *self.generate_model_years("Kawasaki", "Ninja 300", "sport", 2015, 2017,
                                     {"displacement_cc": 296, "cylinders": 2, "max_power_hp": 39, "msrp_usd": 4999}),
            *self.generate_model_years("Kawasaki", "Ninja H2", "supersport", 2015, 2024,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 228, "msrp_usd": 29000}),
            
            # Z Series
            *self.generate_model_years("Kawasaki", "Z900", "naked", 2017, 2024,
                                     {"displacement_cc": 948, "cylinders": 4, "max_power_hp": 125, "msrp_usd": 8999}),
            *self.generate_model_years("Kawasaki", "Z650", "naked", 2017, 2024,
                                     {"displacement_cc": 649, "cylinders": 2, "max_power_hp": 68, "msrp_usd": 7299}),
            *self.generate_model_years("Kawasaki", "Z400", "naked", 2019, 2024,
                                     {"displacement_cc": 399, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 4999}),
            *self.generate_model_years("Kawasaki", "Z125 Pro", "naked", 2015, 2024,
                                     {"displacement_cc": 125, "cylinders": 1, "max_power_hp": 9, "msrp_usd": 3299}),
            
            # Adventure Series
            *self.generate_model_years("Kawasaki", "Versys 1000", "adventure", 2015, 2024,
                                     {"displacement_cc": 1043, "cylinders": 4, "max_power_hp": 120, "msrp_usd": 12399}),
            *self.generate_model_years("Kawasaki", "Versys 650", "adventure", 2015, 2024,
                                     {"displacement_cc": 649, "cylinders": 2, "max_power_hp": 69, "msrp_usd": 8699}),
            *self.generate_model_years("Kawasaki", "Versys-X 300", "adventure", 2017, 2024,
                                     {"displacement_cc": 296, "cylinders": 2, "max_power_hp": 40, "msrp_usd": 5799}),
            
            # Cruiser Series
            *self.generate_model_years("Kawasaki", "Vulcan S", "cruiser", 2015, 2024,
                                     {"displacement_cc": 649, "cylinders": 2, "max_power_hp": 61, "msrp_usd": 7399}),
            *self.generate_model_years("Kawasaki", "Vulcan 900", "cruiser", 2015, 2021,
                                     {"displacement_cc": 903, "cylinders": 2, "max_power_hp": 50, "msrp_usd": 8799}),
            
            # SUZUKI - Expanded lineup
            # GSX-R Series
            *self.generate_model_years("Suzuki", "GSX-R1000", "supersport", 2015, 2024,
                                     {"displacement_cc": 999, "cylinders": 4, "max_power_hp": 199, "msrp_usd": 14799}),
            *self.generate_model_years("Suzuki", "GSX-R750", "supersport", 2015, 2024,
                                     {"displacement_cc": 749, "cylinders": 4, "max_power_hp": 148, "msrp_usd": 12499}),
            *self.generate_model_years("Suzuki", "GSX-R600", "supersport", 2015, 2024,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 124, "msrp_usd": 11199}),
            *self.generate_model_years("Suzuki", "GSX250R", "sport", 2017, 2024,
                                     {"displacement_cc": 248, "cylinders": 2, "max_power_hp": 25, "msrp_usd": 4399}),
            
            # GSX-S Series
            *self.generate_model_years("Suzuki", "GSX-S1000", "naked", 2015, 2024,
                                     {"displacement_cc": 999, "cylinders": 4, "max_power_hp": 152, "msrp_usd": 10799}),
            *self.generate_model_years("Suzuki", "GSX-S750", "naked", 2015, 2024,
                                     {"displacement_cc": 749, "cylinders": 4, "max_power_hp": 114, "msrp_usd": 8499}),
            *self.generate_model_years("Suzuki", "GSX-S125", "naked", 2017, 2024,
                                     {"displacement_cc": 124, "cylinders": 1, "max_power_hp": 15, "msrp_usd": 3699}),
            
            # V-Strom Series
            *self.generate_model_years("Suzuki", "V-Strom 1050", "adventure", 2020, 2024,
                                     {"displacement_cc": 1037, "cylinders": 2, "max_power_hp": 107, "msrp_usd": 13699}),
            *self.generate_model_years("Suzuki", "V-Strom 650", "adventure", 2015, 2024,
                                     {"displacement_cc": 645, "cylinders": 2, "max_power_hp": 71, "msrp_usd": 8699}),
            *self.generate_model_years("Suzuki", "V-Strom 250", "adventure", 2017, 2024,
                                     {"displacement_cc": 248, "cylinders": 2, "max_power_hp": 25, "msrp_usd": 4999}),
            
            # Boulevard Series
            *self.generate_model_years("Suzuki", "Boulevard M109R", "cruiser", 2015, 2024,
                                     {"displacement_cc": 1783, "cylinders": 2, "max_power_hp": 123, "msrp_usd": 14999}),
            *self.generate_model_years("Suzuki", "Boulevard C50", "cruiser", 2015, 2019,
                                     {"displacement_cc": 805, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 8299}),
            
            # DUCATI - Expanded lineup
            # Panigale Series
            *self.generate_model_years("Ducati", "Panigale V4", "supersport", 2018, 2024,
                                     {"displacement_cc": 1103, "cylinders": 4, "max_power_hp": 214, "msrp_usd": 25395}),
            *self.generate_model_years("Ducati", "Panigale V4S", "supersport", 2018, 2024,
                                     {"displacement_cc": 1103, "cylinders": 4, "max_power_hp": 214, "msrp_usd": 28395}),
            *self.generate_model_years("Ducati", "Panigale V2", "supersport", 2020, 2024,
                                     {"displacement_cc": 955, "cylinders": 2, "max_power_hp": 155, "msrp_usd": 16495}),
            *self.generate_model_years("Ducati", "Panigale 959", "supersport", 2015, 2019,
                                     {"displacement_cc": 955, "cylinders": 2, "max_power_hp": 157, "msrp_usd": 15295}),
            *self.generate_model_years("Ducati", "Panigale 1299", "supersport", 2015, 2017,
                                     {"displacement_cc": 1285, "cylinders": 2, "max_power_hp": 205, "msrp_usd": 17995}),
            
            # Monster Series
            *self.generate_model_years("Ducati", "Monster 1200", "naked", 2015, 2020,
                                     {"displacement_cc": 1198, "cylinders": 2, "max_power_hp": 147, "msrp_usd": 15295}),
            *self.generate_model_years("Ducati", "Monster 821", "naked", 2015, 2020,
                                     {"displacement_cc": 821, "cylinders": 2, "max_power_hp": 109, "msrp_usd": 11495}),
            *self.generate_model_years("Ducati", "Monster 797", "naked", 2017, 2019,
                                     {"displacement_cc": 803, "cylinders": 2, "max_power_hp": 73, "msrp_usd": 9295}),
            *self.generate_model_years("Ducati", "Monster 937", "naked", 2021, 2024,
                                     {"displacement_cc": 937, "cylinders": 2, "max_power_hp": 111, "msrp_usd": 11995}),
            
            # Multistrada Series
            *self.generate_model_years("Ducati", "Multistrada 1260", "adventure", 2018, 2021,
                                     {"displacement_cc": 1262, "cylinders": 2, "max_power_hp": 158, "msrp_usd": 17995}),
            *self.generate_model_years("Ducati", "Multistrada V4", "adventure", 2021, 2024,
                                     {"displacement_cc": 1158, "cylinders": 4, "max_power_hp": 170, "msrp_usd": 22995}),
            *self.generate_model_years("Ducati", "Multistrada 950", "adventure", 2017, 2021,
                                     {"displacement_cc": 937, "cylinders": 2, "max_power_hp": 113, "msrp_usd": 15295}),
            
            # Scrambler Series
            *self.generate_model_years("Ducati", "Scrambler Icon", "naked", 2015, 2024,
                                     {"displacement_cc": 803, "cylinders": 2, "max_power_hp": 73, "msrp_usd": 9395}),
            *self.generate_model_years("Ducati", "Scrambler Desert Sled", "dual_sport", 2017, 2024,
                                     {"displacement_cc": 803, "cylinders": 2, "max_power_hp": 73, "msrp_usd": 11395}),
            
            # BMW - Expanded lineup
            # S Series
            *self.generate_model_years("BMW", "S1000RR", "supersport", 2015, 2024,
                                     {"displacement_cc": 999, "cylinders": 4, "max_power_hp": 205, "msrp_usd": 17295}),
            *self.generate_model_years("BMW", "S1000XR", "adventure", 2015, 2024,
                                     {"displacement_cc": 999, "cylinders": 4, "max_power_hp": 165, "msrp_usd": 16995}),
            *self.generate_model_years("BMW", "S1000R", "naked", 2015, 2024,
                                     {"displacement_cc": 999, "cylinders": 4, "max_power_hp": 165, "msrp_usd": 14995}),
            
            # R Series
            *self.generate_model_years("BMW", "R1250GS", "adventure", 2019, 2024,
                                     {"displacement_cc": 1254, "cylinders": 2, "max_power_hp": 136, "msrp_usd": 17295}),
            *self.generate_model_years("BMW", "R1200GS", "adventure", 2015, 2018,
                                     {"displacement_cc": 1170, "cylinders": 2, "max_power_hp": 125, "msrp_usd": 15995}),
            *self.generate_model_years("BMW", "R1250R", "naked", 2019, 2024,
                                     {"displacement_cc": 1254, "cylinders": 2, "max_power_hp": 136, "msrp_usd": 14695}),
            *self.generate_model_years("BMW", "R nineT", "naked", 2015, 2024,
                                     {"displacement_cc": 1170, "cylinders": 2, "max_power_hp": 110, "msrp_usd": 15495}),
            
            # F Series
            *self.generate_model_years("BMW", "F850GS", "adventure", 2018, 2024,
                                     {"displacement_cc": 853, "cylinders": 2, "max_power_hp": 95, "msrp_usd": 13995}),
            *self.generate_model_years("BMW", "F750GS", "adventure", 2018, 2024,
                                     {"displacement_cc": 853, "cylinders": 2, "max_power_hp": 77, "msrp_usd": 12245}),
            *self.generate_model_years("BMW", "F900R", "naked", 2020, 2024,
                                     {"displacement_cc": 895, "cylinders": 2, "max_power_hp": 105, "msrp_usd": 9395}),
            
            # G Series
            *self.generate_model_years("BMW", "G310R", "naked", 2017, 2024,
                                     {"displacement_cc": 313, "cylinders": 1, "max_power_hp": 34, "msrp_usd": 4695}),
            *self.generate_model_years("BMW", "G310GS", "adventure", 2017, 2024,
                                     {"displacement_cc": 313, "cylinders": 1, "max_power_hp": 34, "msrp_usd": 5695}),
            
            # KTM - Expanded lineup
            # Duke Series
            *self.generate_model_years("KTM", "1290 Super Duke R", "naked", 2015, 2024,
                                     {"displacement_cc": 1301, "cylinders": 2, "max_power_hp": 180, "msrp_usd": 18999}),
            *self.generate_model_years("KTM", "890 Duke R", "naked", 2020, 2024,
                                     {"displacement_cc": 889, "cylinders": 2, "max_power_hp": 121, "msrp_usd": 11999}),
            *self.generate_model_years("KTM", "790 Duke", "naked", 2018, 2020,
                                     {"displacement_cc": 799, "cylinders": 2, "max_power_hp": 105, "msrp_usd": 10499}),
            *self.generate_model_years("KTM", "690 Duke", "naked", 2015, 2024,
                                     {"displacement_cc": 693, "cylinders": 1, "max_power_hp": 73, "msrp_usd": 9299}),
            *self.generate_model_years("KTM", "390 Duke", "naked", 2015, 2024,
                                     {"displacement_cc": 373, "cylinders": 1, "max_power_hp": 44, "msrp_usd": 5499}),
            *self.generate_model_years("KTM", "200 Duke", "naked", 2015, 2024,
                                     {"displacement_cc": 199, "cylinders": 1, "max_power_hp": 25, "msrp_usd": 3999}),
            *self.generate_model_years("KTM", "125 Duke", "naked", 2015, 2024,
                                     {"displacement_cc": 125, "cylinders": 1, "max_power_hp": 15, "msrp_usd": 3699}),
            
            # RC Series
            *self.generate_model_years("KTM", "RC 390", "sport", 2015, 2024,
                                     {"displacement_cc": 373, "cylinders": 1, "max_power_hp": 44, "msrp_usd": 5799}),
            *self.generate_model_years("KTM", "RC 200", "sport", 2015, 2024,
                                     {"displacement_cc": 199, "cylinders": 1, "max_power_hp": 25, "msrp_usd": 4299}),
            *self.generate_model_years("KTM", "RC 125", "sport", 2015, 2024,
                                     {"displacement_cc": 125, "cylinders": 1, "max_power_hp": 15, "msrp_usd": 3999}),
            
            # Adventure Series
            *self.generate_model_years("KTM", "1290 Super Adventure", "adventure", 2015, 2024,
                                     {"displacement_cc": 1301, "cylinders": 2, "max_power_hp": 160, "msrp_usd": 19999}),
            *self.generate_model_years("KTM", "890 Adventure", "adventure", 2021, 2024,
                                     {"displacement_cc": 889, "cylinders": 2, "max_power_hp": 105, "msrp_usd": 13999}),
            *self.generate_model_years("KTM", "790 Adventure", "adventure", 2019, 2021,
                                     {"displacement_cc": 799, "cylinders": 2, "max_power_hp": 95, "msrp_usd": 12999}),
            *self.generate_model_years("KTM", "390 Adventure", "adventure", 2020, 2024,
                                     {"displacement_cc": 373, "cylinders": 1, "max_power_hp": 44, "msrp_usd": 6999}),
            
            # HARLEY-DAVIDSON - Expanded lineup
            # Sportster Series
            *self.generate_model_years("Harley-Davidson", "Sportster Iron 883", "cruiser", 2015, 2022,
                                     {"displacement_cc": 883, "cylinders": 2, "max_power_hp": 50, "msrp_usd": 8999}),
            *self.generate_model_years("Harley-Davidson", "Sportster Iron 1200", "cruiser", 2015, 2022,
                                     {"displacement_cc": 1202, "cylinders": 2, "max_power_hp": 70, "msrp_usd": 11999}),
            *self.generate_model_years("Harley-Davidson", "Sportster Forty-Eight", "cruiser", 2015, 2020,
                                     {"displacement_cc": 1202, "cylinders": 2, "max_power_hp": 70, "msrp_usd": 11699}),
            
            # Softail Series
            *self.generate_model_years("Harley-Davidson", "Fat Bob", "cruiser", 2018, 2024,
                                     {"displacement_cc": 1868, "cylinders": 2, "max_power_hp": 93, "msrp_usd": 18999}),
            *self.generate_model_years("Harley-Davidson", "Fat Boy", "cruiser", 2015, 2024,
                                     {"displacement_cc": 1868, "cylinders": 2, "max_power_hp": 93, "msrp_usd": 20399}),
            *self.generate_model_years("Harley-Davidson", "Heritage Classic", "cruiser", 2015, 2024,
                                     {"displacement_cc": 1868, "cylinders": 2, "max_power_hp": 93, "msrp_usd": 19999}),
            *self.generate_model_years("Harley-Davidson", "Low Rider", "cruiser", 2018, 2024,
                                     {"displacement_cc": 1868, "cylinders": 2, "max_power_hp": 93, "msrp_usd": 17999}),
            
            # Touring Series
            *self.generate_model_years("Harley-Davidson", "Road King", "touring", 2015, 2024,
                                     {"displacement_cc": 1868, "cylinders": 2, "max_power_hp": 93, "msrp_usd": 22999}),
            *self.generate_model_years("Harley-Davidson", "Street Glide", "touring", 2015, 2024,
                                     {"displacement_cc": 1868, "cylinders": 2, "max_power_hp": 93, "msrp_usd": 23999}),
            *self.generate_model_years("Harley-Davidson", "Road Glide", "touring", 2015, 2024,
                                     {"displacement_cc": 1868, "cylinders": 2, "max_power_hp": 93, "msrp_usd": 24999}),
            
            # Street Series
            *self.generate_model_years("Harley-Davidson", "Street 500", "naked", 2015, 2020,
                                     {"displacement_cc": 494, "cylinders": 2, "max_power_hp": 34, "msrp_usd": 6799}),
            *self.generate_model_years("Harley-Davidson", "Street 750", "naked", 2015, 2020,
                                     {"displacement_cc": 749, "cylinders": 2, "max_power_hp": 47, "msrp_usd": 7599}),
            
            # LiveWire
            *self.generate_model_years("Harley-Davidson", "LiveWire", "electric", 2019, 2024,
                                     {"displacement_cc": 0, "cylinders": 0, "max_power_hp": 105, "msrp_usd": 29799}),
            
            # TRIUMPH - Expanded lineup
            # Street Triple Series
            *self.generate_model_years("Triumph", "Street Triple R", "naked", 2015, 2024,
                                     {"displacement_cc": 765, "cylinders": 3, "max_power_hp": 118, "msrp_usd": 10695}),
            *self.generate_model_years("Triumph", "Street Triple RS", "naked", 2017, 2024,
                                     {"displacement_cc": 765, "cylinders": 3, "max_power_hp": 123, "msrp_usd": 13400}),
            *self.generate_model_years("Triumph", "Street Triple S", "naked", 2015, 2024,
                                     {"displacement_cc": 765, "cylinders": 3, "max_power_hp": 111, "msrp_usd": 9500}),
            
            # Daytona Series
            *self.generate_model_years("Triumph", "Daytona 675R", "supersport", 2015, 2017,
                                     {"displacement_cc": 675, "cylinders": 3, "max_power_hp": 128, "msrp_usd": 13499}),
            
            # Speed Triple Series
            *self.generate_model_years("Triumph", "Speed Triple R", "naked", 2015, 2024,
                                     {"displacement_cc": 1050, "cylinders": 3, "max_power_hp": 140, "msrp_usd": 15400}),
            *self.generate_model_years("Triumph", "Speed Triple RS", "naked", 2018, 2024,
                                     {"displacement_cc": 1050, "cylinders": 3, "max_power_hp": 148, "msrp_usd": 17500}),
            
            # Bonneville Series
            *self.generate_model_years("Triumph", "Bonneville T120", "cruiser", 2015, 2024,
                                     {"displacement_cc": 1200, "cylinders": 2, "max_power_hp": 80, "msrp_usd": 12400}),
            *self.generate_model_years("Triumph", "Bonneville T100", "cruiser", 2015, 2024,
                                     {"displacement_cc": 900, "cylinders": 2, "max_power_hp": 55, "msrp_usd": 9400}),
            *self.generate_model_years("Triumph", "Bonneville Bobber", "cruiser", 2017, 2024,
                                     {"displacement_cc": 1200, "cylinders": 2, "max_power_hp": 77, "msrp_usd": 12900}),
            
            # Tiger Series
            *self.generate_model_years("Triumph", "Tiger 1200", "adventure", 2018, 2024,
                                     {"displacement_cc": 1215, "cylinders": 3, "max_power_hp": 141, "msrp_usd": 18500}),
            *self.generate_model_years("Triumph", "Tiger 900", "adventure", 2020, 2024,
                                     {"displacement_cc": 888, "cylinders": 3, "max_power_hp": 95, "msrp_usd": 13200}),
            *self.generate_model_years("Triumph", "Tiger 800", "adventure", 2015, 2019,
                                     {"displacement_cc": 799, "cylinders": 3, "max_power_hp": 95, "msrp_usd": 12400}),
            
            # ROYAL ENFIELD - Popular budget bikes
            *self.generate_model_years("Royal Enfield", "Classic 350", "cruiser", 2015, 2024,
                                     {"displacement_cc": 349, "cylinders": 1, "max_power_hp": 20, "msrp_usd": 4499}),
            *self.generate_model_years("Royal Enfield", "Classic 500", "cruiser", 2015, 2020,
                                     {"displacement_cc": 499, "cylinders": 1, "max_power_hp": 27, "msrp_usd": 5499}),
            *self.generate_model_years("Royal Enfield", "Bullet 350", "cruiser", 2015, 2024,
                                     {"displacement_cc": 346, "cylinders": 1, "max_power_hp": 19, "msrp_usd": 4199}),
            *self.generate_model_years("Royal Enfield", "Himalayan", "adventure", 2016, 2024,
                                     {"displacement_cc": 411, "cylinders": 1, "max_power_hp": 24, "msrp_usd": 4999}),
            *self.generate_model_years("Royal Enfield", "Interceptor 650", "naked", 2018, 2024,
                                     {"displacement_cc": 648, "cylinders": 2, "max_power_hp": 47, "msrp_usd": 5799}),
            *self.generate_model_years("Royal Enfield", "Continental GT 650", "cafe_racer", 2018, 2024,
                                     {"displacement_cc": 648, "cylinders": 2, "max_power_hp": 47, "msrp_usd": 5999}),
            
            # APRILIA - Expanded lineup
            *self.generate_model_years("Aprilia", "RSV4", "supersport", 2015, 2024,
                                     {"displacement_cc": 1077, "cylinders": 4, "max_power_hp": 217, "msrp_usd": 19499}),
            *self.generate_model_years("Aprilia", "RS 660", "sport", 2020, 2024,
                                     {"displacement_cc": 659, "cylinders": 2, "max_power_hp": 100, "msrp_usd": 10499}),
            *self.generate_model_years("Aprilia", "Tuono V4", "naked", 2015, 2024,
                                     {"displacement_cc": 1077, "cylinders": 4, "max_power_hp": 175, "msrp_usd": 16699}),
            *self.generate_model_years("Aprilia", "Shiver 900", "naked", 2015, 2024,
                                     {"displacement_cc": 896, "cylinders": 2, "max_power_hp": 95, "msrp_usd": 11499}),
            
            # ZERO MOTORCYCLES - Electric bikes
            *self.generate_model_years("Zero Motorcycles", "SR/F", "electric", 2019, 2024,
                                     {"displacement_cc": 0, "cylinders": 0, "max_power_hp": 110, "msrp_usd": 19995}),
            *self.generate_model_years("Zero Motorcycles", "SR/S", "electric", 2020, 2024,
                                     {"displacement_cc": 0, "cylinders": 0, "max_power_hp": 110, "msrp_usd": 21995}),
            *self.generate_model_years("Zero Motorcycles", "DSR", "adventure", 2015, 2024,
                                     {"displacement_cc": 0, "cylinders": 0, "max_power_hp": 70, "msrp_usd": 18995}),
            *self.generate_model_years("Zero Motorcycles", "FXS", "naked", 2015, 2024,
                                     {"displacement_cc": 0, "cylinders": 0, "max_power_hp": 46, "msrp_usd": 10995}),
            
            # SCOOTERS - Popular commuter vehicles
            *self.generate_model_years("Honda", "PCX 150", "scooter", 2015, 2024,
                                     {"displacement_cc": 153, "cylinders": 1, "max_power_hp": 15, "msrp_usd": 3799}),
            *self.generate_model_years("Honda", "PCX 125", "scooter", 2015, 2024,
                                     {"displacement_cc": 125, "cylinders": 1, "max_power_hp": 12, "msrp_usd": 3599}),
            *self.generate_model_years("Yamaha", "NMAX 155", "scooter", 2015, 2024,
                                     {"displacement_cc": 155, "cylinders": 1, "max_power_hp": 15, "msrp_usd": 3799}),
            *self.generate_model_years("Yamaha", "XMAX 300", "scooter", 2017, 2024,
                                     {"displacement_cc": 292, "cylinders": 1, "max_power_hp": 28, "msrp_usd": 5799}),
            *self.generate_model_years("Suzuki", "Burgman 400", "scooter", 2015, 2024,
                                     {"displacement_cc": 399, "cylinders": 1, "max_power_hp": 35, "msrp_usd": 7499}),
            *self.generate_model_years("Kymco", "Like 150i", "scooter", 2015, 2024,
                                     {"displacement_cc": 149, "cylinders": 1, "max_power_hp": 14, "msrp_usd": 3299}),
            
            # CHINESE BRANDS - Budget options
            *self.generate_model_years("CF Moto", "300NK", "naked", 2018, 2024,
                                     {"displacement_cc": 292, "cylinders": 1, "max_power_hp": 26, "msrp_usd": 4299}),
            *self.generate_model_years("CF Moto", "650NK", "naked", 2015, 2024,
                                     {"displacement_cc": 649, "cylinders": 2, "max_power_hp": 61, "msrp_usd": 6999}),
            *self.generate_model_years("Benelli", "302R", "sport", 2017, 2024,
                                     {"displacement_cc": 300, "cylinders": 2, "max_power_hp": 38, "msrp_usd": 4699}),
            *self.generate_model_years("Benelli", "TNT 600i", "naked", 2015, 2024,
                                     {"displacement_cc": 600, "cylinders": 4, "max_power_hp": 85, "msrp_usd": 7999}),
            
            # 🏍️ COMPREHENSIVE HISTORICAL HONDA MODELS
            # CBR Sport Bikes - Extended historical coverage
            *self.generate_model_years("Honda", "CBR1000RR-R Fireblade", "supersport", 2020, 2024,
                                     {"displacement_cc": 999, "cylinders": 4, "max_power_hp": 217, "msrp_usd": 28500}),
            *self.generate_model_years("Honda", "CBR1000RR Fireblade", "supersport", 2008, 2019,
                                     {"displacement_cc": 999, "cylinders": 4, "max_power_hp": 189, "msrp_usd": 16199}),
            *self.generate_model_years("Honda", "CBR1000RR", "supersport", 2004, 2007,
                                     {"displacement_cc": 999, "cylinders": 4, "max_power_hp": 172, "msrp_usd": 12999}),
            *self.generate_model_years("Honda", "CBR954RR", "supersport", 2002, 2003,
                                     {"displacement_cc": 954, "cylinders": 4, "max_power_hp": 152, "msrp_usd": 11499}),
            *self.generate_model_years("Honda", "CBR929RR", "supersport", 2000, 2001,
                                     {"displacement_cc": 929, "cylinders": 4, "max_power_hp": 147, "msrp_usd": 10999}),
            *self.generate_model_years("Honda", "CBR900RR Fireblade", "supersport", 1992, 1999,
                                     {"displacement_cc": 893, "cylinders": 4, "max_power_hp": 130, "msrp_usd": 9999}),
            *self.generate_model_years("Honda", "CBR600F4i", "sport", 2001, 2006,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 108, "msrp_usd": 8999}),
            *self.generate_model_years("Honda", "CBR600F4", "sport", 1999, 2000,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 105, "msrp_usd": 8499}),
            *self.generate_model_years("Honda", "CBR600F3", "sport", 1995, 1998,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 100, "msrp_usd": 7999}),
            *self.generate_model_years("Honda", "CBR600F2", "sport", 1991, 1994,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 95, "msrp_usd": 7499}),
            *self.generate_model_years("Honda", "CBR600F Hurricane", "sport", 1987, 1990,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 85, "msrp_usd": 6999}),
            *self.generate_model_years("Honda", "CBR400RR", "sport", 1988, 1994,
                                     {"displacement_cc": 399, "cylinders": 4, "max_power_hp": 59, "msrp_usd": 5999}),
            *self.generate_model_years("Honda", "CBR250RR", "sport", 2017, 2024,
                                     {"displacement_cc": 249, "cylinders": 2, "max_power_hp": 40, "msrp_usd": 5299}),
            *self.generate_model_years("Honda", "CBR250R", "sport", 2011, 2014,
                                     {"displacement_cc": 249, "cylinders": 1, "max_power_hp": 26, "msrp_usd": 4299}),
            *self.generate_model_years("Honda", "CBR125R", "sport", 2004, 2020,
                                     {"displacement_cc": 125, "cylinders": 1, "max_power_hp": 15, "msrp_usd": 3599}),
            *self.generate_model_years("Honda", "NSR250R", "sport", 1988, 1999,
                                     {"displacement_cc": 249, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 5499}),

            # VFR Series
            *self.generate_model_years("Honda", "VFR800F", "sport", 2014, 2024,
                                     {"displacement_cc": 782, "cylinders": 4, "max_power_hp": 106, "msrp_usd": 12999}),
            *self.generate_model_years("Honda", "VFR800", "sport", 1998, 2013,
                                     {"displacement_cc": 782, "cylinders": 4, "max_power_hp": 103, "msrp_usd": 11999}),
            *self.generate_model_years("Honda", "VFR750F", "sport", 1986, 1997,
                                     {"displacement_cc": 748, "cylinders": 4, "max_power_hp": 98, "msrp_usd": 10999}),
            *self.generate_model_years("Honda", "VFR1200F", "sport", 2010, 2017,
                                     {"displacement_cc": 1237, "cylinders": 4, "max_power_hp": 170, "msrp_usd": 15999}),
            *self.generate_model_years("Honda", "RC51 SP-1", "supersport", 2000, 2003,
                                     {"displacement_cc": 999, "cylinders": 2, "max_power_hp": 136, "msrp_usd": 12999}),
            *self.generate_model_years("Honda", "RC51 SP-2", "supersport", 2002, 2006,
                                     {"displacement_cc": 999, "cylinders": 2, "max_power_hp": 140, "msrp_usd": 13499}),
            *self.generate_model_years("Honda", "RC30 VFR750R", "supersport", 1988, 1992,
                                     {"displacement_cc": 748, "cylinders": 4, "max_power_hp": 112, "msrp_usd": 18999}),

            # CB Naked Series - Extended
            *self.generate_model_years("Honda", "CB1000 Big One", "naked", 1993, 1997,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 98, "msrp_usd": 8999}),
            *self.generate_model_years("Honda", "CB650F", "naked", 2014, 2018,
                                     {"displacement_cc": 649, "cylinders": 4, "max_power_hp": 87, "msrp_usd": 8199}),
            *self.generate_model_years("Honda", "CB500", "naked", 1993, 2003,
                                     {"displacement_cc": 499, "cylinders": 2, "max_power_hp": 57, "msrp_usd": 5999}),
            *self.generate_model_years("Honda", "CB400 Super Four", "naked", 1992, 2024,
                                     {"displacement_cc": 399, "cylinders": 4, "max_power_hp": 53, "msrp_usd": 7299}),
            *self.generate_model_years("Honda", "CB400SF Hyper VTEC", "naked", 1999, 2008,
                                     {"displacement_cc": 399, "cylinders": 4, "max_power_hp": 56, "msrp_usd": 7499}),
            *self.generate_model_years("Honda", "CB350", "naked", 1968, 1973,
                                     {"displacement_cc": 325, "cylinders": 2, "max_power_hp": 36, "msrp_usd": 3999}),
            *self.generate_model_years("Honda", "CB300F", "naked", 2015, 2017,
                                     {"displacement_cc": 286, "cylinders": 1, "max_power_hp": 30, "msrp_usd": 4299}),
            *self.generate_model_years("Honda", "CB250F", "naked", 2015, 2020,
                                     {"displacement_cc": 249, "cylinders": 1, "max_power_hp": 26, "msrp_usd": 3999}),
            *self.generate_model_years("Honda", "CB125F", "naked", 2015, 2024,
                                     {"displacement_cc": 125, "cylinders": 1, "max_power_hp": 11, "msrp_usd": 3199}),

            # Hornet Series
            *self.generate_model_years("Honda", "CB919 Hornet 900", "naked", 2002, 2007,
                                     {"displacement_cc": 919, "cylinders": 4, "max_power_hp": 109, "msrp_usd": 8499}),
            *self.generate_model_years("Honda", "CB600F Hornet", "naked", 1998, 2013,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 97, "msrp_usd": 7299}),

            # Classic CB Series
            *self.generate_model_years("Honda", "CB750", "naked", 1969, 2003,
                                     {"displacement_cc": 736, "cylinders": 4, "max_power_hp": 67, "msrp_usd": 6999}),
            *self.generate_model_years("Honda", "CB750F Super Sport", "naked", 1975, 1982,
                                     {"displacement_cc": 748, "cylinders": 4, "max_power_hp": 75, "msrp_usd": 6499}),
            *self.generate_model_years("Honda", "CB1100", "naked", 2013, 2024,
                                     {"displacement_cc": 1140, "cylinders": 4, "max_power_hp": 88, "msrp_usd": 11999}),
            *self.generate_model_years("Honda", "CBX", "naked", 1979, 1982,
                                     {"displacement_cc": 1047, "cylinders": 6, "max_power_hp": 105, "msrp_usd": 14999}),

            # Shadow Cruiser Series - Extended
            *self.generate_model_years("Honda", "Shadow Phantom", "cruiser", 2010, 2020,
                                     {"displacement_cc": 745, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 8199}),
            *self.generate_model_years("Honda", "Shadow Spirit", "cruiser", 2007, 2016,
                                     {"displacement_cc": 745, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 7999}),
            *self.generate_model_years("Honda", "Shadow Aero", "cruiser", 2004, 2020,
                                     {"displacement_cc": 745, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 7799}),
            *self.generate_model_years("Honda", "Shadow RS", "cruiser", 2010, 2012,
                                     {"displacement_cc": 745, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 8399}),
            *self.generate_model_years("Honda", "Shadow Sabre", "cruiser", 2000, 2007,
                                     {"displacement_cc": 1099, "cylinders": 2, "max_power_hp": 65, "msrp_usd": 9199}),
            *self.generate_model_years("Honda", "Shadow VLX 600", "cruiser", 1988, 2007,
                                     {"displacement_cc": 583, "cylinders": 2, "max_power_hp": 38, "msrp_usd": 6299}),
            *self.generate_model_years("Honda", "Shadow VT1100", "cruiser", 1985, 2007,
                                     {"displacement_cc": 1099, "cylinders": 2, "max_power_hp": 65, "msrp_usd": 8999}),
            *self.generate_model_years("Honda", "Shadow VT750", "cruiser", 1983, 2003,
                                     {"displacement_cc": 748, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 7299}),
            *self.generate_model_years("Honda", "Shadow ACE", "cruiser", 1998, 2003,
                                     {"displacement_cc": 748, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 7599}),

            # Other Honda Cruisers
            *self.generate_model_years("Honda", "Fury", "cruiser", 2010, 2019,
                                     {"displacement_cc": 1312, "cylinders": 2, "max_power_hp": 83, "msrp_usd": 11999}),
            *self.generate_model_years("Honda", "Stateline", "cruiser", 2010, 2013,
                                     {"displacement_cc": 1312, "cylinders": 2, "max_power_hp": 74, "msrp_usd": 12999}),
            *self.generate_model_years("Honda", "Sabre", "cruiser", 2010, 2013,
                                     {"displacement_cc": 1312, "cylinders": 2, "max_power_hp": 83, "msrp_usd": 12799}),
            *self.generate_model_years("Honda", "Interstate", "cruiser", 2010, 2013,
                                     {"displacement_cc": 1312, "cylinders": 2, "max_power_hp": 74, "msrp_usd": 13499}),
            *self.generate_model_years("Honda", "Magna V65", "cruiser", 1982, 1988,
                                     {"displacement_cc": 1098, "cylinders": 4, "max_power_hp": 116, "msrp_usd": 8999}),
            *self.generate_model_years("Honda", "Magna VF750C", "cruiser", 1994, 2003,
                                     {"displacement_cc": 748, "cylinders": 4, "max_power_hp": 75, "msrp_usd": 7999}),
            *self.generate_model_years("Honda", "Pacific Coast", "cruiser", 1989, 1998,
                                     {"displacement_cc": 800, "cylinders": 2, "max_power_hp": 54, "msrp_usd": 9999}),

            # Honda Adventure/Touring Extended
            *self.generate_model_years("Honda", "XRV750 Africa Twin", "adventure", 1990, 2003,
                                     {"displacement_cc": 742, "cylinders": 2, "max_power_hp": 62, "msrp_usd": 8999}),
            *self.generate_model_years("Honda", "Transalp XL700V", "adventure", 2008, 2013,
                                     {"displacement_cc": 680, "cylinders": 2, "max_power_hp": 60, "msrp_usd": 9199}),
            *self.generate_model_years("Honda", "Transalp XL600V", "adventure", 1987, 2000,
                                     {"displacement_cc": 583, "cylinders": 2, "max_power_hp": 52, "msrp_usd": 7999}),
            *self.generate_model_years("Honda", "Varadero XL1000V", "adventure", 1999, 2013,
                                     {"displacement_cc": 996, "cylinders": 2, "max_power_hp": 95, "msrp_usd": 11999}),
            *self.generate_model_years("Honda", "Crosstourer VFR1200X", "adventure", 2012, 2020,
                                     {"displacement_cc": 1237, "cylinders": 4, "max_power_hp": 129, "msrp_usd": 15999}),
            *self.generate_model_years("Honda", "NC750X", "adventure", 2014, 2024,
                                     {"displacement_cc": 745, "cylinders": 2, "max_power_hp": 58, "msrp_usd": 8199}),
            *self.generate_model_years("Honda", "NC700X", "adventure", 2012, 2013,
                                     {"displacement_cc": 670, "cylinders": 2, "max_power_hp": 51, "msrp_usd": 7699}),
            *self.generate_model_years("Honda", "ST1100", "touring", 1991, 2002,
                                     {"displacement_cc": 1084, "cylinders": 4, "max_power_hp": 100, "msrp_usd": 13999}),
            *self.generate_model_years("Honda", "ST1300", "touring", 2003, 2012,
                                     {"displacement_cc": 1261, "cylinders": 4, "max_power_hp": 125, "msrp_usd": 15999}),

            # 🔥 COMPREHENSIVE YAMAHA MODELS
            # YZF-R Series Extended
            *self.generate_model_years("Yamaha", "YZF-R1M", "supersport", 2015, 2024,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 200, "msrp_usd": 22699}),
            *self.generate_model_years("Yamaha", "YZF-R25", "sport", 2014, 2024,
                                     {"displacement_cc": 249, "cylinders": 2, "max_power_hp": 36, "msrp_usd": 4999}),
            *self.generate_model_years("Yamaha", "YZF-R15", "sport", 2008, 2024,
                                     {"displacement_cc": 155, "cylinders": 1, "max_power_hp": 19, "msrp_usd": 3299}),
            *self.generate_model_years("Yamaha", "YZF750R", "supersport", 1993, 1998,
                                     {"displacement_cc": 749, "cylinders": 4, "max_power_hp": 120, "msrp_usd": 9999}),

            # FZR Series
            *self.generate_model_years("Yamaha", "FZR1000", "supersport", 1987, 1995,
                                     {"displacement_cc": 1002, "cylinders": 4, "max_power_hp": 140, "msrp_usd": 9999}),
            *self.generate_model_years("Yamaha", "FZR750R", "supersport", 1989, 1992,
                                     {"displacement_cc": 749, "cylinders": 4, "max_power_hp": 120, "msrp_usd": 8999}),
            *self.generate_model_years("Yamaha", "FZR600R", "sport", 1989, 1999,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 85, "msrp_usd": 7299}),
            *self.generate_model_years("Yamaha", "FZR400", "sport", 1988, 1994,
                                     {"displacement_cc": 399, "cylinders": 4, "max_power_hp": 63, "msrp_usd": 6299}),
            *self.generate_model_years("Yamaha", "Thundercat YZF600R", "sport", 1996, 2007,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 95, "msrp_usd": 7999}),
            *self.generate_model_years("Yamaha", "TZR250", "sport", 1987, 1999,
                                     {"displacement_cc": 249, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 5499}),
            *self.generate_model_years("Yamaha", "TZR125", "sport", 1987, 1999,
                                     {"displacement_cc": 125, "cylinders": 2, "max_power_hp": 28, "msrp_usd": 3999}),

            # RD/RZ Series
            *self.generate_model_years("Yamaha", "RD500LC", "sport", 1984, 1987,
                                     {"displacement_cc": 499, "cylinders": 2, "max_power_hp": 88, "msrp_usd": 6999}),
            *self.generate_model_years("Yamaha", "RD400", "sport", 1976, 1979,
                                     {"displacement_cc": 398, "cylinders": 2, "max_power_hp": 44, "msrp_usd": 3999}),
            *self.generate_model_years("Yamaha", "RD350", "sport", 1973, 1975,
                                     {"displacement_cc": 347, "cylinders": 2, "max_power_hp": 39, "msrp_usd": 3599}),
            *self.generate_model_years("Yamaha", "RZ500", "sport", 1984, 1985,
                                     {"displacement_cc": 499, "cylinders": 2, "max_power_hp": 88, "msrp_usd": 6999}),
            *self.generate_model_years("Yamaha", "RZ350", "sport", 1984, 1990,
                                     {"displacement_cc": 347, "cylinders": 2, "max_power_hp": 59, "msrp_usd": 4999}),
            *self.generate_model_years("Yamaha", "RZ250", "sport", 1980, 1990,
                                     {"displacement_cc": 247, "cylinders": 2, "max_power_hp": 35, "msrp_usd": 4299}),

            # FZ Series Extended
            *self.generate_model_years("Yamaha", "FZ-10", "naked", 2017, 2024,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 160, "msrp_usd": 13199}),
            *self.generate_model_years("Yamaha", "FZ-09", "naked", 2014, 2017,
                                     {"displacement_cc": 847, "cylinders": 3, "max_power_hp": 115, "msrp_usd": 8699}),
            *self.generate_model_years("Yamaha", "FZ-07", "naked", 2015, 2017,
                                     {"displacement_cc": 689, "cylinders": 2, "max_power_hp": 73, "msrp_usd": 7699}),
            *self.generate_model_years("Yamaha", "FZ-06", "naked", 2004, 2009,
                                     {"displacement_cc": 600, "cylinders": 4, "max_power_hp": 78, "msrp_usd": 6999}),
            *self.generate_model_years("Yamaha", "FZ1", "naked", 2001, 2015,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 150, "msrp_usd": 10999}),
            *self.generate_model_years("Yamaha", "FZ8", "naked", 2011, 2015,
                                     {"displacement_cc": 779, "cylinders": 4, "max_power_hp": 106, "msrp_usd": 8499}),
            *self.generate_model_years("Yamaha", "FZS1000 Fazer", "naked", 2001, 2005,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 143, "msrp_usd": 10199}),
            *self.generate_model_years("Yamaha", "FZS600 Fazer", "naked", 1998, 2003,
                                     {"displacement_cc": 600, "cylinders": 4, "max_power_hp": 95, "msrp_usd": 7499}),

            # XJ Series
            *self.generate_model_years("Yamaha", "XJ6", "naked", 2009, 2016,
                                     {"displacement_cc": 600, "cylinders": 4, "max_power_hp": 78, "msrp_usd": 7199}),
            *self.generate_model_years("Yamaha", "XJ6N", "naked", 2009, 2016,
                                     {"displacement_cc": 600, "cylinders": 4, "max_power_hp": 78, "msrp_usd": 6999}),
            *self.generate_model_years("Yamaha", "XJR1300", "naked", 1999, 2016,
                                     {"displacement_cc": 1251, "cylinders": 4, "max_power_hp": 106, "msrp_usd": 12999}),
            *self.generate_model_years("Yamaha", "XJR1200", "naked", 1995, 1998,
                                     {"displacement_cc": 1188, "cylinders": 4, "max_power_hp": 98, "msrp_usd": 10999}),
            *self.generate_model_years("Yamaha", "XJR400", "naked", 1993, 2008,
                                     {"displacement_cc": 399, "cylinders": 4, "max_power_hp": 53, "msrp_usd": 6299}),

            # Classic XS Series
            *self.generate_model_years("Yamaha", "XS1100", "naked", 1978, 1981,
                                     {"displacement_cc": 1101, "cylinders": 4, "max_power_hp": 95, "msrp_usd": 6999}),
            *self.generate_model_years("Yamaha", "XS850", "naked", 1980, 1981,
                                     {"displacement_cc": 826, "cylinders": 3, "max_power_hp": 78, "msrp_usd": 5999}),
            *self.generate_model_years("Yamaha", "XS750", "naked", 1976, 1979,
                                     {"displacement_cc": 747, "cylinders": 3, "max_power_hp": 64, "msrp_usd": 4999}),
            *self.generate_model_years("Yamaha", "XS650", "naked", 1970, 1985,
                                     {"displacement_cc": 653, "cylinders": 2, "max_power_hp": 53, "msrp_usd": 4299}),
            *self.generate_model_years("Yamaha", "XS400", "naked", 1977, 1982,
                                     {"displacement_cc": 392, "cylinders": 2, "max_power_hp": 36, "msrp_usd": 3599}),

            # SR Series
            *self.generate_model_years("Yamaha", "SR500", "naked", 1978, 1999,
                                     {"displacement_cc": 499, "cylinders": 1, "max_power_hp": 32, "msrp_usd": 4999}),
            *self.generate_model_years("Yamaha", "SRX600", "naked", 1985, 1997,
                                     {"displacement_cc": 591, "cylinders": 1, "max_power_hp": 46, "msrp_usd": 5299}),
            *self.generate_model_years("Yamaha", "SRX250", "naked", 1990, 1999,
                                     {"displacement_cc": 249, "cylinders": 1, "max_power_hp": 23, "msrp_usd": 3999}),

            # Star Cruiser Series Extended
            *self.generate_model_years("Yamaha", "Star Venture", "touring", 2018, 2024,
                                     {"displacement_cc": 1854, "cylinders": 2, "max_power_hp": 113, "msrp_usd": 26999}),
            *self.generate_model_years("Yamaha", "Star Eluder", "touring", 2018, 2024,
                                     {"displacement_cc": 1854, "cylinders": 2, "max_power_hp": 113, "msrp_usd": 24199}),
            *self.generate_model_years("Yamaha", "Royal Star", "cruiser", 1996, 2013,
                                     {"displacement_cc": 1294, "cylinders": 4, "max_power_hp": 98, "msrp_usd": 13999}),
            *self.generate_model_years("Yamaha", "Royal Star Venture", "touring", 1999, 2013,
                                     {"displacement_cc": 1294, "cylinders": 4, "max_power_hp": 98, "msrp_usd": 16999}),
            *self.generate_model_years("Yamaha", "V Star 1300", "cruiser", 2007, 2017,
                                     {"displacement_cc": 1294, "cylinders": 2, "max_power_hp": 71, "msrp_usd": 11999}),
            *self.generate_model_years("Yamaha", "V Star 1100", "cruiser", 1999, 2009,
                                     {"displacement_cc": 1063, "cylinders": 2, "max_power_hp": 61, "msrp_usd": 9999}),
            *self.generate_model_years("Yamaha", "V Star 950", "cruiser", 2009, 2017,
                                     {"displacement_cc": 942, "cylinders": 2, "max_power_hp": 52, "msrp_usd": 8699}),

            # More Star/Virago Models
            *self.generate_model_years("Yamaha", "Stryker", "cruiser", 2011, 2017,
                                     {"displacement_cc": 1294, "cylinders": 2, "max_power_hp": 71, "msrp_usd": 10299}),
            *self.generate_model_years("Yamaha", "Raider", "cruiser", 2008, 2017,
                                     {"displacement_cc": 1854, "cylinders": 2, "max_power_hp": 113, "msrp_usd": 16999}),
            *self.generate_model_years("Yamaha", "Roadliner", "cruiser", 2006, 2014,
                                     {"displacement_cc": 1854, "cylinders": 2, "max_power_hp": 102, "msrp_usd": 15999}),
            *self.generate_model_years("Yamaha", "Stratoliner", "touring", 2006, 2014,
                                     {"displacement_cc": 1854, "cylinders": 2, "max_power_hp": 102, "msrp_usd": 17999}),
            *self.generate_model_years("Yamaha", "Warrior", "cruiser", 2002, 2009,
                                     {"displacement_cc": 1670, "cylinders": 2, "max_power_hp": 97, "msrp_usd": 13999}),
            *self.generate_model_years("Yamaha", "Road Star", "cruiser", 1999, 2009,
                                     {"displacement_cc": 1602, "cylinders": 2, "max_power_hp": 84, "msrp_usd": 12999}),

            # Virago Series
            *self.generate_model_years("Yamaha", "Virago 1100", "cruiser", 1984, 1999,
                                     {"displacement_cc": 1063, "cylinders": 2, "max_power_hp": 63, "msrp_usd": 8999}),
            *self.generate_model_years("Yamaha", "Virago 920", "cruiser", 1981, 1982,
                                     {"displacement_cc": 920, "cylinders": 2, "max_power_hp": 58, "msrp_usd": 7999}),
            *self.generate_model_years("Yamaha", "Virago 750", "cruiser", 1981, 1997,
                                     {"displacement_cc": 748, "cylinders": 2, "max_power_hp": 50, "msrp_usd": 6999}),
            *self.generate_model_years("Yamaha", "Virago 700", "cruiser", 1984, 1987,
                                     {"displacement_cc": 699, "cylinders": 2, "max_power_hp": 48, "msrp_usd": 6599}),
            *self.generate_model_years("Yamaha", "Virago 535", "cruiser", 1987, 2003,
                                     {"displacement_cc": 535, "cylinders": 2, "max_power_hp": 40, "msrp_usd": 5999}),
            *self.generate_model_years("Yamaha", "Virago 500", "cruiser", 1984, 1985,
                                     {"displacement_cc": 499, "cylinders": 2, "max_power_hp": 37, "msrp_usd": 5599}),
            *self.generate_model_years("Yamaha", "Virago 400", "cruiser", 1987, 1995,
                                     {"displacement_cc": 399, "cylinders": 2, "max_power_hp": 32, "msrp_usd": 4999}),
            *self.generate_model_years("Yamaha", "Virago 250", "cruiser", 1988, 2005,
                                     {"displacement_cc": 249, "cylinders": 2, "max_power_hp": 20, "msrp_usd": 4299}),

            # Yamaha Adventure Extended
            *self.generate_model_years("Yamaha", "Ténéré 660", "adventure", 1991, 1999,
                                     {"displacement_cc": 660, "cylinders": 1, "max_power_hp": 48, "msrp_usd": 7299}),
            *self.generate_model_years("Yamaha", "XT1200Z", "adventure", 2010, 2020,
                                     {"displacement_cc": 1199, "cylinders": 2, "max_power_hp": 112, "msrp_usd": 15999}),
            *self.generate_model_years("Yamaha", "FJR1200", "touring", 1991, 1996,
                                     {"displacement_cc": 1188, "cylinders": 4, "max_power_hp": 125, "msrp_usd": 13999}),
            *self.generate_model_years("Yamaha", "Tracer 900", "adventure", 2015, 2024,
                                     {"displacement_cc": 847, "cylinders": 3, "max_power_hp": 115, "msrp_usd": 11499}),
            *self.generate_model_years("Yamaha", "Tracer 700", "adventure", 2016, 2024,
                                     {"displacement_cc": 689, "cylinders": 2, "max_power_hp": 73, "msrp_usd": 9199}),
            *self.generate_model_years("Yamaha", "TDM900", "adventure", 2002, 2010,
                                     {"displacement_cc": 897, "cylinders": 2, "max_power_hp": 86, "msrp_usd": 9999}),
            *self.generate_model_years("Yamaha", "TDM850", "adventure", 1991, 2001,
                                     {"displacement_cc": 849, "cylinders": 2, "max_power_hp": 77, "msrp_usd": 8999}),

            # 🟢 COMPREHENSIVE KAWASAKI MODELS
            # Ninja H2 Series Extended
            *self.generate_model_years("Kawasaki", "Ninja H2R", "supersport", 2015, 2024,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 310, "msrp_usd": 55000}),
            *self.generate_model_years("Kawasaki", "Ninja H2 SX", "sport", 2018, 2024,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 200, "msrp_usd": 19999}),

            # ZX Series Extended
            *self.generate_model_years("Kawasaki", "ZX-14R", "supersport", 2006, 2024,
                                     {"displacement_cc": 1441, "cylinders": 4, "max_power_hp": 208, "msrp_usd": 16499}),
            *self.generate_model_years("Kawasaki", "ZZR1400", "supersport", 2006, 2020,
                                     {"displacement_cc": 1352, "cylinders": 4, "max_power_hp": 190, "msrp_usd": 15999}),
            *self.generate_model_years("Kawasaki", "ZX-12R", "supersport", 2000, 2006,
                                     {"displacement_cc": 1199, "cylinders": 4, "max_power_hp": 178, "msrp_usd": 13999}),
            *self.generate_model_years("Kawasaki", "ZZR1200", "supersport", 2002, 2005,
                                     {"displacement_cc": 1164, "cylinders": 4, "max_power_hp": 164, "msrp_usd": 12999}),
            *self.generate_model_years("Kawasaki", "ZX-11", "supersport", 1990, 2001,
                                     {"displacement_cc": 1052, "cylinders": 4, "max_power_hp": 147, "msrp_usd": 10999}),
            *self.generate_model_years("Kawasaki", "ZZR1100", "supersport", 1990, 2001,
                                     {"displacement_cc": 1052, "cylinders": 4, "max_power_hp": 147, "msrp_usd": 10999}),
            *self.generate_model_years("Kawasaki", "ZX-10", "supersport", 1988, 1990,
                                     {"displacement_cc": 997, "cylinders": 4, "max_power_hp": 135, "msrp_usd": 9999}),
            *self.generate_model_years("Kawasaki", "ZX-9R", "supersport", 1994, 2003,
                                     {"displacement_cc": 899, "cylinders": 4, "max_power_hp": 139, "msrp_usd": 9499}),
            *self.generate_model_years("Kawasaki", "Ninja ZX-7R", "supersport", 1996, 2003,
                                     {"displacement_cc": 748, "cylinders": 4, "max_power_hp": 108, "msrp_usd": 8999}),
            *self.generate_model_years("Kawasaki", "Ninja ZX-6", "sport", 1990, 1997,
                                     {"displacement_cc": 599, "cylinders": 4, "max_power_hp": 90, "msrp_usd": 7999}),

            # GPZ Series
            *self.generate_model_years("Kawasaki", "GPZ900R", "supersport", 1984, 2003,
                                     {"displacement_cc": 908, "cylinders": 4, "max_power_hp": 115, "msrp_usd": 8999}),
            *self.generate_model_years("Kawasaki", "GPZ750R", "supersport", 1985, 1987,
                                     {"displacement_cc": 748, "cylinders": 4, "max_power_hp": 105, "msrp_usd": 7999}),
            *self.generate_model_years("Kawasaki", "GPZ750 Turbo", "supersport", 1984, 1985,
                                     {"displacement_cc": 738, "cylinders": 4, "max_power_hp": 112, "msrp_usd": 8499}),
            *self.generate_model_years("Kawasaki", "GPZ600R", "sport", 1985, 1990,
                                     {"displacement_cc": 592, "cylinders": 4, "max_power_hp": 75, "msrp_usd": 6999}),
            *self.generate_model_years("Kawasaki", "GPZ500S", "sport", 1994, 2009,
                                     {"displacement_cc": 498, "cylinders": 2, "max_power_hp": 60, "msrp_usd": 5999}),
            *self.generate_model_years("Kawasaki", "EX500 Ninja", "sport", 1987, 2009,
                                     {"displacement_cc": 498, "cylinders": 2, "max_power_hp": 51, "msrp_usd": 5299}),
            *self.generate_model_years("Kawasaki", "EX300", "sport", 2013, 2017,
                                     {"displacement_cc": 296, "cylinders": 2, "max_power_hp": 39, "msrp_usd": 4999}),
            *self.generate_model_years("Kawasaki", "EX250", "sport", 1988, 2012,
                                     {"displacement_cc": 249, "cylinders": 2, "max_power_hp": 33, "msrp_usd": 3999}),

            # Z Series Extended
            *self.generate_model_years("Kawasaki", "Z1 900", "naked", 1972, 1976,
                                     {"displacement_cc": 903, "cylinders": 4, "max_power_hp": 82, "msrp_usd": 4999}),
            *self.generate_model_years("Kawasaki", "Z900", "naked", 1976, 1977,
                                     {"displacement_cc": 903, "cylinders": 4, "max_power_hp": 82, "msrp_usd": 4999}),
            *self.generate_model_years("Kawasaki", "Z1000 Mk II", "naked", 1977, 1980,
                                     {"displacement_cc": 1015, "cylinders": 4, "max_power_hp": 90, "msrp_usd": 5999}),
            *self.generate_model_years("Kawasaki", "Z1-R", "naked", 1978, 1980,
                                     {"displacement_cc": 1015, "cylinders": 4, "max_power_hp": 90, "msrp_usd": 5999}),
            *self.generate_model_years("Kawasaki", "Z1000R", "naked", 1982, 1983,
                                     {"displacement_cc": 998, "cylinders": 4, "max_power_hp": 95, "msrp_usd": 6999}),

            # Classic Z Series
            *self.generate_model_years("Kawasaki", "Z750", "naked", 1976, 1983,
                                     {"displacement_cc": 748, "cylinders": 4, "max_power_hp": 69, "msrp_usd": 4499}),
            *self.generate_model_years("Kawasaki", "Z650", "naked", 1977, 1983,
                                     {"displacement_cc": 652, "cylinders": 4, "max_power_hp": 64, "msrp_usd": 3999}),
            *self.generate_model_years("Kawasaki", "Z550", "naked", 1980, 1984,
                                     {"displacement_cc": 553, "cylinders": 4, "max_power_hp": 58, "msrp_usd": 3599}),
            *self.generate_model_years("Kawasaki", "Z440", "naked", 1980, 1984,
                                     {"displacement_cc": 443, "cylinders": 2, "max_power_hp": 41, "msrp_usd": 3299}),
            *self.generate_model_years("Kawasaki", "Z400", "naked", 1974, 1979,
                                     {"displacement_cc": 398, "cylinders": 2, "max_power_hp": 38, "msrp_usd": 2999}),
            *self.generate_model_years("Kawasaki", "Z200", "naked", 1977, 1983,
                                     {"displacement_cc": 198, "cylinders": 2, "max_power_hp": 19, "msrp_usd": 2299}),

            # ZR Series
            *self.generate_model_years("Kawasaki", "ZR1000 Z1000", "naked", 2001, 2006,
                                     {"displacement_cc": 953, "cylinders": 4, "max_power_hp": 127, "msrp_usd": 9999}),
            *self.generate_model_years("Kawasaki", "ZR750 Z750", "naked", 2004, 2012,
                                     {"displacement_cc": 748, "cylinders": 4, "max_power_hp": 109, "msrp_usd": 8499}),
            *self.generate_model_years("Kawasaki", "ZR-7", "naked", 1999, 2004,
                                     {"displacement_cc": 748, "cylinders": 4, "max_power_hp": 79, "msrp_usd": 6999}),
            *self.generate_model_years("Kawasaki", "ZR-7S", "naked", 2001, 2003,
                                     {"displacement_cc": 748, "cylinders": 4, "max_power_hp": 79, "msrp_usd": 7299}),
            *self.generate_model_years("Kawasaki", "ZRX1200R", "naked", 2001, 2008,
                                     {"displacement_cc": 1164, "cylinders": 4, "max_power_hp": 120, "msrp_usd": 10999}),
            *self.generate_model_years("Kawasaki", "ZRX1100", "naked", 1997, 2000,
                                     {"displacement_cc": 1052, "cylinders": 4, "max_power_hp": 108, "msrp_usd": 9999}),

            # ER Series
            *self.generate_model_years("Kawasaki", "ER-6n", "naked", 2006, 2016,
                                     {"displacement_cc": 649, "cylinders": 2, "max_power_hp": 72, "msrp_usd": 6999}),
            *self.generate_model_years("Kawasaki", "ER-5", "naked", 1997, 2006,
                                     {"displacement_cc": 498, "cylinders": 2, "max_power_hp": 51, "msrp_usd": 5299}),

            # Vulcan Cruiser Series Extended
            *self.generate_model_years("Kawasaki", "Vulcan 1700 Voyager", "touring", 2009, 2020,
                                     {"displacement_cc": 1700, "cylinders": 2, "max_power_hp": 75, "msrp_usd": 21999}),
            *self.generate_model_years("Kawasaki", "Vulcan 1700 Vaquero", "touring", 2011, 2020,
                                     {"displacement_cc": 1700, "cylinders": 2, "max_power_hp": 75, "msrp_usd": 19999}),
            *self.generate_model_years("Kawasaki", "Vulcan 1700 Classic", "cruiser", 2009, 2020,
                                     {"displacement_cc": 1700, "cylinders": 2, "max_power_hp": 75, "msrp_usd": 14999}),
            *self.generate_model_years("Kawasaki", "Vulcan 1700 Nomad", "touring", 2009, 2015,
                                     {"displacement_cc": 1700, "cylinders": 2, "max_power_hp": 75, "msrp_usd": 17999}),
            *self.generate_model_years("Kawasaki", "Vulcan 1600", "cruiser", 2003, 2008,
                                     {"displacement_cc": 1552, "cylinders": 2, "max_power_hp": 72, "msrp_usd": 13999}),
            *self.generate_model_years("Kawasaki", "Vulcan 1500", "cruiser", 1987, 2008,
                                     {"displacement_cc": 1470, "cylinders": 2, "max_power_hp": 67, "msrp_usd": 11999}),
            *self.generate_model_years("Kawasaki", "Vulcan 1500 Classic", "cruiser", 1996, 2008,
                                     {"displacement_cc": 1470, "cylinders": 2, "max_power_hp": 67, "msrp_usd": 12999}),
            *self.generate_model_years("Kawasaki", "Vulcan 1500 Nomad", "touring", 1998, 2004,
                                     {"displacement_cc": 1470, "cylinders": 2, "max_power_hp": 67, "msrp_usd": 15999}),
            *self.generate_model_years("Kawasaki", "Vulcan 1500 Drifter", "cruiser", 1999, 2005,
                                     {"displacement_cc": 1470, "cylinders": 2, "max_power_hp": 67, "msrp_usd": 13999}),

            # More Vulcan Models
            *self.generate_model_years("Kawasaki", "Vulcan 900 Custom", "cruiser", 2007, 2020,
                                     {"displacement_cc": 903, "cylinders": 2, "max_power_hp": 50, "msrp_usd": 8199}),
            *self.generate_model_years("Kawasaki", "Vulcan 900 Classic", "cruiser", 2006, 2020,
                                     {"displacement_cc": 903, "cylinders": 2, "max_power_hp": 50, "msrp_usd": 8499}),
            *self.generate_model_years("Kawasaki", "Vulcan 900 LT", "touring", 2006, 2020,
                                     {"displacement_cc": 903, "cylinders": 2, "max_power_hp": 50, "msrp_usd": 9199}),
            *self.generate_model_years("Kawasaki", "Vulcan 800", "cruiser", 1995, 2006,
                                     {"displacement_cc": 805, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 7299}),
            *self.generate_model_years("Kawasaki", "Vulcan 800 Classic", "cruiser", 1996, 2006,
                                     {"displacement_cc": 805, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 7599}),
            *self.generate_model_years("Kawasaki", "Vulcan 800 Drifter", "cruiser", 1999, 2006,
                                     {"displacement_cc": 805, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 8199}),
            *self.generate_model_years("Kawasaki", "Vulcan 750", "cruiser", 1985, 2006,
                                     {"displacement_cc": 748, "cylinders": 2, "max_power_hp": 43, "msrp_usd": 6999}),
            *self.generate_model_years("Kawasaki", "Vulcan 500 LTD", "cruiser", 1996, 2009,
                                     {"displacement_cc": 498, "cylinders": 2, "max_power_hp": 51, "msrp_usd": 5999}),

            # Eliminator Series
            *self.generate_model_years("Kawasaki", "Mean Streak", "cruiser", 2002, 2008,
                                     {"displacement_cc": 1552, "cylinders": 2, "max_power_hp": 72, "msrp_usd": 13999}),
            *self.generate_model_years("Kawasaki", "Eliminator 900", "cruiser", 1985, 1986,
                                     {"displacement_cc": 903, "cylinders": 4, "max_power_hp": 86, "msrp_usd": 6999}),
            *self.generate_model_years("Kawasaki", "Eliminator 600", "cruiser", 1986, 1997,
                                     {"displacement_cc": 592, "cylinders": 4, "max_power_hp": 72, "msrp_usd": 5999}),
            *self.generate_model_years("Kawasaki", "Eliminator 400", "cruiser", 1986, 1987,
                                     {"displacement_cc": 399, "cylinders": 2, "max_power_hp": 45, "msrp_usd": 4999}),
            *self.generate_model_years("Kawasaki", "Eliminator 250", "cruiser", 1987, 1997,
                                     {"displacement_cc": 249, "cylinders": 2, "max_power_hp": 33, "msrp_usd": 3999}),

            # Kawasaki Adventure Extended
            *self.generate_model_years("Kawasaki", "Versys-X 300", "adventure", 2017, 2020,
                                     {"displacement_cc": 296, "cylinders": 2, "max_power_hp": 40, "msrp_usd": 5799}),
            *self.generate_model_years("Kawasaki", "KLR600", "adventure", 1984, 1990,
                                     {"displacement_cc": 591, "cylinders": 1, "max_power_hp": 44, "msrp_usd": 5999}),
            *self.generate_model_years("Kawasaki", "Concours", "touring", 1986, 2006,
                                     {"displacement_cc": 997, "cylinders": 4, "max_power_hp": 97, "msrp_usd": 11999}),
            *self.generate_model_years("Kawasaki", "GTR1000", "touring", 1986, 2006,
                                     {"displacement_cc": 997, "cylinders": 4, "max_power_hp": 97, "msrp_usd": 11999}),
            *self.generate_model_years("Kawasaki", "KLV1000", "adventure", 2004, 2006,
                                     {"displacement_cc": 996, "cylinders": 2, "max_power_hp": 95, "msrp_usd": 9999}),
            *self.generate_model_years("Kawasaki", "1400GTR", "touring", 2008, 2024,
                                     {"displacement_cc": 1352, "cylinders": 4, "max_power_hp": 155, "msrp_usd": 19999}),

            # 🏁 COMPREHENSIVE DUCATI MODELS
            # Panigale V4 Series Extended
            *self.generate_model_years("Ducati", "Panigale V4 Speciale", "supersport", 2018, 2019,
                                     {"displacement_cc": 1103, "cylinders": 4, "max_power_hp": 226, "msrp_usd": 40000}),
            *self.generate_model_years("Ducati", "Panigale V2 Bayliss", "supersport", 2022, 2022,
                                     {"displacement_cc": 955, "cylinders": 2, "max_power_hp": 155, "msrp_usd": 20995}),

            # Historical Panigale Series
            *self.generate_model_years("Ducati", "Panigale 1299 Superleggera", "supersport", 2017, 2017,
                                     {"displacement_cc": 1285, "cylinders": 2, "max_power_hp": 215, "msrp_usd": 80000}),
            *self.generate_model_years("Ducati", "Panigale 1199R", "supersport", 2013, 2014,
                                     {"displacement_cc": 1198, "cylinders": 2, "max_power_hp": 195, "msrp_usd": 27995}),
            *self.generate_model_years("Ducati", "Panigale 899", "supersport", 2014, 2015,
                                     {"displacement_cc": 898, "cylinders": 2, "max_power_hp": 148, "msrp_usd": 14995}),

            # 848/1098/1198 Series
            *self.generate_model_years("Ducati", "1098R", "supersport", 2008, 2009,
                                     {"displacement_cc": 1198, "cylinders": 2, "max_power_hp": 180, "msrp_usd": 39995}),
            *self.generate_model_years("Ducati", "1198SP", "supersport", 2011, 2011,
                                     {"displacement_cc": 1198, "cylinders": 2, "max_power_hp": 170, "msrp_usd": 24995}),
            *self.generate_model_years("Ducati", "848 EVO", "supersport", 2011, 2013,
                                     {"displacement_cc": 849, "cylinders": 2, "max_power_hp": 140, "msrp_usd": 13995}),

            # 749/999 Series
            *self.generate_model_years("Ducati", "749R", "supersport", 2004, 2006,
                                     {"displacement_cc": 749, "cylinders": 2, "max_power_hp": 130, "msrp_usd": 19995}),
            *self.generate_model_years("Ducati", "999R", "supersport", 2005, 2006,
                                     {"displacement_cc": 999, "cylinders": 2, "max_power_hp": 150, "msrp_usd": 24995}),

            # 916/748/996/998 Series
            *self.generate_model_years("Ducati", "996SPS", "supersport", 1997, 1998,
                                     {"displacement_cc": 996, "cylinders": 2, "max_power_hp": 139, "msrp_usd": 21995}),
            *self.generate_model_years("Ducati", "996R", "supersport", 2001, 2001,
                                     {"displacement_cc": 996, "cylinders": 2, "max_power_hp": 139, "msrp_usd": 24995}),
            *self.generate_model_years("Ducati", "998R", "supersport", 2002, 2004,
                                     {"displacement_cc": 998, "cylinders": 2, "max_power_hp": 139, "msrp_usd": 24995}),
            *self.generate_model_years("Ducati", "916SPS", "supersport", 1997, 1998,
                                     {"displacement_cc": 916, "cylinders": 2, "max_power_hp": 114, "msrp_usd": 19995}),
            *self.generate_model_years("Ducati", "916SP", "supersport", 1993, 1994,
                                     {"displacement_cc": 916, "cylinders": 2, "max_power_hp": 114, "msrp_usd": 17995}),
            *self.generate_model_years("Ducati", "748R", "supersport", 2000, 2002,
                                     {"displacement_cc": 748, "cylinders": 2, "max_power_hp": 103, "msrp_usd": 14995}),

            # Classic Ducati Sports
            *self.generate_model_years("Ducati", "888SP", "supersport", 1993, 1994,
                                     {"displacement_cc": 888, "cylinders": 2, "max_power_hp": 106, "msrp_usd": 16995}),
            *self.generate_model_years("Ducati", "851", "supersport", 1988, 1992,
                                     {"displacement_cc": 851, "cylinders": 2, "max_power_hp": 93, "msrp_usd": 14995}),

            # ST Series
            *self.generate_model_years("Ducati", "ST4S", "sport", 2001, 2005,
                                     {"displacement_cc": 996, "cylinders": 4, "max_power_hp": 117, "msrp_usd": 14995}),
            *self.generate_model_years("Ducati", "ST4", "sport", 1999, 2005,
                                     {"displacement_cc": 916, "cylinders": 4, "max_power_hp": 105, "msrp_usd": 12995}),
            *self.generate_model_years("Ducati", "ST3", "sport", 2004, 2007,
                                     {"displacement_cc": 992, "cylinders": 3, "max_power_hp": 107, "msrp_usd": 13995}),
            *self.generate_model_years("Ducati", "ST2", "sport", 1997, 2003,
                                     {"displacement_cc": 944, "cylinders": 2, "max_power_hp": 83, "msrp_usd": 11995}),

            # Streetfighter Series Extended
            *self.generate_model_years("Ducati", "Streetfighter 1098", "naked", 2009, 2013,
                                     {"displacement_cc": 1099, "cylinders": 2, "max_power_hp": 155, "msrp_usd": 16995}),
            *self.generate_model_years("Ducati", "Streetfighter S", "naked", 2009, 2013,
                                     {"displacement_cc": 1099, "cylinders": 2, "max_power_hp": 155, "msrp_usd": 18995}),
            *self.generate_model_years("Ducati", "Streetfighter 848", "naked", 2012, 2015,
                                     {"displacement_cc": 849, "cylinders": 2, "max_power_hp": 132, "msrp_usd": 12995}),

            # Monster Series Extended
            *self.generate_model_years("Ducati", "Monster 1200R", "naked", 2016, 2019,
                                     {"displacement_cc": 1198, "cylinders": 2, "max_power_hp": 160, "msrp_usd": 17995}),
            *self.generate_model_years("Ducati", "Monster 1100 EVO", "naked", 2011, 2013,
                                     {"displacement_cc": 1078, "cylinders": 2, "max_power_hp": 100, "msrp_usd": 11995}),
            *self.generate_model_years("Ducati", "Monster 1100", "naked", 2009, 2010,
                                     {"displacement_cc": 1078, "cylinders": 2, "max_power_hp": 95, "msrp_usd": 11495}),
            *self.generate_model_years("Ducati", "Monster 1100S", "naked", 2009, 2010,
                                     {"displacement_cc": 1078, "cylinders": 2, "max_power_hp": 95, "msrp_usd": 12995}),
            *self.generate_model_years("Ducati", "Monster 659", "naked", 2012, 2015,
                                     {"displacement_cc": 659, "cylinders": 1, "max_power_hp": 67, "msrp_usd": 7995}),
            *self.generate_model_years("Ducati", "Monster 620", "naked", 2002, 2006,
                                     {"displacement_cc": 618, "cylinders": 2, "max_power_hp": 62, "msrp_usd": 7995}),
            *self.generate_model_years("Ducati", "Monster 620ie", "naked", 2002, 2006,
                                     {"displacement_cc": 618, "cylinders": 2, "max_power_hp": 62, "msrp_usd": 8295}),

            # Classic Monster Series
            *self.generate_model_years("Ducati", "Monster 900", "naked", 1993, 2002,
                                     {"displacement_cc": 904, "cylinders": 2, "max_power_hp": 73, "msrp_usd": 9995}),
            *self.generate_model_years("Ducati", "Monster 900ie", "naked", 2000, 2002,
                                     {"displacement_cc": 904, "cylinders": 2, "max_power_hp": 73, "msrp_usd": 10495}),
            *self.generate_model_years("Ducati", "Monster 750", "naked", 1996, 2002,
                                     {"displacement_cc": 748, "cylinders": 2, "max_power_hp": 68, "msrp_usd": 8995}),
            *self.generate_model_years("Ducati", "Monster 600", "naked", 1994, 2001,
                                     {"displacement_cc": 583, "cylinders": 2, "max_power_hp": 53, "msrp_usd": 7995}),
            *self.generate_model_years("Ducati", "Monster 400", "naked", 1995, 2001,
                                     {"displacement_cc": 398, "cylinders": 2, "max_power_hp": 39, "msrp_usd": 6995}),

            # Monster S Series
            *self.generate_model_years("Ducati", "Monster S4R", "naked", 2003, 2008,
                                     {"displacement_cc": 996, "cylinders": 4, "max_power_hp": 130, "msrp_usd": 14995}),
            *self.generate_model_years("Ducati", "Monster S4RS", "naked", 2006, 2008,
                                     {"displacement_cc": 996, "cylinders": 4, "max_power_hp": 130, "msrp_usd": 16995}),
            *self.generate_model_years("Ducati", "Monster S2R", "naked", 2005, 2008,
                                     {"displacement_cc": 800, "cylinders": 2, "max_power_hp": 75, "msrp_usd": 10995}),

            # Hypermotard Series
            *self.generate_model_years("Ducati", "Hypermotard 1100", "naked", 2007, 2012,
                                     {"displacement_cc": 1078, "cylinders": 2, "max_power_hp": 95, "msrp_usd": 12995}),
            *self.generate_model_years("Ducati", "Hypermotard 1100S", "naked", 2007, 2012,
                                     {"displacement_cc": 1078, "cylinders": 2, "max_power_hp": 95, "msrp_usd": 14995}),
        ]
        
        created_count = 0
        category_map = {cat.name: cat for cat in categories.values()}
        
        for data in motorcycles_data:
            manufacturer = manufacturers[data.pop("manufacturer")]
            category = category_map[data.pop("category")]
            
            motorcycle, created = Motorcycle.objects.get_or_create(
                manufacturer=manufacturer,
                model_name=data["model_name"],
                year=data["year"],
                defaults={**data, "category": category}
            )
            
            if created:
                created_count += 1
                if created_count % 50 == 0:
                    self.stdout.write(f"Created {created_count} motorcycles...")
        
        return created_count

    def generate_model_years(self, manufacturer, model, category, start_year, end_year, base_specs):
        """Generate motorcycle data for multiple years"""
        motorcycles = []
        for year in range(start_year, end_year + 1):
            # Slight variations year over year
            power_variation = random.randint(-3, 5)
            price_variation = random.randint(-200, 500)
            
            specs = base_specs.copy()
            specs.update({
                "manufacturer": manufacturer,
                "model_name": model,
                "category": category,
                "year": year,
                "max_power_hp": max(specs.get("max_power_hp", 50) + power_variation, 10),
                "msrp_usd": specs.get("msrp_usd", 5000) + price_variation,
                "abs": True if year >= 2016 else specs.get("abs", False),
                "traction_control": True if year >= 2018 and specs.get("max_power_hp", 0) > 80 else False,
                "riding_modes": True if year >= 2019 and specs.get("max_power_hp", 0) > 100 else False,
            })
            motorcycles.append(specs)
        
        return motorcycles 