#!/bin/bash

# Vercel Postgres Setup Verification Script
# This script verifies that the Vercel Postgres setup was completed correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local issues=0
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed"
        issues=$((issues + 1))
    else
        local node_version=$(node -v | sed 's/v//')
        local major_version=$(echo $node_version | cut -d. -f1)
        if [ "$major_version" -lt 18 ]; then
            print_error "Node.js version $node_version is too old (need 18+)"
            issues=$((issues + 1))
        else
            print_success "Node.js version $node_version is sufficient"
        fi
    fi
    
    # Check Vercel CLI
    if ! command_exists vercel; then
        print_warning "Vercel CLI is not installed globally"
    else
        print_success "Vercel CLI is available"
    fi
    
    # Check project structure
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "package.json not found"
        issues=$((issues + 1))
    else
        print_success "package.json found"
    fi
    
    if [ ! -f "$PROJECT_ROOT/prisma/schema.prisma" ]; then
        print_error "Prisma schema not found"
        issues=$((issues + 1))
    else
        print_success "Prisma schema found"
    fi
    
    return $issues
}

# Check environment variables
check_environment_variables() {
    print_status "Checking environment variables..."
    
    local issues=0
    local env_file="$PROJECT_ROOT/.env.local"
    
    if [ ! -f "$env_file" ]; then
        print_error ".env.local file not found"
        return 1
    fi
    
    # Required variables
    local required_vars=(
        "POSTGRES_URL"
        "POSTGRES_PRISMA_URL"
        "POSTGRES_URL_NON_POOLING"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" "$env_file"; then
            local value=$(grep "^$var=" "$env_file" | cut -d'=' -f2- | tr -d '"')
            if [ -n "$value" ] && [ "$value" != "your-*" ]; then
                print_success "$var is set"
            else
                print_warning "$var is set but appears to be a placeholder"
                issues=$((issues + 1))
            fi
        else
            print_error "$var is missing"
            issues=$((issues + 1))
        fi
    done
    
    # Optional variables
    local optional_vars=(
        "SPOTIFY_CLIENT_ID"
        "SPOTIFY_CLIENT_SECRET"
    )
    
    for var in "${optional_vars[@]}"; do
        if grep -q "^$var=" "$env_file"; then
            print_success "$var is set (optional)"
        else
            print_warning "$var is not set (optional)"
        fi
    done
    
    return $issues
}

# Check Prisma setup
check_prisma_setup() {
    print_status "Checking Prisma setup..."
    
    cd "$PROJECT_ROOT"
    
    local issues=0
    
    # Check if Prisma client can be generated
    print_status "Testing Prisma client generation..."
    if npm run db:generate >/dev/null 2>&1; then
        print_success "Prisma client generation successful"
    else
        print_error "Prisma client generation failed"
        issues=$((issues + 1))
    fi
    
    # Check if node_modules/@prisma/client exists
    if [ -d "node_modules/@prisma/client" ]; then
        print_success "Prisma client is installed"
    else
        print_error "Prisma client is not installed"
        issues=$((issues + 1))
    fi
    
    return $issues
}

# Check database connection
check_database_connection() {
    print_status "Testing database connection..."
    
    cd "$PROJECT_ROOT"
    
    # Load environment variables
    if [ -f ".env.local" ]; then
        set -a
        source .env.local
        set +a
    else
        print_error ".env.local not found"
        return 1
    fi
    
    # Test connection using our test script
    if npm run db:test >/dev/null 2>&1; then
        print_success "Database connection test passed"
        return 0
    else
        print_error "Database connection test failed"
        return 1
    fi
}

# Check Vercel deployment
check_vercel_deployment() {
    print_status "Checking Vercel deployment status..."
    
    cd "$PROJECT_ROOT"
    
    # Check if project is linked
    if [ -f ".vercel/project.json" ]; then
        print_success "Project is linked to Vercel"
    else
        print_warning "Project is not linked to Vercel"
        return 1
    fi
    
    # Try to get deployment list (requires authentication)
    if command_exists vercel; then
        local deployments=$(vercel ls 2>/dev/null | grep -c "Ready" || echo "0")
        if [ "$deployments" -gt 0 ]; then
            print_success "Found $deployments ready deployments"
            return 0
        else
            print_warning "No ready deployments found"
            return 1
        fi
    else
        print_warning "Vercel CLI not available, skipping deployment check"
        return 1
    fi
}

# Check application build
check_application_build() {
    print_status "Testing application build..."
    
    cd "$PROJECT_ROOT"
    
    # Test build process
    if npm run build >/dev/null 2>&1; then
        print_success "Application build successful"
        
        # Check if .next directory exists
        if [ -d ".next" ]; then
            print_success "Build output directory created"
            return 0
        else
            print_error "Build output directory not found"
            return 1
        fi
    else
        print_error "Application build failed"
        return 1
    fi
}

# Generate verification report
generate_report() {
    local total_checks=$1
    local passed_checks=$2
    local failed_checks=$((total_checks - passed_checks))
    
    print_status "Generating verification report..."
    
    cat > VERIFICATION_REPORT.md << EOF
# Vercel Postgres Setup Verification Report

**Date:** $(date -u)
**Total Checks:** $total_checks
**Passed:** $passed_checks
**Failed:** $failed_checks
**Success Rate:** $(( (passed_checks * 100) / total_checks ))%

## Verification Results

$([ $check_prereq_result -eq 0 ] && echo "✅ Prerequisites: All requirements met" || echo "❌ Prerequisites: $check_prereq_result issues found")
$([ $check_env_result -eq 0 ] && echo "✅ Environment Variables: All required variables set" || echo "❌ Environment Variables: $check_env_result issues found")
$([ $check_prisma_result -eq 0 ] && echo "✅ Prisma Setup: Client generation successful" || echo "❌ Prisma Setup: Issues detected")
$([ $check_db_result -eq 0 ] && echo "✅ Database Connection: Connection test passed" || echo "❌ Database Connection: Connection failed")
$([ $check_vercel_result -eq 0 ] && echo "✅ Vercel Deployment: Project linked and deployed" || echo "⚠️ Vercel Deployment: Not verified or not deployed")
$([ $check_build_result -eq 0 ] && echo "✅ Application Build: Build process successful" || echo "❌ Application Build: Build failed")

## Status Summary

$(if [ $failed_checks -eq 0 ]; then
    echo "🎉 **ALL CHECKS PASSED** - Your Vercel Postgres setup is complete and functional!"
    echo ""
    echo "### Ready for Development"
    echo "- Database is connected and accessible"
    echo "- All environment variables are configured"
    echo "- Application builds successfully"
    echo "- Ready for deployment"
elif [ $failed_checks -le 2 ]; then
    echo "⚠️ **SETUP MOSTLY COMPLETE** - Minor issues detected"
    echo ""
    echo "### Next Steps"
    echo "- Review failed checks above"
    echo "- Fix any environment variable issues"
    echo "- Ensure database connection is working"
else
    echo "❌ **SETUP INCOMPLETE** - Multiple issues detected"
    echo ""
    echo "### Required Actions"
    echo "- Run the setup script again: \`./scripts/setup-vercel-postgres.sh\`"
    echo "- Check environment variables in .env.local"
    echo "- Verify Vercel authentication"
fi)

## Commands to Fix Issues

\`\`\`bash
# Re-run automated setup
./scripts/setup-vercel-postgres.sh

# Test database connection
npm run db:test

# Generate Prisma client
npm run db:generate

# Test application build
npm run build

# Link Vercel project
vercel link

# Pull environment variables
vercel env pull .env.local
\`\`\`

## Next Steps

1. **If all checks passed:**
   - Start development: \`npm run dev\`
   - Open database admin: \`npm run db:studio\`
   - Deploy to production: \`vercel --prod\`

2. **If issues detected:**
   - Review the failed checks above
   - Run suggested fix commands
   - Re-run verification: \`./scripts/verify-setup.sh\`

---
Generated by verification script at $(date -u)
EOF

    print_success "Verification report created: VERIFICATION_REPORT.md"
}

# Main verification function
main() {
    echo
    echo "================================================================"
    echo "🔍 Vercel Postgres Setup Verification"
    echo "================================================================"
    echo
    
    local total_checks=0
    local passed_checks=0
    
    # Run all checks
    check_prerequisites
    check_prereq_result=$?
    total_checks=$((total_checks + 1))
    [ $check_prereq_result -eq 0 ] && passed_checks=$((passed_checks + 1))
    
    check_environment_variables
    check_env_result=$?
    total_checks=$((total_checks + 1))
    [ $check_env_result -eq 0 ] && passed_checks=$((passed_checks + 1))
    
    check_prisma_setup
    check_prisma_result=$?
    total_checks=$((total_checks + 1))
    [ $check_prisma_result -eq 0 ] && passed_checks=$((passed_checks + 1))
    
    check_database_connection
    check_db_result=$?
    total_checks=$((total_checks + 1))
    [ $check_db_result -eq 0 ] && passed_checks=$((passed_checks + 1))
    
    check_vercel_deployment
    check_vercel_result=$?
    total_checks=$((total_checks + 1))
    [ $check_vercel_result -eq 0 ] && passed_checks=$((passed_checks + 1))
    
    check_application_build
    check_build_result=$?
    total_checks=$((total_checks + 1))
    [ $check_build_result -eq 0 ] && passed_checks=$((passed_checks + 1))
    
    # Generate report
    generate_report $total_checks $passed_checks
    
    # Final status
    echo
    echo "================================================================"
    echo "📊 Verification Summary"
    echo "================================================================"
    echo
    print_status "Total checks: $total_checks"
    print_status "Passed: $passed_checks"
    print_status "Failed: $((total_checks - passed_checks))"
    echo
    
    if [ $passed_checks -eq $total_checks ]; then
        print_success "🎉 All checks passed! Your setup is complete and ready."
        echo
        print_status "You can now:"
        echo "  • Start development: npm run dev"
        echo "  • Open database admin: npm run db:studio"
        echo "  • Deploy to production: vercel --prod"
        echo
        exit 0
    elif [ $((total_checks - passed_checks)) -le 2 ]; then
        print_warning "⚠️ Setup mostly complete with minor issues."
        echo
        print_status "Review the report and fix remaining issues:"
        echo "  • Check VERIFICATION_REPORT.md for details"
        echo "  • Run suggested fix commands"
        echo
        exit 1
    else
        print_error "❌ Multiple issues detected. Setup may be incomplete."
        echo
        print_status "Recommended actions:"
        echo "  • Re-run setup: ./scripts/setup-vercel-postgres.sh"
        echo "  • Check VERIFICATION_REPORT.md for details"
        echo
        exit 2
    fi
}

# Run main function
main "$@"