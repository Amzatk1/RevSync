# Contributing to RevSync 🤝

Thank you for your interest in contributing to RevSync! This guide will help you get started with contributing to our motorcycle tuning platform.

## 🌟 How to Contribute

We welcome contributions in many forms:

- 🐛 **Bug Reports**: Help us identify and fix issues
- 💡 **Feature Requests**: Suggest new functionality
- 📝 **Code Contributions**: Submit pull requests
- 📚 **Documentation**: Improve our docs
- 🏍️ **Data Contributions**: Add motorcycle specifications or tunes
- 🧪 **Testing**: Help test new features

## 🚀 Getting Started

### 1. Fork & Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/RevSync.git
cd RevSync

# Add upstream remote
git remote add upstream https://github.com/original-owner/RevSync.git
```

### 2. Development Setup

```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate

# Mobile setup
cd ../mobile
npm install

# Install development tools
npm install -g react-native-cli
pip install pre-commit flake8 black
```

### 3. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

## 📋 Development Guidelines

### Backend (Django)

#### Code Style
- Follow **PEP 8** style guide
- Use **Black** for code formatting
- Run **flake8** for linting
- Maximum line length: 88 characters

```bash
# Format code
black .

# Check linting
flake8 .

# Run tests
python manage.py test
```

#### Django Best Practices
- Use class-based views for consistency
- Implement proper serializers for all models
- Add appropriate permissions and authentication
- Write comprehensive docstrings
- Use select_related/prefetch_related for optimization

#### Example Code Style

```python
class MotorcycleListView(generics.ListAPIView):
    """
    API endpoint for listing motorcycles with filtering and search.
    
    Supports filtering by manufacturer, category, displacement, and price.
    Includes pagination and search functionality.
    """
    queryset = Motorcycle.objects.select_related('manufacturer', 'category')
    serializer_class = MotorcycleListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['manufacturer', 'category', 'year']
    search_fields = ['name', 'manufacturer__name']
    ordering_fields = ['name', 'year', 'price', 'engine_displacement']
    permission_classes = [IsAuthenticatedOrReadOnly]
```

### Mobile (React Native)

#### Code Style
- Use **TypeScript** for all new code
- Follow **ESLint** and **Prettier** configurations
- Use functional components with hooks
- Implement proper error boundaries

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

#### React Native Best Practices
- Use Redux Toolkit for state management
- Implement proper navigation patterns
- Handle loading and error states
- Use TypeScript interfaces for API responses
- Implement proper error handling

#### Example Code Style

```typescript
interface MotorcycleListProps {
  navigation: NavigationProp<any>;
  motorcycles: Motorcycle[];
  loading: boolean;
  error: string | null;
}

const MotorcycleList: React.FC<MotorcycleListProps> = ({
  navigation,
  motorcycles,
  loading,
  error,
}) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchMotorcycles());
  }, [dispatch]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <FlatList
      data={motorcycles}
      renderItem={({ item }) => (
        <MotorcycleCard
          motorcycle={item}
          onPress={() => navigation.navigate('MotorcycleDetail', { id: item.id })}
        />
      )}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};
```

## 🧪 Testing Guidelines

### Backend Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test bikes

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

#### Test Structure
```python
class MotorcycleAPITestCase(APITestCase):
    def setUp(self):
        self.manufacturer = Manufacturer.objects.create(name="Honda")
        self.motorcycle = Motorcycle.objects.create(
            name="CBR1000RR",
            manufacturer=self.manufacturer,
            year=2023
        )

    def test_motorcycle_list_endpoint(self):
        """Test motorcycle list API returns correct data."""
        url = reverse('motorcycle-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'CBR1000RR')
```

### Mobile Testing

```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

#### Test Structure
```typescript
describe('MotorcycleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch motorcycles successfully', async () => {
    const mockMotorcycles = [
      { id: 1, name: 'CBR1000RR', manufacturer: 'Honda' }
    ];
    
    (api.get as jest.Mock).mockResolvedValue({
      data: { results: mockMotorcycles }
    });

    const result = await motorcycleService.getMotorcycles();
    
    expect(result).toEqual(mockMotorcycles);
    expect(api.get).toHaveBeenCalledWith('/bikes/motorcycles/');
  });
});
```

## 📝 Commit Guidelines

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

#### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

#### Examples

```bash
feat(bikes): add motorcycle filtering by displacement
fix(api): resolve CORS issue for mobile app
docs(readme): update setup instructions
test(tunes): add unit tests for tune marketplace
```

## 🏍️ Adding Motorcycle Data

### Motorcycle Specifications

When adding new motorcycles, ensure complete and accurate data:

```python
# Required fields
{
    "name": "CBR1000RR-R Fireblade SP",
    "manufacturer": "Honda",
    "year": 2023,
    "category": "Supersport",
    "engine_displacement": 999,
    "engine_configuration": "Inline-4",
    "power_hp": 217,
    "torque_nm": 113,
    "weight_kg": 201,
    "price_usd": 28500,
    "top_speed_kmh": 299,
    "fuel_capacity_liters": 16.1,
    "abs": true,
    "traction_control": true,
    "riding_modes": "4 modes",
    "primary_image_url": "path/to/image.jpg"
}
```

### Data Sources
- Official manufacturer specifications
- Verified motorcycle review sites
- Industry publications
- Public domain databases

## 🎯 Adding Tune Data

### Tune Verification Process

All tunes must be:
1. **Legal**: From open-source communities
2. **Verified**: Tested and validated
3. **Safe**: Include backup/restore procedures
4. **Documented**: Clear installation instructions

```python
# Tune data structure
{
    "name": "Performance ECU Flash",
    "creator": "TuneECU Community",
    "category": "Performance",
    "compatible_motorcycles": ["CBR1000RR", "CBR600RR"],
    "description": "Optimized fuel mapping for track use",
    "version": "1.2.0",
    "is_free": true,
    "installation_guide": "detailed_instructions.md",
    "backup_required": true,
    "safety_warnings": ["Track use only", "Professional installation recommended"]
}
```

## 📋 Pull Request Process

### Before Submitting

1. **Update from upstream**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run all tests**
   ```bash
   # Backend
   python manage.py test
   
   # Mobile
   npm test
   ```

3. **Check code quality**
   ```bash
   # Backend
   flake8 .
   black --check .
   
   # Mobile
   npm run lint
   npm run type-check
   ```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Added new tests
- [ ] All existing tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## 🐛 Bug Reports

### Bug Report Template

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g. iOS 15, Android 12]
- Device: [e.g. iPhone 13, Pixel 6]
- App Version: [e.g. 1.0.0]
- Backend Version: [e.g. 1.0.0]

**Additional Context**
Any other information about the problem
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Clear description of the requested feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered

**Additional Context**
Any other context or screenshots
```

## 📚 Documentation

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up to date with code changes
- Follow markdown best practices

### Documentation Structure

```
docs/
├── api/              # API documentation
├── guides/           # User guides
├── development/      # Development guides
├── deployment/       # Deployment guides
└── troubleshooting/  # Common issues and solutions
```

## 🏆 Recognition

Contributors will be recognized in:
- README.md acknowledgments
- Release notes
- Contributors page
- Project documentation

## 📞 Getting Help

- **GitHub Discussions**: Ask questions and get help
- **GitHub Issues**: Report bugs and request features
- **Discord**: Real-time community chat
- **Email**: Direct contact for sensitive issues

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

By contributing to RevSync, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to RevSync!** 🏍️💨

*Every contribution, no matter how small, helps make RevSync better for the entire motorcycle community.* 