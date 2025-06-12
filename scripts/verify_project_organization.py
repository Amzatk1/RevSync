#!/usr/bin/env python3
"""
RevSync Project Organization Verification Script

This script verifies that all components of the RevSync project are properly organized
and can communicate with each other.
"""

import os
import sys
import json
import subprocess
import requests
import time
from pathlib import Path
from typing import Dict, List, Tuple, Optional

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

class ProjectVerifier:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.backend_url = "http://localhost:8000"
        self.results = {}
        
    def print_header(self, title: str):
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{title.center(60)}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    
    def print_success(self, message: str):
        print(f"{Colors.GREEN}✅ {message}{Colors.END}")
    
    def print_error(self, message: str):
        print(f"{Colors.RED}❌ {message}{Colors.END}")
    
    def print_warning(self, message: str):
        print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")
    
    def print_info(self, message: str):
        print(f"{Colors.CYAN}ℹ️  {message}{Colors.END}")

    def verify_directory_structure(self) -> bool:
        """Verify the project directory structure"""
        self.print_header("DIRECTORY STRUCTURE VERIFICATION")
        
        required_paths = [
            # Main directories
            "backend",
            "mobile",
            "docs",
            
            # Backend structure
            "backend/manage.py",
            "backend/requirements.txt",
            "backend/revsync",
            "backend/bikes",
            "backend/tunes",
            "backend/static",
            
            # Mobile structure
            "mobile/src",
            "mobile/package.json",
            "mobile/src/services",
            "mobile/src/config",
            
            # Documentation
            "README.md",
            "ROADMAP.md",
            "docs/FEATURE_SPECIFICATIONS.md",
            "docs/HARDWARE_INTEGRATION.md"
        ]
        
        missing_paths = []
        for path in required_paths:
            full_path = self.project_root / path
            if full_path.exists():
                self.print_success(f"Found: {path}")
            else:
                self.print_error(f"Missing: {path}")
                missing_paths.append(path)
        
        if missing_paths:
            self.print_warning(f"Missing {len(missing_paths)} required paths")
            return False
        else:
            self.print_success("All required directories and files present")
            return True

    def verify_backend_setup(self) -> bool:
        """Verify Django backend setup"""
        self.print_header("BACKEND SETUP VERIFICATION")
        
        backend_dir = self.project_root / "backend"
        
        # Check if manage.py exists
        manage_py = backend_dir / "manage.py"
        if not manage_py.exists():
            self.print_error("manage.py not found in backend directory")
            return False
        
        # Check requirements.txt
        requirements = backend_dir / "requirements.txt"
        if requirements.exists():
            self.print_success("requirements.txt found")
            try:
                with open(requirements, 'r') as f:
                    deps = f.read()
                    required_deps = ['django', 'djangorestframework', 'django-filter']
                    for dep in required_deps:
                        if dep.lower() in deps.lower():
                            self.print_success(f"Required dependency found: {dep}")
                        else:
                            self.print_warning(f"Required dependency missing: {dep}")
            except Exception as e:
                self.print_error(f"Could not read requirements.txt: {e}")
        
        # Check if Django project can be checked
        try:
            os.chdir(backend_dir)
            result = subprocess.run(['python', 'manage.py', 'check'], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                self.print_success("Django project check passed")
                return True
            else:
                self.print_error(f"Django check failed: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            self.print_error("Django check timed out")
            return False
        except Exception as e:
            self.print_error(f"Could not run Django check: {e}")
            return False
        finally:
            os.chdir(self.project_root)

    def verify_backend_api(self) -> bool:
        """Verify backend API is working"""
        self.print_header("BACKEND API VERIFICATION")
        
        # Check if server is running
        try:
            response = requests.get(f"{self.backend_url}/api/bikes/stats/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.print_success("Backend API is responding")
                self.print_info(f"Database contains:")
                self.print_info(f"  - {data.get('total_motorcycles', 0)} motorcycles")
                self.print_info(f"  - {data.get('manufacturers', 0)} manufacturers")
                self.print_info(f"  - {data.get('categories', 0)} categories")
                return True
            else:
                self.print_error(f"Backend API returned status {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            self.print_error("Cannot connect to backend API - is the server running?")
            self.print_info("Try running: cd backend && python manage.py runserver 8000")
            return False
        except Exception as e:
            self.print_error(f"Backend API check failed: {e}")
            return False

    def verify_mobile_setup(self) -> bool:
        """Verify mobile app setup"""
        self.print_header("MOBILE APP SETUP VERIFICATION")
        
        mobile_dir = self.project_root / "mobile"
        
        # Check package.json
        package_json = mobile_dir / "package.json"
        if not package_json.exists():
            self.print_error("package.json not found in mobile directory")
            return False
        
        try:
            with open(package_json, 'r') as f:
                package_data = json.load(f)
            
            self.print_success("package.json found and valid")
            
            # Check important dependencies
            dependencies = package_data.get('dependencies', {})
            required_deps = [
                'react-native',
                '@react-navigation/native',
                'axios',
                'react-redux',
                '@reduxjs/toolkit'
            ]
            
            for dep in required_deps:
                if dep in dependencies:
                    self.print_success(f"Required dependency found: {dep}")
                else:
                    self.print_warning(f"Required dependency missing: {dep}")
            
            # Check if node_modules exists (dependencies installed)
            node_modules = mobile_dir / "node_modules"
            root_node_modules = self.project_root / "node_modules"
            
            if node_modules.exists():
                self.print_success("Mobile node_modules directory found - dependencies installed")
            elif root_node_modules.exists():
                self.print_success("Root node_modules found - monorepo structure detected")
                # Check if React Native dependencies are available
                rn_path = root_node_modules / "react-native"
                if rn_path.exists():
                    self.print_success("React Native found in root node_modules")
                else:
                    self.print_warning("React Native not found in dependencies")
            else:
                self.print_warning("node_modules not found - run 'npm install' in mobile directory")
            
            return True
            
        except json.JSONDecodeError:
            self.print_error("package.json is not valid JSON")
            return False
        except Exception as e:
            self.print_error(f"Could not verify mobile setup: {e}")
            return False

    def verify_api_integration(self) -> bool:
        """Verify mobile app can integrate with backend"""
        self.print_header("API INTEGRATION VERIFICATION")
        
        # Check if mobile API configuration files exist
        mobile_api_config = self.project_root / "mobile" / "src" / "config" / "environment.ts"
        mobile_api_service = self.project_root / "mobile" / "src" / "services" / "api.ts"
        
        if mobile_api_config.exists():
            self.print_success("Mobile API configuration file found")
        else:
            self.print_error("Mobile API configuration file missing")
            return False
        
        if mobile_api_service.exists():
            self.print_success("Mobile API service file found")
        else:
            self.print_error("Mobile API service file missing")
            return False
        
        # Check service files
        services = [
            "motorcycleService.ts",
            "tuneService.ts",
            "connectionTest.ts"
        ]
        
        services_dir = self.project_root / "mobile" / "src" / "services"
        for service in services:
            service_path = services_dir / service
            if service_path.exists():
                self.print_success(f"Service found: {service}")
            else:
                self.print_warning(f"Service missing: {service}")
        
        return True

    def verify_documentation(self) -> bool:
        """Verify project documentation"""
        self.print_header("DOCUMENTATION VERIFICATION")
        
        docs = [
            ("README.md", "Main project README"),
            ("ROADMAP.md", "Project roadmap"),
            ("docs/FEATURE_SPECIFICATIONS.md", "Feature specifications"),
            ("docs/HARDWARE_INTEGRATION.md", "Hardware integration guide"),
            ("mobile/README.md", "Mobile app documentation"),
            ("CONTRIBUTING.md", "Contributing guidelines"),
            ("LICENSE", "Project license")
        ]
        
        all_present = True
        for doc_path, description in docs:
            full_path = self.project_root / doc_path
            if full_path.exists():
                self.print_success(f"{description}: {doc_path}")
            else:
                self.print_warning(f"Missing {description}: {doc_path}")
                all_present = False
        
        return all_present

    def generate_report(self):
        """Generate a comprehensive report"""
        self.print_header("PROJECT ORGANIZATION REPORT")
        
        total_checks = len(self.results)
        passed_checks = sum(1 for result in self.results.values() if result)
        
        print(f"\n{Colors.BOLD}Summary:{Colors.END}")
        print(f"  Total checks: {total_checks}")
        print(f"  Passed: {Colors.GREEN}{passed_checks}{Colors.END}")
        print(f"  Failed: {Colors.RED}{total_checks - passed_checks}{Colors.END}")
        
        if passed_checks == total_checks:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL CHECKS PASSED! 🎉{Colors.END}")
            print(f"{Colors.GREEN}RevSync project is properly organized and ready for development.{Colors.END}")
        else:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  SOME ISSUES FOUND{Colors.END}")
            print(f"{Colors.YELLOW}Please address the issues above before continuing.{Colors.END}")
        
        print(f"\n{Colors.BLUE}Quick Start:{Colors.END}")
        print(f"1. Start backend: cd backend && python manage.py runserver 8000")
        print(f"2. Start mobile: cd mobile && npm start")
        print(f"3. Run mobile app: npm run android (or npm run ios)")

    def run_verification(self):
        """Run all verification checks"""
        print(f"{Colors.BOLD}{Colors.PURPLE}")
        print("🔧 RevSync Project Organization Verification")
        print("============================================")
        print(f"{Colors.END}")
        
        checks = [
            ("Directory Structure", self.verify_directory_structure),
            ("Backend Setup", self.verify_backend_setup),
            ("Backend API", self.verify_backend_api),
            ("Mobile Setup", self.verify_mobile_setup),
            ("API Integration", self.verify_api_integration),
            ("Documentation", self.verify_documentation),
        ]
        
        for check_name, check_func in checks:
            try:
                result = check_func()
                self.results[check_name] = result
            except Exception as e:
                self.print_error(f"Check failed with exception: {e}")
                self.results[check_name] = False
        
        self.generate_report()

def main():
    if len(sys.argv) > 1:
        project_root = sys.argv[1]
    else:
        project_root = os.getcwd()
    
    verifier = ProjectVerifier(project_root)
    verifier.run_verification()

if __name__ == "__main__":
    main() 