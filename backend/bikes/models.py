from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal


class Manufacturer(models.Model):
    """Motorcycle manufacturers"""
    name = models.CharField(max_length=100, unique=True, db_index=True)
    country = models.CharField(max_length=100)
    founded_year = models.PositiveIntegerField(null=True, blank=True)
    website = models.URLField(blank=True)
    logo_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bike_manufacturers'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


class EngineType(models.Model):
    """Engine configurations"""
    CYLINDER_CHOICES = [
        ('single', 'Single Cylinder'),
        ('parallel_twin', 'Parallel Twin'),
        ('v_twin', 'V-Twin'),
        ('inline_three', 'Inline Three'),
        ('inline_four', 'Inline Four'),
        ('v_four', 'V-Four'),
        ('inline_six', 'Inline Six'),
        ('boxer', 'Boxer'),
        ('rotary', 'Rotary'),
    ]
    
    COOLING_CHOICES = [
        ('air', 'Air Cooled'),
        ('liquid', 'Liquid Cooled'),
        ('oil', 'Oil Cooled'),
    ]
    
    FUEL_SYSTEM_CHOICES = [
        ('carburetor', 'Carburetor'),
        ('fuel_injection', 'Fuel Injection'),
        ('direct_injection', 'Direct Injection'),
    ]

    name = models.CharField(max_length=100, unique=True, db_index=True)
    configuration = models.CharField(max_length=20, choices=CYLINDER_CHOICES)
    cooling_system = models.CharField(max_length=20, choices=COOLING_CHOICES)
    fuel_system = models.CharField(max_length=20, choices=FUEL_SYSTEM_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bike_engine_types'
        indexes = [
            models.Index(fields=['configuration']),
            models.Index(fields=['fuel_system']),
        ]

    def __str__(self):
        return f"{self.name} ({self.configuration})"


class BikeCategory(models.Model):
    """Motorcycle categories"""
    CATEGORY_CHOICES = [
        ('sport', 'Sport'),
        ('supersport', 'Supersport'),
        ('naked', 'Naked'),
        ('touring', 'Touring'),
        ('cruiser', 'Cruiser'),
        ('adventure', 'Adventure'),
        ('dual_sport', 'Dual Sport'),
        ('dirt_bike', 'Dirt Bike'),
        ('scooter', 'Scooter'),
        ('electric', 'Electric'),
        ('cafe_racer', 'Cafe Racer'),
        ('bobber', 'Bobber'),
        ('chopper', 'Chopper'),
    ]

    name = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True, db_index=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bike_categories'
        verbose_name_plural = 'Bike Categories'

    def __str__(self):
        return self.get_name_display()


class Motorcycle(models.Model):
    """Complete motorcycle model database"""
    manufacturer = models.ForeignKey(Manufacturer, on_delete=models.CASCADE, db_index=True)
    model_name = models.CharField(max_length=100, db_index=True)
    year = models.PositiveIntegerField(
        validators=[MinValueValidator(1900), MaxValueValidator(2030)],
        db_index=True
    )
    category = models.ForeignKey(BikeCategory, on_delete=models.CASCADE, db_index=True)
    engine_type = models.ForeignKey(EngineType, on_delete=models.CASCADE, null=True, blank=True)
    
    # Engine Specifications
    displacement_cc = models.PositiveIntegerField(
        validators=[MinValueValidator(50), MaxValueValidator(3000)],
        db_index=True
    )
    cylinders = models.PositiveSmallIntegerField(default=1)
    bore_mm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    stroke_mm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    compression_ratio = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    max_power_hp = models.PositiveIntegerField(null=True, blank=True)
    max_power_rpm = models.PositiveIntegerField(null=True, blank=True)
    max_torque_nm = models.PositiveIntegerField(null=True, blank=True)
    max_torque_rpm = models.PositiveIntegerField(null=True, blank=True)
    
    # Physical Specifications
    dry_weight_kg = models.PositiveIntegerField(null=True, blank=True)
    wet_weight_kg = models.PositiveIntegerField(null=True, blank=True)
    seat_height_mm = models.PositiveIntegerField(null=True, blank=True)
    wheelbase_mm = models.PositiveIntegerField(null=True, blank=True)
    fuel_capacity_liters = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Performance
    top_speed_kmh = models.PositiveIntegerField(null=True, blank=True)
    acceleration_0_100_seconds = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    fuel_consumption_l100km = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    
    # Transmission
    TRANSMISSION_CHOICES = [
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
        ('cvt', 'CVT'),
        ('dct', 'Dual Clutch'),
    ]
    transmission_type = models.CharField(max_length=20, choices=TRANSMISSION_CHOICES, default='manual')
    gears = models.PositiveSmallIntegerField(default=6)
    
    # Electronics & Features
    abs = models.BooleanField(default=False, db_index=True)
    traction_control = models.BooleanField(default=False)
    riding_modes = models.BooleanField(default=False)
    quickshifter = models.BooleanField(default=False)
    cruise_control = models.BooleanField(default=False)
    electronic_suspension = models.BooleanField(default=False)
    
    # Pricing & Availability
    msrp_usd = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    production_start_year = models.PositiveIntegerField(null=True, blank=True)
    production_end_year = models.PositiveIntegerField(null=True, blank=True)
    is_discontinued = models.BooleanField(default=False, db_index=True)
    
    # Media
    primary_image_url = models.URLField(blank=True)
    gallery_images = models.JSONField(default=list, blank=True)
    
    # Metadata
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'motorcycles'
        unique_together = ['manufacturer', 'model_name', 'year']
        indexes = [
            models.Index(fields=['manufacturer', 'model_name']),
            models.Index(fields=['year']),
            models.Index(fields=['displacement_cc']),
            models.Index(fields=['category']),
            models.Index(fields=['max_power_hp']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_discontinued']),
            models.Index(fields=['abs']),
            models.Index(fields=['msrp_usd']),
        ]
        ordering = ['manufacturer__name', 'model_name', '-year']

    def __str__(self):
        return f"{self.manufacturer.name} {self.model_name} ({self.year})"

    @property
    def full_name(self):
        return f"{self.manufacturer.name} {self.model_name}"

    @property
    def power_to_weight_ratio(self):
        """Calculate power-to-weight ratio in HP/kg"""
        if self.max_power_hp and self.dry_weight_kg:
            return round(self.max_power_hp / self.dry_weight_kg, 2)
        return None


class ECUType(models.Model):
    """ECU (Engine Control Unit) types for different motorcycles"""
    name = models.CharField(max_length=100, unique=True, db_index=True)
    manufacturer = models.CharField(max_length=100)  # Bosch, Magneti Marelli, etc.
    version = models.CharField(max_length=50, blank=True)
    
    # Technical specifications
    processor = models.CharField(max_length=100, blank=True)
    memory_kb = models.PositiveIntegerField(null=True, blank=True)
    flash_memory_kb = models.PositiveIntegerField(null=True, blank=True)
    
    # Tuning capabilities
    is_tunable = models.BooleanField(default=True, db_index=True)
    requires_cable = models.BooleanField(default=True)
    supports_obd = models.BooleanField(default=False)
    supports_can_bus = models.BooleanField(default=True)
    
    # Communication protocols
    PROTOCOL_CHOICES = [
        ('kline', 'K-Line'),
        ('can', 'CAN Bus'),
        ('uart', 'UART'),
        ('spi', 'SPI'),
        ('i2c', 'I2C'),
    ]
    communication_protocol = models.CharField(max_length=20, choices=PROTOCOL_CHOICES, default='can')
    baud_rate = models.PositiveIntegerField(default=500000)  # Default CAN baud rate
    
    # File formats
    supported_formats = models.JSONField(default=list)  # ['bin', 'hex', 'ecu']
    backup_format = models.CharField(max_length=10, default='bin')
    
    # Safety & Validation
    requires_immobilizer_bypass = models.BooleanField(default=False)
    checksum_validation = models.BooleanField(default=True)
    
    # Metadata
    description = models.TextField(blank=True)
    documentation_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ecu_types'
        indexes = [
            models.Index(fields=['manufacturer']),
            models.Index(fields=['is_tunable']),
            models.Index(fields=['communication_protocol']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.manufacturer} {self.name}"


class MotorcycleECU(models.Model):
    """ECU compatibility mapping for motorcycles"""
    motorcycle = models.ForeignKey(Motorcycle, on_delete=models.CASCADE, related_name='ecus')
    ecu_type = models.ForeignKey(ECUType, on_delete=models.CASCADE)
    
    # ECU specific details for this motorcycle
    part_number = models.CharField(max_length=100, blank=True)
    software_version = models.CharField(max_length=50, blank=True)
    hardware_version = models.CharField(max_length=50, blank=True)
    
    # Installation details
    location = models.CharField(max_length=200, blank=True)  # "Under seat, left side"
    connector_type = models.CharField(max_length=100, blank=True)
    pin_count = models.PositiveSmallIntegerField(null=True, blank=True)
    
    # Tuning specific
    memory_address_start = models.CharField(max_length=20, blank=True)  # Hex address
    memory_address_end = models.CharField(max_length=20, blank=True)
    checksum_location = models.CharField(max_length=20, blank=True)
    
    # Regional variations
    market_region = models.CharField(max_length=50, blank=True)  # US, EU, Asia, etc.
    emissions_standard = models.CharField(max_length=20, blank=True)  # Euro 4, Euro 5, EPA
    
    # Status
    is_primary = models.BooleanField(default=True)  # Primary ECU for this bike
    is_verified = models.BooleanField(default=False, db_index=True)
    verification_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'motorcycle_ecus'
        unique_together = ['motorcycle', 'ecu_type', 'market_region']
        indexes = [
            models.Index(fields=['motorcycle']),
            models.Index(fields=['ecu_type']),
            models.Index(fields=['is_primary']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['market_region']),
        ]

    def __str__(self):
        return f"{self.motorcycle} - {self.ecu_type}"


class BikeSpecification(models.Model):
    """Additional detailed specifications for motorcycles"""
    motorcycle = models.OneToOneField(Motorcycle, on_delete=models.CASCADE, related_name='specifications')
    
    # Detailed Engine Specs
    valve_configuration = models.CharField(max_length=50, blank=True)  # DOHC, SOHC, OHV
    valves_per_cylinder = models.PositiveSmallIntegerField(null=True, blank=True)
    ignition_system = models.CharField(max_length=100, blank=True)
    starter_system = models.CharField(max_length=50, blank=True)  # Electric, Kick
    lubrication_system = models.CharField(max_length=100, blank=True)
    oil_capacity_liters = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Chassis & Suspension
    frame_type = models.CharField(max_length=100, blank=True)  # Trellis, Perimeter, etc.
    frame_material = models.CharField(max_length=50, blank=True)  # Steel, Aluminum, etc.
    swingarm_type = models.CharField(max_length=100, blank=True)
    
    front_suspension = models.CharField(max_length=200, blank=True)
    front_suspension_travel_mm = models.PositiveIntegerField(null=True, blank=True)
    rear_suspension = models.CharField(max_length=200, blank=True)
    rear_suspension_travel_mm = models.PositiveIntegerField(null=True, blank=True)
    
    # Brakes & Wheels
    front_brake_type = models.CharField(max_length=100, blank=True)
    front_brake_disc_size_mm = models.PositiveIntegerField(null=True, blank=True)
    rear_brake_type = models.CharField(max_length=100, blank=True)
    rear_brake_disc_size_mm = models.PositiveIntegerField(null=True, blank=True)
    
    front_tire_size = models.CharField(max_length=50, blank=True)
    rear_tire_size = models.CharField(max_length=50, blank=True)
    front_wheel_size = models.CharField(max_length=20, blank=True)
    rear_wheel_size = models.CharField(max_length=20, blank=True)
    
    # Dimensions
    overall_length_mm = models.PositiveIntegerField(null=True, blank=True)
    overall_width_mm = models.PositiveIntegerField(null=True, blank=True)
    overall_height_mm = models.PositiveIntegerField(null=True, blank=True)
    ground_clearance_mm = models.PositiveIntegerField(null=True, blank=True)
    
    # Additional Features
    headlight_type = models.CharField(max_length=50, blank=True)  # LED, Halogen, etc.
    instruments = models.TextField(blank=True)
    connectivity_features = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bike_specifications'

    def __str__(self):
        return f"Specifications for {self.motorcycle}"


class BikeImage(models.Model):
    """Image gallery for motorcycles"""
    IMAGE_TYPES = [
        ('main', 'Main Product Image'),
        ('side', 'Side View'),
        ('front', 'Front View'),
        ('rear', 'Rear View'),
        ('engine', 'Engine Detail'),
        ('instrument', 'Instrument Cluster'),
        ('gallery', 'Gallery Image'),
    ]

    motorcycle = models.ForeignKey(Motorcycle, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField()
    image_type = models.CharField(max_length=20, choices=IMAGE_TYPES, default='gallery')
    caption = models.CharField(max_length=200, blank=True)
    alt_text = models.CharField(max_length=200, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bike_images'
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['motorcycle', 'image_type']),
            models.Index(fields=['order']),
        ]

    def __str__(self):
        return f"{self.motorcycle} - {self.get_image_type_display()}"


class BikeReview(models.Model):
    """Professional and user reviews for motorcycles"""
    REVIEW_TYPES = [
        ('professional', 'Professional Review'),
        ('user', 'User Review'),
        ('editorial', 'Editorial'),
    ]

    motorcycle = models.ForeignKey(Motorcycle, on_delete=models.CASCADE, related_name='reviews')
    review_type = models.CharField(max_length=20, choices=REVIEW_TYPES, default='professional')
    source = models.CharField(max_length=100)  # Magazine, website, etc.
    author = models.CharField(max_length=100, blank=True)
    title = models.CharField(max_length=200)
    content = models.TextField()
    rating = models.DecimalField(
        max_digits=3, decimal_places=1,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True, blank=True
    )
    review_url = models.URLField(blank=True)
    published_date = models.DateField(null=True, blank=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bike_reviews'
        indexes = [
            models.Index(fields=['motorcycle', 'review_type']),
            models.Index(fields=['rating']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['published_date']),
        ]

    def __str__(self):
        return f"{self.motorcycle} - {self.title}"
