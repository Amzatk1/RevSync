"""
Django management command to remove potentially infringing branded content
This ensures App Store compliance by removing unauthorized brand usage
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from tunes.models import TuneCreator, Tune


class Command(BaseCommand):
    help = 'Remove potentially infringing branded content for App Store compliance'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING('Removing potentially infringing branded content...')
        )

        # Remove branded creators and their tunes
        branded_creators = [
            'athena_get_ecu',
            'woolich_racing_tuned', 
            'vcyclenut_remote_tuning'
        ]
        
        removed_tunes = 0
        removed_creators = 0
        
        for creator_username in branded_creators:
            try:
                creator = TuneCreator.objects.get(user__username=creator_username)
                tune_count = creator.tunes.count()
                
                # Remove all tunes by this creator
                creator.tunes.all().delete()
                removed_tunes += tune_count
                
                # Remove the creator and user
                user = creator.user
                creator.delete()
                user.delete()
                removed_creators += 1
                
                self.stdout.write(f"Removed creator '{creator_username}' and {tune_count} tunes")
                
            except TuneCreator.DoesNotExist:
                self.stdout.write(f"Creator '{creator_username}' not found")

        # Remove specific branded tunes by name (in case they exist under different creators)
        branded_tune_names = [
            'GET ECU Off-Road Performance Map',
            'Woolich Racing Kawasaki ZX-10R MapShare', 
            'VCycleNut Remote Tuned Yamaha R1',
            'GET ECU Launch Control',
            'Multi-Brand Flash Tool',
            'Professional Dyno Optimization Package'
        ]
        
        for tune_name in branded_tune_names:
            deleted_count = Tune.objects.filter(name=tune_name).delete()[0]
            if deleted_count > 0:
                self.stdout.write(f"Removed tune: '{tune_name}'")
                removed_tunes += deleted_count

        self.stdout.write(
            self.style.SUCCESS(f'\n=== Cleanup Complete ===')
        )
        self.stdout.write(f'Removed {removed_creators} branded creators')
        self.stdout.write(f'Removed {removed_tunes} potentially infringing tunes')
        self.stdout.write(
            self.style.SUCCESS('Platform is now safer for App Store submission')
        ) 