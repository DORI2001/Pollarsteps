# Tests Directory Organization

## Directory Structure

```
tests/
├── integration/        # End-to-end integration tests
│   └── test_full_workflow.py
├── unit/              # Unit tests for services & utilities
│   ├── test_distance_utils.py
│   └── test_error_handling.py
├── test_integration.py    # Main integration test suite (11 tests)
├── test_db.py
├── test_query.py
├── validate_features.py
└── [legacy test files]
```

## Running Tests

### All Integration Tests
```bash
cd / && python test_integration.py
```

### Specific Test File
```bash
cd backend_app
python -m pytest ../tests/unit/test_distance_utils.py -v
```

### Coverage Report
```bash
python -m pytest tests/ --cov=app --cov-report=html
```

## Test Results

**Current Status:** ✅ 11/11 Integration Tests Passing

Tests verify:
- User Authentication (register, login, token refresh)
- Trip Management (create, read, update, delete)
- Location Tracking (add, edit, remove steps)
- Distance Calculations
- Error Handling (403, 404, validation)
- Trip Sharing & Public Access

## Test Categories

### Integration Tests (tests/test_integration.py)
- Full end-to-end workflows
- Database transactions
- Authentication flow
- CRUD operations
- Error scenarios

### Unit Tests (tests/unit/)
- Service layer functions
- Utility calculations
- Error handling logic
- Data validation

### Legacy Tests (tests/test_*.py)
- Database operations (test_db.py)
- Query functionality (test_query.py)
- Feature validation (validate_features.py)

## Adding New Tests

1. Place integration tests in `tests/integration/`
2. Place unit tests in `tests/unit/`
3. Use pytest framework
4. Follow naming: `test_*.py`
5. Run with: `pytest tests/ -v`
